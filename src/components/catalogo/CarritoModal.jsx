import React from 'react';
import { Modal, Button, Row, Col, Badge } from 'react-bootstrap';

const CarritoModal = ({ mostrar, setMostrar, carrito, setCarrito, total }) => {

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

    const realizarCompra = () => {
        alert("¡Compra realizada con éxito! (Esta funcionalidad se completará más adelante)");
        vaciarCarrito();
        setMostrar(false);
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
                                    {item.url_imagenes && (
                                        <img 
                                            src={item.url_imagenes} 
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
                        <Button variant="outline-danger" onClick={vaciarCarrito}>
                            Vaciar Carrito
                        </Button>
                        <Button variant="success" onClick={realizarCompra}>
                            <i className="bi bi-credit-card me-2"></i>
                            Realizar Compra
                        </Button>
                    </>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default CarritoModal;