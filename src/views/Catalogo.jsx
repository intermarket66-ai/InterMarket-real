import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Spinner } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig';

function Catalogo() {
    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        cargarProductos();
    }, []);

    const cargarProductos = async () => {
        try {
            setCargando(true);
            setError(null);

            const { data, error } = await supabase
                .from("productos")
                .select(`
                    *,
                    categorias (
                        nombre_categoria
                    )
                `)
                .eq("id_estado", 1)           // Solo productos con estado "Entregado" (activos para catálogo)
                .order("creado_en", { ascending: false });

            if (error) {
                console.error("Error al cargar productos:", error.message);
                setError("No se pudieron cargar los productos");
                return;
            }

            setProductos(data || []);
        } catch (err) {
            console.error("Excepción al cargar productos:", err.message);
            setError("Ocurrió un error inesperado");
        } finally {
            setCargando(false);
        }
    };

    return (
        <Container>
            <br />
            <Row className="mb-4">
                <Col>
                    <h1 className="text-center mb-0">
                        <i className="bi bi-shop me-2"></i>
                        Catálogo de Productos
                    </h1>
                </Col>
            </Row>

            {cargando ? (
                <div className="text-center my-5">
                    <Spinner animation="border" variant="success" size="lg" />
                    <p className="mt-3 text-muted">Cargando catálogo...</p>
                </div>
            ) : error ? (
                <div className="text-center my-5">
                    <p className="text-danger">{error}</p>
                    <Button variant="outline-primary" onClick={cargarProductos}>
                        Intentar de nuevo
                    </Button>
                </div>
            ) : (
                <>
                    <Row>
                        {productos.map((producto) => (
                            <Col key={producto.id_producto} xs={12} sm={6} md={4} lg={3} className="mb-4">
                                <Card className="h-100 shadow-sm">
                                    {/* Imagen */}
                                    {producto.url_imagenes ? (
                                        <Card.Img
                                            variant="top"
                                            src={producto.url_imagenes}
                                            alt={producto.nombre_producto}
                                            style={{ height: '200px', objectFit: 'cover' }}
                                            onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/200x200?text=Sin+Imagen';
                                            }}
                                        />
                                    ) : (
                                        <div 
                                            className="bg-light d-flex align-items-center justify-content-center"
                                            style={{ height: '200px' }}
                                        >
                                            <i className="bi bi-image text-muted" style={{ fontSize: '3rem' }}></i>
                                        </div>
                                    )}

                                    <Card.Body className="d-flex flex-column">
                                        <Card.Title 
                                            className="text-truncate mb-2" 
                                            title={producto.nombre_producto}
                                        >
                                            {producto.nombre_producto}
                                        </Card.Title>

                                        <Card.Text className="text-muted small mb-3" style={{ minHeight: '60px' }}>
                                            {producto.descripcion 
                                                ? producto.descripcion.length > 90 
                                                    ? `${producto.descripcion.substring(0, 90)}...`
                                                    : producto.descripcion
                                                : 'Sin descripción'}
                                        </Card.Text>

                                        <div className="mb-3">
                                            <Badge bg="secondary" className="me-2">
                                                {producto.categorias?.nombre_categoria || 'Sin categoría'}
                                            </Badge>
                                            <Badge 
                                                bg={producto.id_estado === 1 ? 'success' : 'warning'}
                                            >
                                                {producto.id_estado === 1 ? 'Entregado' : 'Proceso'}
                                            </Badge>
                                        </div>

                                        <div className="mt-auto">
                                            <div className="d-flex justify-content-between align-items-end">
                                                <div>
                                                    <small className="text-muted">Precio:</small>
                                                    <div className="fw-bold fs-5 text-success">
                                                        ${parseFloat(producto.precio_venta || 0).toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    {/* Mensaje cuando no hay productos */}
                    {productos.length === 0 && (
                        <Row className="text-center my-5">
                            <Col>
                                <i className="bi bi-inbox display-1 text-muted mb-3"></i>
                                <h4>No hay productos disponibles</h4>
                                <p className="text-muted">El catálogo está vacío en este momento.</p>
                            </Col>
                        </Row>
                    )}
                </>
            )}
        </Container>
    );
}

export default Catalogo;