import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';

const TarjetaCatalogo = ({ 
    producto, 
    abrirModalDetalles, 
    abrirModalContacto,
    agregarAlCarrito, 
    miTiendaId 
}) => {
    return (
        <Card className="h-100 border-0 shadow-sm product-card-hover bg-white" style={{ borderRadius: '15px' }}>
            <div
                className="position-relative overflow-hidden ratio ratio-1x1"
                style={{ cursor: 'pointer', borderTopLeftRadius: '15px', borderTopRightRadius: '15px' }}
                onClick={() => abrirModalDetalles(producto)}
            >
                <Card.Img
                    variant="top"
                    src={producto.imagen_url?.[0] || 'https://via.placeholder.com/400?text=Sin+Imagen'}
                    alt={producto.nombre_producto}
                    className="position-absolute top-0 start-0 w-100 h-100 object-fit-cover"
                    onError={(e) => e.target.src = 'https://via.placeholder.com/400?text=Error'}
                />
                {producto.precio_original > producto.precio_venta && (
                    <div className="position-absolute top-0 start-0 m-3">
                        <Badge bg="danger" className="px-2 py-1 shadow-sm fs-6 rounded-pill">
                            -{Math.round((1 - producto.precio_venta / producto.precio_original) * 100)}%
                        </Badge>
                    </div>
                )}
                {producto.stock === 0 && (
                    <div className="position-absolute top-0 end-0 m-3">
                        <Badge bg="dark" className="px-2 py-1 shadow-sm fs-6 rounded-pill">
                            Agotado
                        </Badge>
                    </div>
                )}
            </div>

            <Card.Body className="d-flex flex-column p-3">
                <div className="mb-2">
                    <span className="text-uppercase text-primary fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
                        {producto.categorias?.nombre_categoria || 'General'}
                    </span>
                    <span className="text-muted ms-2" style={{ fontSize: '0.75rem' }}>
                        | {producto.perfiles?.nombre_completo || 'Tienda Local'}
                    </span>
                </div>

                <Card.Title
                    className="fw-bold mb-3 fs-5 text-dark"
                    style={{ cursor: 'pointer', lineHeight: '1.4', minHeight: '2.8em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    onClick={() => abrirModalDetalles(producto)}
                >
                    {producto.nombre_producto}
                </Card.Title>

                <div className="mt-auto">
                    <div className="d-flex align-items-center mb-4">
                        <span className="fs-3 fw-bold text-dark me-2">
                            C${parseFloat(producto.precio_venta || 0).toFixed(2)}
                        </span>
                        {producto.precio_original > producto.precio_venta && (
                            <span className="text-decoration-line-through text-muted">
                                C${parseFloat(producto.precio_original).toFixed(2)}
                            </span>
                        )}
                    </div>
                    
                    {/* Stock badge */}
                    {producto.stock !== null && producto.stock !== undefined && producto.stock <= 5 && producto.stock > 0 && (
                        <div className="mb-3">
                            <span className="badge bg-warning text-dark rounded-pill px-3 py-2">
                                <i className="bi bi-exclamation-triangle me-2"></i>¡Solo quedan {producto.stock}!
                            </span>
                        </div>
                    )}

                    <div className="d-flex gap-2">
                        <Button
                            variant="light"
                            className="rounded-pill flex-shrink-0 border d-flex align-items-center justify-content-center"
                            onClick={() => abrirModalContacto(producto)}
                            style={{ width: '42px', height: '42px' }}
                        >
                            <i className="bi bi-chat-text text-secondary"></i>
                        </Button>
                        <Button
                            variant={producto.id_tienda === miTiendaId ? "outline-secondary" : producto.stock === 0 ? "secondary" : "primary"}
                            className="w-100 fw-bold rounded-pill d-flex align-items-center justify-content-center"
                            style={{ height: '42px', fontSize: '0.9rem' }}
                            onClick={() => {
                                if (producto.id_tienda === miTiendaId) {
                                    alert('No puedes comprar tus propios productos.');
                                } else if (producto.stock === 0) {
                                    alert('Este producto está agotado.');
                                } else {
                                    agregarAlCarrito(producto);
                                }
                            }}
                            disabled={producto.id_tienda === miTiendaId || producto.stock === 0}
                        >
                            <i className={`bi bi-${producto.id_tienda === miTiendaId ? 'shop' : producto.stock === 0 ? 'x-circle' : 'cart-plus'} me-2 fs-5`}></i>
                            {producto.id_tienda === miTiendaId ? 'Es tuyo' : producto.stock === 0 ? 'Agotado' : 'Añadir'}
                        </Button>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

export default TarjetaCatalogo;
