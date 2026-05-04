import React from 'react';

const TarjetaCatalogoMovile = ({ 
    producto, 
    abrirModalDetalles, 
    agregarAlCarrito, 
    miTiendaId 
}) => {
    const esOferta = producto.precio_original > producto.precio_venta;
    const porcentajeDescuento = esOferta 
        ? Math.round((1 - producto.precio_venta / producto.precio_original) * 100) 
        : 0;

    // Simulamos algunos datos para el estilo visual de la foto
    const estrellas = (Math.random() * (5 - 4) + 4).toFixed(1);
    const vendidos = Math.floor(Math.random() * 500) + 50;

    return (
        <div className="shein-card mb-3" onClick={() => abrirModalDetalles(producto)} style={{ cursor: 'pointer' }}>
            {/* Contenedor de Imagen Vertical */}
            <div className="shein-img-container">
                <img 
                    src={producto.imagen_url?.[0] || 'https://via.placeholder.com/400x533?text=Sin+Imagen'} 
                    alt={producto.nombre_producto} 
                    className="shein-img"
                    onError={(e) => e.target.src = 'https://via.placeholder.com/400x533?text=Error'}
                />
                {/* Badge de Oferta flotante (opcional) */}
                {esOferta && (
                    <div className="shein-floating-badge">
                        -{porcentajeDescuento}%
                    </div>
                )}
            </div>

            {/* Información del Producto */}
            <div className="shein-content">
                {/* Tienda / Marca */}
                <div className="shein-store-row">
                        <span className="shein-trends-tag me-1">Trends</span>
                        <span className="shein-store-name">
                            {producto.perfiles?.nombre_completo || 'Tienda Local'} 
                            <i className="bi bi-chevron-right ms-1" style={{ fontSize: '0.6rem' }}></i>
                        </span>
                </div>

                {/* Título con insignia Local */}
                <h4 className="shein-title">
                    <span className="shein-local-badge me-1">Local</span>
                    {producto.nombre_producto}
                </h4>

                {/* Valoraciones y Vendidos */}
                <div className="shein-stats">
                    <span>{vendidos} vendidos</span>
                    <span className="mx-1">|</span>
                    <span className="shein-stars">
                        <i className="bi bi-star-fill me-1 text-warning"></i>
                        {estrellas} ({vendidos}+)
                    </span>
                </div>

                {/* Precio Estilo SHEIN */}
                <div className="shein-price-row">
                    <span className="shein-current-price">
                        <small>C$</small>{parseFloat(producto.precio_venta || 0).toFixed(2)}
                    </span>
                    {esOferta && (
                        <span className="shein-discount-tag ms-2">-{porcentajeDescuento}%</span>
                    )}
                </div>

                {/* Envío / Entrega */}
                <div className="shein-shipping">
                    <i className="bi bi-truck me-1"></i>
                    <span>4-5 Días Hábiles</span>
                </div>
            </div>
        </div>
    );
};

export default TarjetaCatalogoMovile;
