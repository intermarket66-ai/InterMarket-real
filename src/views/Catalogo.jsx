import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Button, Form, InputGroup } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig';
import CarritoModal from '../components/catalogo/CarritoModal';
import ModalMensaje from '../components/catalogo/ModalMensaje';
import ModalDetalleProducto from '../components/catalogo/ModalDetalleProducto';
import ModalPostCompra from '../components/catalogo/ModalPostCompra';
import { useAuth } from '../context/AuthContext';

function Catalogo() {
    const { user } = useAuth();
    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [carrito, setCarrito] = useState([]);
    const [mostrarCarrito, setMostrarCarrito] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [mostrarSoloOfertas, setMostrarSoloOfertas] = useState(false);
    const [mostrarModalMensaje, setMostrarModalMensaje] = useState(false);
    const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);
    const [mostrarModalPostCompra, setMostrarModalPostCompra] = useState(false);
    const [itemsCompradosRecientemente, setItemsCompradosRecientemente] = useState([]);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);

    const abrirModalContacto = (producto) => {
        setProductoSeleccionado(producto);
        setMostrarModalMensaje(true);
    };

    const abrirModalDetalles = (producto) => {
        setProductoSeleccionado(producto);
        setMostrarModalDetalle(true);
    };

    const handleCompraExitosa = (itemsComprados) => {
        setItemsCompradosRecientemente(itemsComprados);
        setMostrarModalPostCompra(true);
    };

    // Cargar productos y carrito + escuchar evento del encabezado
    useEffect(() => {
        cargarProductos();
        
        const carritoGuardado = JSON.parse(localStorage.getItem('carrito') || '[]');
        setCarrito(carritoGuardado);

        // Escuchar evento para abrir el carrito desde el Encabezado
        const handleAbrirCarrito = () => {
            setMostrarCarrito(true);
        };

        window.addEventListener("abrirCarrito", handleAbrirCarrito);

        // Cleanup del listener
        return () => {
            window.removeEventListener("abrirCarrito", handleAbrirCarrito);
        };
    }, []);

    const cargarProductos = async () => {
        try {
            setCargando(true);

            const { data, error } = await supabase
                .from("productos")
                .select(`
                    *,
                    categorias (nombre_categoria)
                `)
                // .eq("id_estado", 1)        ← Descomenta cuando quieras filtrar
                .order("creado_en", { ascending: false });

            if (error) {
                console.error("Error Supabase:", error.message);
                throw error;
            }

            setProductos(data || []);
        } catch (err) {
            console.error("Error al cargar productos:", err);
        } finally {
            setCargando(false);
        }
    };

    // Agregar al carrito
    const agregarAlCarrito = (producto) => {
        const existe = carrito.find(item => item.id_producto === producto.id_producto);

        let nuevoCarrito;
        if (existe) {
            nuevoCarrito = carrito.map(item =>
                item.id_producto === producto.id_producto
                    ? { ...item, cantidad: item.cantidad + 1 }
                    : item
            );
        } else {
            nuevoCarrito = [...carrito, { ...producto, cantidad: 1 }];
        }
        setCarrito(nuevoCarrito);
        localStorage.setItem('carrito', JSON.stringify(nuevoCarrito));

        // Notificación toast
        const toast = document.createElement('div');
        toast.className = 'position-fixed bottom-0 end-0 p-3';
        toast.style.zIndex = '9999';
        toast.innerHTML = `
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <i class="bi bi-cart-check"></i> ${producto.nombre_producto} añadido al carrito
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
    };

    // Calcular total del carrito
    const totalCarrito = carrito.reduce((total, item) => {
        return total + (parseFloat(item.precio_venta || 0) * (item.cantidad || 1));
    }, 0);

    return (
        <Container>
            <br />
            <br />
            <br />
            <br />

            <Row className="mb-4 align-items-center">
                <Col md={4} xs={12} className="mb-3 mb-md-0">
                    <h2 className="m-0 text-primary">
                        <i className="bi bi-shop me-2"></i>
                        Catálogo
                    </h2>
                </Col>
                <Col md={5} xs={12} className="mb-3 mb-md-0">
                    <InputGroup>
                        <InputGroup.Text className="bg-white"><i className="bi bi-search"></i></InputGroup.Text>
                        <Form.Control 
                            placeholder="Buscar productos..." 
                            value={busqueda} 
                            onChange={(e) => setBusqueda(e.target.value)} 
                        />
                    </InputGroup>
                </Col>
                <Col md={3} xs={12} className="text-md-end">
                    <Button 
                        variant="primary" 
                        size="md"
                        className="w-100 w-md-auto shadow-sm"
                        style={{ backgroundColor: 'var(--color-primario)', borderColor: 'var(--color-primario)' }}
                        onClick={() => setMostrarCarrito(true)}
                        disabled={carrito.length === 0}
                    >
                        <i className="bi bi-cart-fill me-2"></i>
                        Ver Carrito ({carrito.length})
                    </Button>
                </Col>
            </Row>

            {/* Banner de Ofertas (Estilo Figma) */}
            <div 
              className="mb-4 rounded px-4 py-3 d-flex justify-content-between align-items-center shadow-sm text-white" 
              style={{ background: 'var(--color-oferta)' }}
            >
              <div>
                <h4 className="m-0 fw-bold"><i className="bi bi-tag-fill me-2"></i>Semana de ofertas</h4>
                <p className="m-0 text-white-50 small d-none d-sm-block">Aprovecha los mejores descuentos en tecnología y más</p>
              </div>
              <div 
                className="bg-white text-dark px-3 py-2 rounded fw-bold shadow-sm" 
                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => setMostrarSoloOfertas(!mostrarSoloOfertas)}
              >
                {mostrarSoloOfertas ? (
                    <><i className="bi bi-grid-fill me-2 text-primary"></i>Ver catálogo completo</>
                ) : (
                    <><i className="bi bi-percent me-2 text-danger"></i>Ver solo ofertas</>
                )}
              </div>
            </div>

            {cargando ? (
                <div className="text-center my-5">
                    <Spinner animation="border" variant="success" size="lg" />
                    <p className="mt-3">Cargando catálogo...</p>
                </div>
            ) : productos.length === 0 ? (
                <Row className="text-center my-5">
                    <Col>
                        <p className="text-muted">No hay productos disponibles en el catálogo.</p>
                        <p className="small text-muted">Verifica que existan productos con id_estado = 1 (Entregado)</p>
                    </Col>
                </Row>
            ) : (
                <Row>
                    {productos
                        .filter(p => p.nombre_producto?.toLowerCase().includes(busqueda.toLowerCase()) || p.categorias?.nombre_categoria?.toLowerCase().includes(busqueda.toLowerCase()))
                        .filter(p => !mostrarSoloOfertas || (p.precio_original && p.precio_original > p.precio_venta))
                        .map((producto) => (
                        <Col key={producto.id_producto} xs={6} sm={6} md={4} lg={3} className="mb-4">
                            <Card className="h-100 shadow-sm border-0 product-card-hover">
                                {producto.imagen_url && producto.imagen_url.length > 0 ? (
                                    <div 
                                        className="position-relative overflow-hidden ratio ratio-4x3 bg-light" 
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => abrirModalDetalles(producto)}
                                    >
                                        <div>
                                            <Card.Img
                                                variant="top"
                                                src={producto.imagen_url[0]}
                                                alt={producto.nombre_producto}
                                                className="w-100 h-100"
                                                style={{ objectFit: 'cover' }}
                                                onError={(e) => e.target.src = 'https://via.placeholder.com/200x150?text=Sin+Imagen'}
                                            />
                                            {producto.precio_original > producto.precio_venta && (
                                                <Badge bg="danger" className="position-absolute top-0 end-0 m-2 px-2 py-1 shadow-sm" style={{ width: 'auto', height: 'auto' }}>
                                                    ¡Oferta!
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-light d-flex align-items-center justify-content-center ratio ratio-4x3" style={{ cursor: 'pointer' }}>
                                        <i className="bi bi-image text-muted" style={{ fontSize: '3rem' }}></i>
                                    </div>
                                )}

                                <Card.Body className="d-flex flex-column">
                                    <Card.Title 
                                        className="text-truncate fw-bold mb-1 fs-6" 
                                        title={producto.nombre_producto}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => abrirModalDetalles(producto)}
                                    >
                                        {producto.nombre_producto}
                                    </Card.Title>

                                    <div className="mb-2">
                                        <Badge bg="light" text="dark" className="me-2 border">
                                            {producto.categorias?.nombre_categoria || 'Sin categoría'}
                                        </Badge>
                                    </div>

                                    <Card.Text className="text-muted small mb-2 flex-grow-1 d-none d-sm-block">
                                        {producto.descripcion?.length > 70 
                                            ? `${producto.descripcion.substring(0, 70)}...` 
                                            : producto.descripcion || 'Sin descripción'}
                                    </Card.Text>

                                    <div className="mt-auto">
                                        <div className="mb-2 bg-light p-1 p-sm-2 rounded text-center">
                                            {producto.precio_original > producto.precio_venta ? (
                                                <>
                                                    <span className="text-decoration-line-through text-muted small me-1 d-block d-sm-inline">${parseFloat(producto.precio_original).toFixed(2)}</span>
                                                    <span className="fw-bold fs-6 fs-sm-5 text-danger">${parseFloat(producto.precio_venta || 0).toFixed(2)}</span>
                                                </>
                                            ) : (
                                                <span className="fw-bold fs-6 fs-sm-5 text-success">${parseFloat(producto.precio_venta || 0).toFixed(2)}</span>
                                            )}
                                        </div>

                                        <div className="d-flex gap-1 gap-sm-2">
                                            <Button 
                                                variant="outline-secondary" 
                                                className="fw-bold rounded-pill px-2 px-sm-3"
                                                onClick={() => abrirModalContacto(producto)}
                                                title="Contactar al vendedor"
                                            >
                                                <i className="bi bi-chat-dots"></i>
                                            </Button>
                                            <Button 
                                                variant="outline-primary" 
                                                className="w-100 fw-bold rounded-pill px-2 px-sm-3"
                                                onClick={() => agregarAlCarrito(producto)}
                                            >
                                                <i className="bi bi-cart-plus me-1 me-sm-2"></i>
                                                <span className="d-none d-sm-inline">Añadir</span>
                                            </Button>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* Modal del Carrito */}
            <CarritoModal
                mostrar={mostrarCarrito}
                setMostrar={setMostrarCarrito}
                carrito={carrito}
                setCarrito={setCarrito}
                total={totalCarrito}
                onCompraExitosa={handleCompraExitosa}
            />

            {/* Modal de Mensaje */}
            <ModalMensaje 
                mostrar={mostrarModalMensaje}
                setMostrar={setMostrarModalMensaje}
                producto={productoSeleccionado}
            />

            {/* Modal de Detalles, Tienda y Reseñas */}
            <ModalDetalleProducto 
                mostrar={mostrarModalDetalle}
                setMostrar={setMostrarModalDetalle}
                producto={productoSeleccionado}
                agregarAlCarrito={agregarAlCarrito}
            />

            {/* Modal Post-Compra (Invita a calificar) */}
            <ModalPostCompra
                mostrar={mostrarModalPostCompra}
                setMostrar={setMostrarModalPostCompra}
                items={itemsCompradosRecientemente}
                alCalificar={abrirModalDetalles}
            />
        </Container>
    );
}

export default Catalogo;