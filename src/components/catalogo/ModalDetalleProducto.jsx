import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Badge, Form, Spinner, Card, Carousel } from 'react-bootstrap';
import { supabase } from '../../database/supabaseconfig';
import { useAuth } from '../../context/AuthContext';

const ModalDetalleProducto = ({ mostrar, setMostrar, producto, agregarAlCarrito }) => {
    const { user } = useAuth();
    const [tienda, setTienda] = useState(null);
    const [vendedor, setVendedor] = useState(null);
    const [perfilUsuario, setPerfilUsuario] = useState(null);
    
    const [resenas, setResenas] = useState([]);
    const [calificacionesTienda, setCalificacionesTienda] = useState([]);
    const [cargando, setCargando] = useState(false);
    
    const [comprado, setComprado] = useState(false);
    
    // Estados para formulario de reseña de producto
    const [nuevaResena, setNuevaResena] = useState({ calificacion: 5, comentario: '' });
    
    // Estados para formulario de calificación de tienda
    const [nuevaCalificacionTienda, setNuevaCalificacionTienda] = useState({ puntuacion: 5, comentario: '' });

    useEffect(() => {
        if (mostrar && producto) {
            cargarDetalles();
        }
    }, [mostrar, producto]);

    const cargarDetalles = async () => {
        setCargando(true);
        try {
            // 1. Obtener datos de la tienda
            if (producto.id_tienda) {
                const { data: tiendaData } = await supabase
                    .from('tiendas')
                    .select('*')
                    .eq('id_tienda', producto.id_tienda)
                    .single();
                setTienda(tiendaData);

                // Obtener perfil del vendedor
                const { data: perfilData } = await supabase
                    .from('perfiles')
                    .select('*, usuarios(username)')
                    .eq('id_tienda', producto.id_tienda)
                    .single();
                setVendedor(perfilData);

                // Obtener calificaciones de la tienda
                const { data: califTienda } = await supabase
                    .from('calificaciones_tiendas')
                    .select('*, perfiles(usuarios(username))')
                    .eq('tienda_id', producto.id_tienda)
                    .order('creado_en', { ascending: false });
                setCalificacionesTienda(califTienda || []);
            }

            // 2. Obtener reseñas del producto
            const { data: resenasData } = await supabase
                .from('reseñas_productos')
                .select('*, perfiles(usuarios(username))')
                .eq('producto_id', producto.id_producto)
                .order('creado_en', { ascending: false });
            setResenas(resenasData || []);

            // 3. Verificar si el usuario logueado ha comprado este producto
            if (user) {
                // Obtener perfil del usuario actual
                const { data: miPerfil } = await supabase
                    .from('perfiles')
                    .select('perfil_id')
                    .eq('id_usuario', user.id)
                    .single();
                setPerfilUsuario(miPerfil);

                if (miPerfil) {
                    const { data: pedidos } = await supabase
                        .from('pedidos')
                        .select('id_pedido')
                        .eq('perfil_id', miPerfil.perfil_id)
                        .eq('producto_id', producto.id_producto)
                        .gte('id_estado', 2); // 2 o más implica que se pagó/completó

                    setComprado(pedidos && pedidos.length > 0);
                }
            }
        } catch (error) {
            console.error("Error al cargar detalles:", error);
        } finally {
            setCargando(false);
        }
    };

    const enviarResenaProducto = async (e) => {
        e.preventDefault();
        if (!nuevaResena.comentario.trim()) return;

        try {
            const { error } = await supabase.from('reseñas_productos').insert([{
                producto_id: producto.id_producto,
                comprador_id: perfilUsuario.perfil_id,
                calificacion: nuevaResena.calificacion,
                comentario: nuevaResena.comentario
            }]);

            if (error) throw error;
            
            setNuevaResena({ calificacion: 5, comentario: '' });
            cargarDetalles(); // Recargar reseñas
        } catch (error) {
            console.error("Error al enviar reseña:", error);
            alert("No se pudo enviar la reseña. Solo puedes calificar una vez.");
        }
    };

    const enviarCalificacionTienda = async (e) => {
        e.preventDefault();
        if (!nuevaCalificacionTienda.comentario.trim()) return;

        try {
            const { error } = await supabase.from('calificaciones_tiendas').insert([{
                tienda_id: producto.id_tienda,
                comprador_id: perfilUsuario.perfil_id,
                puntuacion: nuevaCalificacionTienda.puntuacion,
                comentario: nuevaCalificacionTienda.comentario
            }]);

            if (error) throw error;
            
            setNuevaCalificacionTienda({ puntuacion: 5, comentario: '' });
            cargarDetalles(); // Recargar calificaciones
        } catch (error) {
            console.error("Error al enviar calificación:", error);
            alert("No se pudo calificar. Solo puedes calificar a la tienda una vez.");
        }
    };

    const Estrellas = ({ valor }) => {
        return (
            <span className="text-warning">
                {[1, 2, 3, 4, 5].map((star) => (
                    <i key={star} className={`bi bi-star${star <= valor ? '-fill' : ''}`}></i>
                ))}
            </span>
        );
    };

    const EstrellasInteractivas = ({ valor, setValor }) => {
        const [hover, setHover] = useState(0);
        return (
            <div className="mb-2" style={{ cursor: 'pointer', fontSize: '1.5rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <i 
                        key={star} 
                        className={`bi bi-star${star <= (hover || valor) ? '-fill' : ''} text-warning me-1`}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                        onClick={() => setValor(star)}
                    ></i>
                ))}
            </div>
        );
    };

    const PromedioEstrellas = ({ datos, campo }) => {
        if (!datos || datos.length === 0) return <span className="text-muted small">Sin calificaciones</span>;
        const total = datos.reduce((acc, curr) => acc + curr[campo], 0);
        const promedio = Math.round(total / datos.length);
        return <Estrellas valor={promedio} />;
    };

    if (!producto) return null;

    return (
        <Modal show={mostrar} onHide={() => setMostrar(false)} size="lg" centered>
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold text-primary">Detalles del Producto</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {cargando ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                    </div>
                ) : (
                    <Row>
                        {/* COLUMNA IZQUIERDA: Imagen y Tienda */}
                        <Col md={5}>
                            <div className="mb-4 text-center rounded overflow-hidden shadow-sm" style={{ height: '250px', backgroundColor: '#f8f9fa' }}>
                                {producto.imagen_url && producto.imagen_url.length > 1 ? (
                                    <Carousel variant="dark" style={{ height: '100%' }}>
                                        {producto.imagen_url.map((url, idx) => (
                                            <Carousel.Item key={idx} style={{ height: '250px' }}>
                                                <img 
                                                    src={url} 
                                                    alt={`${producto.nombre_producto} ${idx + 1}`} 
                                                    className="d-block w-100 h-100" 
                                                    style={{ objectFit: 'contain' }}
                                                />
                                            </Carousel.Item>
                                        ))}
                                    </Carousel>
                                ) : producto.imagen_url && producto.imagen_url.length === 1 ? (
                                    <img 
                                        src={producto.imagen_url[0]} 
                                        alt={producto.nombre_producto} 
                                        className="img-fluid h-100" 
                                        style={{ objectFit: 'contain' }}
                                    />
                                ) : (
                                    <i className="bi bi-image text-muted d-flex justify-content-center align-items-center h-100" style={{ fontSize: '4rem' }}></i>
                                )}
                            </div>

                            {/* Info de la Tienda */}
                            {tienda && (
                                <Card className="border-0 shadow-sm mb-4">
                                    <Card.Body>
                                        <h6 className="fw-bold text-uppercase text-muted mb-2 small">Vendido por:</h6>
                                        <div className="d-flex align-items-center mb-2">
                                            {tienda.imagen_url ? (
                                                <img src={tienda.imagen_url} alt="Logo" className="rounded-circle me-2" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                                            ) : (
                                                <div className="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center me-2" style={{ width: '40px', height: '40px' }}>
                                                    <i className="bi bi-shop"></i>
                                                </div>
                                            )}
                                            <div>
                                                <h6 className="mb-0 fw-bold">{tienda.nombre_tienda}</h6>
                                                <small className="text-muted">{vendedor?.usuarios?.username || 'Vendedor'}</small>
                                            </div>
                                        </div>
                                        <div className="mb-2">
                                            <small className="me-2">Reputación:</small>
                                            <PromedioEstrellas datos={calificacionesTienda} campo="puntuacion" />
                                        </div>

                                        {/* Formulario calificar tienda */}
                                        {user && (
                                            <div className="mt-3 pt-3 border-top">
                                                <h6 className="small fw-bold">Calificar Tienda</h6>
                                                <Form onSubmit={enviarCalificacionTienda}>
                                                    <EstrellasInteractivas 
                                                        valor={nuevaCalificacionTienda.puntuacion} 
                                                        setValor={(val) => setNuevaCalificacionTienda({...nuevaCalificacionTienda, puntuacion: val})} 
                                                    />
                                                    <Form.Control 
                                                        size="sm" 
                                                        as="textarea" 
                                                        placeholder="Opinión sobre la tienda..." 
                                                        className="mb-2"
                                                        value={nuevaCalificacionTienda.comentario}
                                                        onChange={(e) => setNuevaCalificacionTienda({...nuevaCalificacionTienda, comentario: e.target.value})}
                                                    />
                                                    <Button type="submit" variant="outline-primary" size="sm" className="w-100">
                                                        Enviar calificación
                                                    </Button>
                                                </Form>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            )}
                        </Col>

                        {/* COLUMNA DERECHA: Info del Producto y Reseñas */}
                        <Col md={7}>
                            <h3 className="fw-bold mb-2">{producto.nombre_producto}</h3>
                            <Badge bg="info" className="mb-3">{producto.categorias?.nombre_categoria || 'Categoría'}</Badge>
                            
                            <div className="mb-4">
                                {producto.precio_original > producto.precio_venta && (
                                    <span className="text-decoration-line-through text-muted me-2 fs-5">
                                        ${parseFloat(producto.precio_original).toFixed(2)}
                                    </span>
                                )}
                                <span className="fs-2 fw-bold text-success">
                                    ${parseFloat(producto.precio_venta).toFixed(2)}
                                </span>
                            </div>

                            <p className="text-secondary mb-4">{producto.descripcion || 'Sin descripción detallada.'}</p>

                            <Button 
                                variant="primary" 
                                size="lg" 
                                className="w-100 rounded-pill fw-bold shadow-sm mb-4"
                                style={{ backgroundColor: 'var(--color-primario)', borderColor: 'var(--color-primario)' }}
                                onClick={() => {
                                    agregarAlCarrito(producto);
                                    setMostrar(false);
                                }}
                            >
                                <i className="bi bi-cart-plus me-2"></i> Añadir al Carrito
                            </Button>

                            <hr />

                            {/* SECCIÓN DE RESEÑAS DEL PRODUCTO */}
                            <h5 className="fw-bold mb-3">Reseñas del Producto <PromedioEstrellas datos={resenas} campo="calificacion" /></h5>

                            {user ? (
                                <Form onSubmit={enviarResenaProducto} className="mb-4 bg-light p-3 rounded">
                                    <h6 className="fw-bold mb-2">Dejar una reseña</h6>
                                    <EstrellasInteractivas 
                                        valor={nuevaResena.calificacion} 
                                        setValor={(val) => setNuevaResena({...nuevaResena, calificacion: val})} 
                                    />
                                    <Form.Control 
                                        as="textarea" 
                                        rows={2} 
                                        placeholder="¿Qué te pareció este producto?" 
                                        className="mb-2"
                                        value={nuevaResena.comentario}
                                        onChange={(e) => setNuevaResena({...nuevaResena, comentario: e.target.value})}
                                    />
                                    <div className="text-end">
                                        <Button type="submit" variant="primary" size="sm">Comentar</Button>
                                    </div>
                                </Form>
                            ) : (
                                <div className="alert alert-secondary small py-2">
                                    <i className="bi bi-info-circle me-2"></i>Inicia sesión para dejar una reseña de este producto.
                                </div>
                            )}

                            <div className="list-group list-group-flush">
                                {resenas.length > 0 ? (
                                    resenas.map((resena) => (
                                        <div key={resena.id_resena} className="list-group-item px-0 py-3">
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <h6 className="fw-bold mb-0">
                                                    <i className="bi bi-person-circle me-2 text-muted"></i>
                                                    {resena.perfiles?.usuarios?.username || 'Usuario Anónimo'}
                                                </h6>
                                                <Estrellas valor={resena.calificacion} />
                                            </div>
                                            <p className="text-muted mb-0 small">{resena.comentario}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted text-center py-3">Aún no hay reseñas para este producto.</p>
                                )}
                            </div>
                        </Col>
                    </Row>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default ModalDetalleProducto;
