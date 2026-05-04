import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';

const CardProductoModerno = ({
    producto,
    abrirModalDetalles,
    abrirModalContacto,
    agregarAlCarrito,
    miTiendaId
}) => {
    const esOferta = producto.precio_original > producto.precio_venta;
    const porcentajeDescuento = esOferta
        ? Math.round((1 - producto.precio_venta / producto.precio_original) * 100)
        : 0;

    return (
        <Card className="border-0 shadow-sm h-100 modern-card overflow-hidden bg-white">
            {/* Contenedor de Imagen */}
            <div
                className="position-relative overflow-hidden"
                style={{ cursor: 'pointer', aspectRatio: '1/1' }}
                onClick={() => abrirModalDetalles(producto)}
            >
                <Card.Img
                    variant="top"
                    src={producto.imagen_url?.[0] || 'https://via.placeholder.com/400?text=Sin+Imagen'}
                    alt={producto.nombre_producto}
                    className="w-100 h-100 object-fit-cover transition-zoom"
                />

                {/* Badges Flotantes */}
                <div className="position-absolute top-0 start-0 m-2 d-flex flex-column gap-1">
                    {esOferta && (
                        <Badge className="badge-modern-oferta">
                            -{porcentajeDescuento}%
                        </Badge>
                    )}
                    {producto.categorias?.nombre_categoria && (
                        <Badge className="badge-modern-categoria">
                            {producto.categorias.nombre_categoria}
                        </Badge>
                    )}
                </div>

                {/* Badge de Stock Bajo */}
                {producto.stock > 0 && producto.stock <= 5 && (
                    <div className="position-absolute bottom-0 start-0 w-100 p-2">
                        <div className="badge-modern-stock">
                            ¡Solo {producto.stock} disponibles!
                        </div>
                    </div>
                )}

                {/* Overlay de Agotado */}
                {producto.stock === 0 && (
                    <div className="agotado-overlay">
                        <span>Agotado</span>
                    </div>
                )}
            </div>

            <Card.Body className="d-flex flex-column p-2 p-md-3">
                {/* Título */}
                <h3
                    className="product-title-modern"
                    onClick={() => abrirModalDetalles(producto)}
                >
                    {producto.nombre_producto}
                </h3>

                <div className="mt-auto">
                    {/* Precios */}
                    <div className="d-flex align-items-baseline gap-2 mb-2 flex-wrap">
                        <span className="price-modern">
                            C${parseFloat(producto.precio_venta || 0).toLocaleString()}
                        </span>
                        {esOferta && (
                            <span className="price-old-modern">
                                C${parseFloat(producto.precio_original).toLocaleString()}
                            </span>
                        )}
                    </div>

                    {/* Acciones */}
                    <div className="d-flex gap-2">
                        <Button
                            variant="light"
                            className="btn-modern-action shadow-sm"
                            onClick={() => abrirModalContacto(producto)}
                            title="Contactar vendedor"
                        >
                            <i className="bi bi-chat-dots"></i>
                        </Button>
                        <Button
                            variant={producto.id_tienda === miTiendaId ? "outline-warning" : "primary"}
                            className="btn-modern-add flex-grow-1 shadow-sm"
                            disabled={producto.stock === 0 || producto.id_tienda === miTiendaId}
                            onClick={() => agregarAlCarrito(producto)}
                        >
                            <i className={`bi bi-${producto.id_tienda === miTiendaId ? 'shop' : 'cart-plus'} me-1`}></i>
                            {producto.id_tienda === miTiendaId ? 'Es tuyo' : 'Añadir'}
                        </Button>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

export default CardProductoModerno;
