import React, { useState } from 'react';
import { Modal, Button, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { supabase } from '../../database/supabaseconfig';
import { useAuth } from '../../context/AuthContext';
import { enviarNotificacionPorCorreo } from '../../services/emailService';

const CarritoModal = ({ mostrar, setMostrar, carrito, setCarrito, total, onCompraExitosa }) => {
    const { user, session } = useAuth();
    const [procesando, setProcesando] = useState(false);

    const actualizarCantidad = (id_producto, nuevaCantidad) => {
        if (nuevaCantidad < 1) return;
        
        const nuevoCarrito = carrito.map(item =>
            item.id_producto === id_producto 
                ? { ...item, cantidad: nuevaCantidad }
                : item
        );
        setCarrito(nuevoCarrito);
        localStorage.setItem('carrito', JSON.stringify(nuevoCarrito));
        window.dispatchEvent(new Event('carritoActualizado'));
    };

    const eliminarDelCarrito = (id_producto) => {
        const nuevoCarrito = carrito.filter(item => item.id_producto !== id_producto);
        setCarrito(nuevoCarrito);
        localStorage.setItem('carrito', JSON.stringify(nuevoCarrito));
        window.dispatchEvent(new Event('carritoActualizado'));
    };

    const vaciarCarrito = () => {
        setCarrito([]);
        localStorage.removeItem('carrito');
        window.dispatchEvent(new Event('carritoActualizado'));
    };

    const realizarCompra = async () => {
        if (!user) {
            alert("Debes iniciar sesión como comprador para realizar una compra.");
            return;
        }
        
        try {
            setProcesando(true);
            
            // Llamar a la Netlify Function
            const response = await fetch('/.netlify/functions/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
                },
                body: JSON.stringify({ carrito }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al procesar la compra');
            }

            const data = await response.json();
            
            if (data?.url) {
                // Save cart temporarily so we can process it after redirect
                localStorage.setItem('carritoPendiente', JSON.stringify(carrito));
                localStorage.setItem('totalPendiente', total.toString());
                
                // Redirect to Stripe
                window.location.href = data.url;
            } else {
                throw new Error("No se obtuvo la URL de pago.");
            }
            
        } catch (err) {
            console.error("Error al procesar compra:", err);
            alert("Ocurrió un error al procesar tu compra.");
        } finally {
            setProcesando(false);
        }
    };

    return (
        <Modal show={mostrar} onHide={() => setMostrar(false)} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    <i className="bi bi-cart-fill me-2"></i>
                    Mi Carrito ({carrito.length} productos)
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {carrito.length === 0 ? (
                    <div className="text-center py-5">
                        <i className="bi bi-cart-x display-1 text-muted mb-3"></i>
                        <h4>Tu carrito está vacío</h4>
                    </div>
                ) : (
                    <>
                        {carrito.map((item) => (
                            <Row key={item.id_producto} className="mb-3 align-items-center border-bottom pb-3">
                                <Col xs={3}>
                                    {item.imagen_url && item.imagen_url.length > 0 && (
                                        <img 
                                            src={item.imagen_url[0]} 
                                            alt={item.nombre_producto}
                                            style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px' }}
                                        />
                                    )}
                                </Col>
                                <Col xs={5}>
                                    <strong>{item.nombre_producto}</strong>
                                    <div className="text-muted small">
                                        ${parseFloat(item.precio_venta).toFixed(2)} c/u
                                    </div>
                                </Col>
                                <Col xs={4} className="text-end">
                                    <div className="d-flex align-items-center justify-content-end gap-2">
                                        <Button 
                                            variant="outline-secondary" 
                                            size="sm"
                                            onClick={() => actualizarCantidad(item.id_producto, item.cantidad - 1)}
                                        >
                                            -
                                        </Button>
                                        <span className="mx-2 fw-bold">{item.cantidad}</span>
                                        <Button 
                                            variant="outline-secondary" 
                                            size="sm"
                                            onClick={() => actualizarCantidad(item.id_producto, item.cantidad + 1)}
                                        >
                                            +
                                        </Button>
                                        <Button 
                                            variant="outline-danger" 
                                            size="sm"
                                            className="ms-3"
                                            onClick={() => eliminarDelCarrito(item.id_producto)}
                                        >
                                            <i className="bi bi-trash"></i>
                                        </Button>
                                    </div>
                                    <div className="mt-1 fw-bold text-success">
                                        ${(parseFloat(item.precio_venta) * item.cantidad).toFixed(2)}
                                    </div>
                                </Col>
                            </Row>
                        ))}

                        <div className="mt-4 pt-3 border-top">
                            <Row>
                                <Col>
                                    <h5>Total a pagar:</h5>
                                </Col>
                                <Col className="text-end">
                                    <h4 className="text-success fw-bold">
                                        ${total.toFixed(2)}
                                    </h4>
                                </Col>
                            </Row>
                        </div>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => setMostrar(false)}>
                    Seguir Comprando
                </Button>
                {carrito.length > 0 && (
                    <>
                        <Button variant="outline-danger" onClick={vaciarCarrito} disabled={procesando}>
                            Vaciar Carrito
                        </Button>
                        <Button variant="success" onClick={realizarCompra} disabled={procesando}>
                            {procesando ? (
                                <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />Procesando...</>
                            ) : (
                                <><i className="bi bi-credit-card me-2"></i>Realizar Compra</>
                            )}
                        </Button>
                    </>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default CarritoModal;