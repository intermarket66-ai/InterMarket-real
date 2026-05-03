import React, { useState } from 'react';
import { Modal, Button, Row, Col, Badge, Spinner, Form } from 'react-bootstrap';
import { supabase } from '../../database/supabaseconfig';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { enviarNotificacionPorCorreo } from '../../services/emailService';

const CarritoModal = ({ mostrar, setMostrar, carrito, setCarrito, total, onCompraExitosa }) => {
    const { user, session } = useAuth();
    const navegar = useNavigate();
    const [procesando, setProcesando] = useState(false);
    const [direcciones, setDirecciones] = useState([]);
    const [idDireccionSel, setIdDireccionSel] = useState("");
    const [cargandoDirecciones, setCargandoDirecciones] = useState(false);

    React.useEffect(() => {
        if (mostrar && user) {
            cargarDirecciones();
        }
    }, [mostrar, user]);

    const cargarDirecciones = async () => {
        setCargandoDirecciones(true);
        try {
            const { data } = await supabase
                .from("direcciones")
                .select("*")
                .eq("id_usuario", user.id)
                .order("creado_en", { ascending: false });
            
            setDirecciones(data || []);
            if (data && data.length > 0) {
                setIdDireccionSel(data[0].id_direccion);
            }
        } catch (err) {
            console.error("Error cargando direcciones:", err);
        } finally {
            setCargandoDirecciones(false);
        }
    };

    const actualizarCantidad = (id_producto, nuevaCantidad, stockDisponible) => {
        if (nuevaCantidad < 1) return;
        if (stockDisponible !== undefined && nuevaCantidad > stockDisponible) {
            alert(`Solo hay ${stockDisponible} unidades disponibles.`);
            return;
        }
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

        if (!idDireccionSel) {
            alert("Por favor, selecciona una dirección de entrega.");
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
                body: JSON.stringify({ 
                    carrito, 
                    id_direccion: idDireccionSel 
                }),
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
                localStorage.setItem('direccionPendiente', idDireccionSel);
                
                // Redirect to Stripe
                window.location.href = data.url;
            } else {
                throw new Error("No se obtuvo la URL de pago.");
            }
            
        } catch (err) {
            console.error("Error al procesar compra:", err);
            // Mostrar mensaje más descriptivo si es posible
            const mensajeError = err.message.includes('Invalid URL') 
                ? "Error de URL: Posiblemente una imagen de producto es demasiado grande o inválida para Stripe."
                : `Ocurrió un error al procesar tu compra: ${err.message}`;
            alert(mensajeError);
        } finally {
            setProcesando(false);
        }
    };

    const simularCompra = async () => {
        if (!user) {
            alert("Debes iniciar sesión para simular una compra.");
            return;
        }

        if (!idDireccionSel) {
            alert("Por favor, selecciona una dirección de entrega.");
            return;
        }

        try {
            setProcesando(true);
            const idOperacion = Date.now().toString(); // ID único para esta operación
            const response = await fetch('/.netlify/functions/simular-pago', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
                },
                body: JSON.stringify({ 
                    carrito, 
                    total, 
                    id_operacion: idOperacion,
                    id_direccion: idDireccionSel
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error en la simulación');
            }

            const data = await response.json();
            if (data.success) {
                alert('¡Pago Simulado Exitosamente! La venta ha sido registrada.');
                setCarrito([]);
                localStorage.removeItem('carrito');
                window.dispatchEvent(new Event('carritoActualizado'));
                setMostrar(false);
            }
        } catch (err) {
            console.error("Error en simulación:", err);
            alert("Error al simular el pago: " + err.message);
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
                                        C${parseFloat(item.precio_venta).toFixed(2)} c/u
                                    </div>
                                    {item.stock !== undefined && item.stock !== null && (
                                        <div className={`small mt-1 fw-bold ${item.stock <= 3 ? 'text-danger' : 'text-success'}`}>
                                            <i className="bi bi-box-seam me-1"></i>
                                            {item.stock === 0 ? 'Sin stock' : `${item.stock} disponibles`}
                                        </div>
                                    )}
                                </Col>
                                <Col xs={4} className="text-end">
                                    <div className="d-flex align-items-center justify-content-end gap-2">
                                        <Button 
                                            variant="outline-secondary" 
                                            size="sm"
                                            onClick={() => actualizarCantidad(item.id_producto, item.cantidad - 1, item.stock)}
                                        >
                                            -
                                        </Button>
                                        <span className="mx-2 fw-bold">{item.cantidad}</span>
                                        <Button 
                                            variant="outline-secondary" 
                                            size="sm"
                                            onClick={() => actualizarCantidad(item.id_producto, item.cantidad + 1, item.stock)}
                                            disabled={item.stock !== undefined && item.stock !== null && item.cantidad >= item.stock}
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
                            <h6 className="fw-bold mb-3"><i className="bi bi-geo-alt me-2 text-primary"></i>Dirección de Entrega</h6>
                            
                            {direcciones.length === 0 ? (
                                <div className="alert alert-warning py-2 small d-flex justify-content-between align-items-center">
                                    <span>No tienes direcciones guardadas.</span>
                                    <Button size="sm" variant="warning" onClick={() => { setMostrar(false); navegar("/perfil"); }}>
                                        Añadir ahora
                                    </Button>
                                </div>
                            ) : (
                                <Form.Select 
                                    className="mb-3"
                                    value={idDireccionSel}
                                    onChange={(e) => setIdDireccionSel(e.target.value)}
                                    disabled={procesando}
                                >
                                    {direcciones.map(dir => (
                                        <option key={dir.id_direccion} value={dir.id_direccion}>
                                            {dir.nombre_calle} ({dir.nombre} {dir.apellido})
                                        </option>
                                    ))}
                                </Form.Select>
                            )}

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
                        <Button variant="outline-primary" onClick={simularCompra} disabled={procesando}>
                            {procesando ? '...' : 'Simular Pago'}
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