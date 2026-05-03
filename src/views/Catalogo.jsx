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
    const [miTiendaId, setMiTiendaId] = useState(null);

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

    useEffect(() => {
        cargarProductos();
        
        const carritoGuardado = JSON.parse(localStorage.getItem('carrito') || '[]');
        setCarrito(carritoGuardado);

        const handleAbrirCarrito = () => {
            setMostrarCarrito(true);
        };

        window.addEventListener("abrirCarrito", handleAbrirCarrito);
        
        const obtenerMiTienda = async () => {
            if (!user) return;
            const { data } = await supabase
                .from('perfiles')
                .select('id_tienda')
                .eq('id_usuario', user.id)
                .maybeSingle();
            if (data?.id_tienda) setMiTiendaId(data.id_tienda);
        };
        obtenerMiTienda();

        return () => {
            window.removeEventListener("abrirCarrito", handleAbrirCarrito);
        };
    }, [user]);

    const cargarProductos = async () => {
        try {
            setCargando(true);

            const { data, error } = await supabase
                .from("productos")
                .select(`
                    *,
                    categorias (nombre_categoria)
                `)
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

        // Toast notification (premium style)
        const toast = document.createElement('div');
        toast.className = 'position-fixed bottom-0 end-0 p-4';
        toast.style.zIndex = '9999';
        toast.innerHTML = `
            <div class="alert shadow-lg border-0 d-flex align-items-center" style="background: var(--color-primario); color: white; border-radius: 12px; min-width: 300px;">
                <i class="bi bi-cart-check-fill fs-4 me-3"></i>
                <div>
                    <strong class="d-block">Añadido al carrito</strong>
                    <small class="opacity-75">${producto.nombre_producto}</small>
                </div>
                <button type="button" class="btn-close btn-close-white ms-auto" data-bs-dismiss="alert"></button>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('fade');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    };

    const totalCarrito = carrito.reduce((total, item) => {
        return total + (parseFloat(item.precio_venta || 0) * (item.cantidad || 1));
    }, 0);

    return (
        <Container className="pb-5">
            <div className="pt-5 mt-4">
                <Row className="mb-5 align-items-end">
                    <Col lg={4} md={12} className="mb-4 mb-lg-0">
                        <h1 className="display-5 fw-800 mb-2" style={{ color: 'var(--color-primario)' }}>
                            Descubre
                        </h1>
                        <p className="text-muted mb-0">Explora los mejores productos de nuestra comunidad.</p>
                    </Col>
                    <Col lg={5} md={8} className="mb-3 mb-md-0">
                        <InputGroup className="unique-input-group shadow-sm">
                            <InputGroup.Text className="bg-transparent border-0 pe-0">
                                <i className="bi bi-search text-muted"></i>
                            </InputGroup.Text>
                            <Form.Control 
                                className="bg-transparent border-0 py-3"
                                placeholder="¿Qué estás buscando hoy?" 
                                value={busqueda} 
                                onChange={(e) => setBusqueda(e.target.value)} 
                            />
                        </InputGroup>
                    </Col>
                    <Col lg={3} md={4} className="text-md-end">
                        <Button 
                            variant="primary" 
                            className="w-100 py-3 shadow-md fw-bold"
                            onClick={() => setMostrarCarrito(true)}
                            disabled={carrito.length === 0}
                        >
                            <i className="bi bi-bag-check me-2"></i>
                            Carrito ({carrito.length})
                        </Button>
                    </Col>
                </Row>

                {/* Promotional Banner */}
                <div 
                  className="mb-5 rounded-xl p-4 p-md-5 d-flex flex-column flex-md-row justify-content-between align-items-center shadow-md position-relative overflow-hidden" 
                  style={{ background: 'linear-gradient(135deg, #0f4c5c 0%, #1a7a8a 100%)', borderRadius: '24px' }}
                >
                  <div className="position-relative z-1 text-center text-md-start mb-4 mb-md-0">
                    <Badge bg="accent" className="mb-3 px-3 py-2 text-uppercase ls-1" style={{ background: 'var(--color-accent)' }}>Destacado</Badge>
                    <h2 className="text-white fw-800 mb-2 fs-1">Semana de Ofertas</h2>
                    <p className="text-white-50 mb-0 fs-5">Aprovecha descuentos exclusivos en toda la tienda.</p>
                  </div>
                  <div className="position-relative z-1">
                    <Button 
                        variant="light" 
                        className="rounded-pill px-4 py-3 fw-bold shadow-sm"
                        onClick={() => setMostrarSoloOfertas(!mostrarSoloOfertas)}
                    >
                        {mostrarSoloOfertas ? (
                            <><i className="bi bi-grid-3x3-gap me-2"></i>Ver todo</>
                        ) : (
                            <><i className="bi bi-percent me-2 text-danger"></i>Filtrar Ofertas</>
                        )}
                    </Button>
                  </div>
                  {/* Decorative Elements */}
                  <div className="position-absolute" style={{ width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', top: '-100px', right: '-100px' }}></div>
                </div>

                {cargando ? (
                    <div className="text-center py-5">
                        <Spinner animation="grow" variant="primary" />
                        <p className="mt-3 text-muted fw-500">Preparando el catálogo...</p>
                    </div>
                ) : productos.length === 0 ? (
                    <div className="text-center py-5 bg-white rounded-xl shadow-sm border">
                        <i className="bi bi-box-seam display-1 text-light mb-4 d-block"></i>
                        <h3 className="text-muted">No se encontraron productos</h3>
                        <p className="text-muted opacity-75">Vuelve más tarde para ver nuevas novedades.</p>
                    </div>
                ) : (
                    <Row className="g-4">
                        {productos
                            .filter(p => p.nombre_producto?.toLowerCase().includes(busqueda.toLowerCase()) || p.categorias?.nombre_categoria?.toLowerCase().includes(busqueda.toLowerCase()))
                            .filter(p => !mostrarSoloOfertas || (p.precio_original && p.precio_original > p.precio_venta))
                            .map((producto) => (
                            <Col key={producto.id_producto} xs={6} md={4} lg={3}>
                                <Card className="h-100 border-0 shadow-sm product-card-hover bg-white">
                                    <div 
                                        className="position-relative overflow-hidden ratio ratio-1x1" 
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => abrirModalDetalles(producto)}
                                    >
                                        <Card.Img
                                            variant="top"
                                            src={producto.imagen_url?.[0] || 'https://via.placeholder.com/400?text=Sin+Imagen'}
                                            alt={producto.nombre_producto}
                                            className="w-100 h-100 object-fit-cover"
                                            onError={(e) => e.target.src = 'https://via.placeholder.com/400?text=Error'}
                                        />
                                        {producto.precio_original > producto.precio_venta && (
                                            <div className="position-absolute top-0 start-0 m-3">
                                                <Badge bg="danger" className="px-2 py-1 shadow-sm">
                                                    -{Math.round((1 - producto.precio_venta / producto.precio_original) * 100)}%
                                                </Badge>
                                            </div>
                                        )}
                                    </div>

                                    <Card.Body className="d-flex flex-column p-3 p-md-4">
                                        <div className="mb-2">
                                            <span className="text-uppercase text-muted fw-700" style={{ fontSize: '10px', letterSpacing: '1px' }}>
                                                {producto.categorias?.nombre_categoria || 'General'}
                                            </span>
                                        </div>
                                        
                                        <Card.Title 
                                            className="fw-bold mb-3 fs-5 text-dark" 
                                            style={{ cursor: 'pointer', lineHeight: '1.2', height: '2.4em', overflow: 'hidden' }}
                                            onClick={() => abrirModalDetalles(producto)}
                                        >
                                            {producto.nombre_producto}
                                        </Card.Title>

                                        <div className="mt-auto">
                                            <div className="d-flex align-items-center mb-3">
                                                <span className="fs-4 fw-800 text-dark me-2">
                                                    ${parseFloat(producto.precio_venta || 0).toFixed(2)}
                                                </span>
                                                {producto.precio_original > producto.precio_venta && (
                                                    <span className="text-decoration-line-through text-muted small">
                                                        ${parseFloat(producto.precio_original).toFixed(2)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="d-flex gap-2">
                                                <Button 
                                                    variant="outline-secondary" 
                                                    className="rounded-pill p-2 flex-shrink-0"
                                                    onClick={() => abrirModalContacto(producto)}
                                                    style={{ width: '42px', height: '42px' }}
                                                >
                                                    <i className="bi bi-chat-text"></i>
                                                </Button>
                                                <Button 
                                                    variant={producto.id_tienda === miTiendaId ? "outline-warning" : "primary"} 
                                                    className="w-100 fw-bold rounded-pill"
                                                    onClick={() => {
                                                        if (producto.id_tienda === miTiendaId) {
                                                            alert("No puedes comprar tus propios productos.");
                                                        } else {
                                                            agregarAlCarrito(producto);
                                                        }
                                                    }}
                                                    disabled={producto.id_tienda === miTiendaId}
                                                >
                                                    <i className={`bi bi-${producto.id_tienda === miTiendaId ? 'shop' : 'plus-lg'} me-2`}></i>
                                                    {producto.id_tienda === miTiendaId ? 'Es tuyo' : 'Añadir'}
                                                </Button>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </div>

            {/* Modals remain the same but will inherit new styles */}
            <CarritoModal
                mostrar={mostrarCarrito}
                setMostrar={setMostrarCarrito}
                carrito={carrito}
                setCarrito={setCarrito}
                total={totalCarrito}
                onCompraExitosa={handleCompraExitosa}
            />
            <ModalMensaje 
                mostrar={mostrarModalMensaje}
                setMostrar={setMostrarModalMensaje}
                producto={productoSeleccionado}
            />
            <ModalDetalleProducto 
                mostrar={mostrarModalDetalle}
                setMostrar={setMostrarModalDetalle}
                producto={productoSeleccionado}
                agregarAlCarrito={agregarAlCarrito}
            />
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