import React, { useState, useEffect } from 'react';
import { Modal, Row, Col, Badge, Spinner, Button, Card } from 'react-bootstrap';
import { supabase } from '../../database/supabaseconfig';

const ModalTienda = ({ mostrar, onCerrar, tiendaId, onVerProducto }) => {
    const [tienda, setTienda] = useState(null);
    const [productos, setProductos] = useState([]);
    const [calificaciones, setCalificaciones] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [filtro, setFiltro] = useState('todos');

    useEffect(() => {
        if (mostrar && tiendaId) {
            cargarTienda();
        }
    }, [mostrar, tiendaId]);

    const cargarTienda = async () => {
        setCargando(true);
        try {
            const [{ data: tiendaData }, { data: productosData }, { data: califData }] = await Promise.all([
                supabase.from('tiendas').select('*').eq('id_tienda', tiendaId).single(),
                supabase.from('productos').select('*, categorias(nombre_categoria)').eq('id_tienda', tiendaId).order('creado_en', { ascending: false }),
                supabase.from('calificaciones_tiendas').select('puntuacion').eq('tienda_id', tiendaId),
            ]);
            setTienda(tiendaData);
            setProductos(productosData || []);
            setCalificaciones(califData || []);
        } catch (err) {
            console.error('Error cargando tienda:', err);
        } finally {
            setCargando(false);
        }
    };

    const promedio = calificaciones.length > 0
        ? (calificaciones.reduce((a, c) => a + c.puntuacion, 0) / calificaciones.length).toFixed(1)
        : null;

    const categorias = [...new Set(productos.map(p => p.categorias?.nombre_categoria).filter(Boolean))];

    const productosFiltrados = filtro === 'todos'
        ? productos
        : filtro === 'ofertas'
            ? productos.filter(p => p.precio_original > p.precio_venta)
            : productos.filter(p => p.categorias?.nombre_categoria === filtro);

    const Estrellas = ({ valor }) => (
        <span className="text-warning" style={{ fontSize: '0.85rem' }}>
            {[1, 2, 3, 4, 5].map(s => (
                <i key={s} className={`bi bi-star${s <= Math.round(valor) ? '-fill' : ''}`}></i>
            ))}
        </span>
    );

    return (
        <Modal show={mostrar} onHide={onCerrar} size="xl" centered scrollable>
            <Modal.Header closeButton className="border-0 p-0 position-relative overflow-hidden" style={{ minHeight: '180px' }}>
                {/* Banner de la Tienda */}
                <div
                    className="w-100 h-100 position-absolute top-0 start-0"
                    style={{
                        background: tienda?.imagen_url
                            ? `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${tienda.imagen_url}) center/cover`
                            : 'linear-gradient(135deg, #0f4c5c 0%, #1a7a8a 100%)',
                    }}
                />
                <div className="position-relative z-1 p-4 w-100 text-white">
                    <div className="d-flex align-items-center gap-3 mb-3">
                        {/* Logo de la Tienda */}
                        <div
                            className="rounded-circle shadow-lg d-flex align-items-center justify-content-center flex-shrink-0 border border-3 border-white"
                            style={{
                                width: '80px', height: '80px',
                                background: tienda?.imagen_url ? `url(${tienda.imagen_url}) center/cover` : 'rgba(255,255,255,0.2)',
                                backdropFilter: 'blur(4px)'
                            }}
                        >
                            {!tienda?.imagen_url && <i className="bi bi-shop fs-2 text-white"></i>}
                        </div>
                        <div>
                            <h3 className="fw-bold mb-1 text-white">{tienda?.nombre_tienda || 'Tienda'}</h3>
                            <div className="d-flex align-items-center gap-3 flex-wrap">
                                {promedio && (
                                    <span className="d-flex align-items-center gap-1">
                                        <Estrellas valor={parseFloat(promedio)} />
                                        <small className="opacity-75">{promedio} ({calificaciones.length} reseñas)</small>
                                    </span>
                                )}
                                <Badge bg="light" text="dark" className="px-3 py-1 rounded-pill">
                                    <i className="bi bi-box-seam me-1"></i>{productos.length} productos
                                </Badge>
                            </div>
                            {tienda?.descripcion && (
                                <p className="mb-0 mt-1 opacity-75 small" style={{ maxWidth: '400px' }}>{tienda.descripcion}</p>
                            )}
                        </div>
                    </div>
                </div>
            </Modal.Header>

            <Modal.Body className="p-0">
                {/* Filtros de Categoría */}
                <div className="bg-white border-bottom px-4 py-3 d-flex gap-2 overflow-auto" style={{ scrollbarWidth: 'none' }}>
                    <button
                        type="button"
                        className={`btn btn-sm rounded-pill px-3 flex-shrink-0 ${filtro === 'todos' ? 'btn-dark' : 'btn-outline-secondary'}`}
                        onClick={() => setFiltro('todos')}
                    >
                        Todos
                    </button>
                    <button
                        type="button"
                        className={`btn btn-sm rounded-pill px-3 flex-shrink-0 ${filtro === 'ofertas' ? 'btn-danger' : 'btn-outline-danger'}`}
                        onClick={() => setFiltro('ofertas')}
                    >
                        <i className="bi bi-percent me-1"></i>Ofertas
                    </button>
                    {categorias.map(cat => (
                        <button
                            key={cat}
                            type="button"
                            className={`btn btn-sm rounded-pill px-3 flex-shrink-0 ${filtro === cat ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setFiltro(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Cuadrícula de Productos */}
                <div className="p-4">
                    {cargando ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="text-muted mt-3">Cargando productos...</p>
                        </div>
                    ) : productosFiltrados.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="bi bi-box-seam display-4 text-muted d-block mb-3"></i>
                            <h5 className="text-muted">No hay productos en esta categoría</h5>
                        </div>
                    ) : (
                        <Row className="g-3">
                            {productosFiltrados.map(producto => {
                                const esOferta = producto.precio_original > producto.precio_venta;
                                const descuento = esOferta
                                    ? Math.round((1 - producto.precio_venta / producto.precio_original) * 100)
                                    : 0;
                                const imagen = Array.isArray(producto.imagen_url)
                                    ? producto.imagen_url[0]
                                    : producto.imagen_url;

                                return (
                                    <Col key={producto.id_producto} xs={6} sm={4} md={3}>
                                        <Card
                                            className="border-0 h-100 product-card-hover shadow-sm"
                                            style={{ cursor: 'pointer', borderRadius: '12px', overflow: 'hidden' }}
                                            onClick={() => onVerProducto(producto)}
                                        >
                                            {/* Imagen del Producto */}
                                            <div className="position-relative" style={{ paddingBottom: '120%', background: '#f8f9fa' }}>
                                                <img
                                                    src={imagen || 'https://via.placeholder.com/300?text=Sin+Imagen'}
                                                    alt={producto.nombre_producto}
                                                    className="position-absolute top-0 start-0 w-100 h-100"
                                                    style={{ objectFit: 'cover' }}
                                                    onError={(e) => e.target.src = 'https://via.placeholder.com/300?text=Sin+Imagen'}
                                                />
                                                {esOferta && (
                                                    <Badge
                                                        bg="danger"
                                                        className="position-absolute top-0 end-0 m-2 px-2 py-1"
                                                        style={{ borderRadius: '8px', fontSize: '0.7rem' }}
                                                    >
                                                        -{descuento}%
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <Card.Body className="p-2">
                                                <p
                                                    className="mb-1 fw-500 text-dark"
                                                    style={{
                                                        fontSize: '0.82rem',
                                                        lineHeight: '1.3',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden'
                                                    }}
                                                >
                                                    {producto.nombre_producto}
                                                </p>
                                                <div className="d-flex align-items-center gap-2 mt-1">
                                                    <span className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>
                                                        C${parseFloat(producto.precio_venta || 0).toFixed(2)}
                                                    </span>
                                                    {esOferta && (
                                                        <span className="text-muted text-decoration-line-through" style={{ fontSize: '0.75rem' }}>
                                                            C${parseFloat(producto.precio_original).toFixed(2)}
                                                        </span>
                                                    )}
                                                </div>
                                                {producto.categorias?.nombre_categoria && (
                                                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                        {producto.categorias.nombre_categoria}
                                                    </small>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                );
                            })}
                        </Row>
                    )}
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default ModalTienda;
