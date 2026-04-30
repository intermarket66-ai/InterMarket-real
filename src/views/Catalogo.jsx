import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Button } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig';
import CarritoModal from '../components/catalogo/CarritoModal';

function Catalogo() {
    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [carrito, setCarrito] = useState([]);
    const [mostrarCarrito, setMostrarCarrito] = useState(false);

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
                <Col>
                    <h1 className="text-center">
                        <i className="bi bi-shop me-2"></i>
                        Catálogo de Productos
                    </h1>
                </Col>
                <Col xs="auto">
                    <Button 
                        variant="primary" 
                        size="lg"
                        onClick={() => setMostrarCarrito(true)}
                        disabled={carrito.length === 0}
                    >
                        <i className="bi bi-cart-fill me-2"></i>
                        Carrito ({carrito.length}) - ${totalCarrito.toFixed(2)}
                    </Button>
                </Col>
            </Row>

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
                    {productos.map((producto) => (
                        <Col key={producto.id_producto} xs={12} sm={6} md={4} lg={3} className="mb-4">
                            <Card className="h-100 shadow-sm">
                                {producto.url_imagenes ? (
                                    <Card.Img
                                        variant="top"
                                        src={producto.url_imagenes}
                                        alt={producto.nombre_producto}
                                        style={{ height: '200px', objectFit: 'cover' }}
                                        onError={(e) => e.target.src = 'https://via.placeholder.com/200x200?text=Sin+Imagen'}
                                    />
                                ) : (
                                    <div className="bg-light d-flex align-items-center justify-content-center" style={{ height: '200px' }}>
                                        <i className="bi bi-image text-muted" style={{ fontSize: '3rem' }}></i>
                                    </div>
                                )}

                                <Card.Body className="d-flex flex-column">
                                    <Card.Title className="text-truncate" title={producto.nombre_producto}>
                                        {producto.nombre_producto}
                                    </Card.Title>

                                    <Card.Text className="text-muted small mb-3">
                                        {producto.descripcion?.length > 85 
                                            ? `${producto.descripcion.substring(0, 85)}...` 
                                            : producto.descripcion || 'Sin descripción'}
                                    </Card.Text>

                                    <div className="mb-3">
                                        <Badge bg="secondary" className="me-2">
                                            {producto.categorias?.nombre_categoria || 'Sin categoría'}
                                        </Badge>
                                        <Badge bg={producto.id_estado === 1 ? "success" : "warning"}>
                                            {producto.id_estado === 1 ? "Entregado" : "Proceso"}
                                        </Badge>
                                    </div>

                                    <div className="mt-auto">
                                        <div className="mb-3">
                                            <small className="text-muted">Precio:</small>
                                            <div className="fw-bold fs-4 text-success">
                                                ${parseFloat(producto.precio_venta || 0).toFixed(2)}
                                            </div>
                                        </div>

                                        <Button 
                                            variant="success" 
                                            className="w-100"
                                            onClick={() => agregarAlCarrito(producto)}
                                        >
                                            <i className="bi bi-cart-plus me-1"></i>
                                            Añadir al Carrito
                                        </Button>
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
            />
        </Container>
    );
}

export default Catalogo;