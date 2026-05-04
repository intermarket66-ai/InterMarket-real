import React from 'react';

const TarjetaCatalogomovile = ({ 
    producto, 
    abrirModalDetalles 
}) => {
    const esOferta = producto.precio_original > producto.precio_venta;
    const porcentajeDescuento = esOferta 
        ? Math.round((1 - producto.precio_venta / producto.precio_original) * 100) 
        : 0;

    return (
        <div className="shein-style-card" onClick={() => abrirModalDetalles(producto)}>
            {/* Imagen Vertical (Lo más importante) */}
            <div className="shein-image-box">
                <img 
                    src={producto.imagen_url?.[0] || 'https://via.placeholder.com/400x533?text=InterMarket'} 
                    alt={producto.nombre_producto} 
                    className="shein-main-img"
                />
                {esOferta && (
                    <div className="shein-floating-badge">
                        -{porcentajeDescuento}%
                    </div>
                )}
            </div>

            {/* Contenido Esencial */}
            <div className="shein-info-container">
                {/* Título y Badge Local */}
                <h3 className="shein-product-title">
                    <span className="shein-badge-local">Local</span>
                    {producto.nombre_producto}
                </h3>

                {/* Tienda (Importante para saber a quién le compras) */}
                <span className="shein-store-text">
                    {producto.perfiles?.nombre_completo || 'Tienda Local'}
                </span>

                {/* Precio (Resaltado como en la foto) */}
                <div className="shein-price-container">
                    <span className="shein-amount-red">
                        C${parseFloat(producto.precio_venta || 0).toFixed(2)}
                    </span>
                    {esOferta && (
                        <span className="shein-old-price">
                            C${parseFloat(producto.precio_original).toFixed(2)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TarjetaCatalogomovile;
