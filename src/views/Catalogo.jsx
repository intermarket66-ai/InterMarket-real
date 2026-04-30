import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Button } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig';
import ModalDescuentoProducto from '../components/productos/ModalDescuentoProducto';
import NotificacionOperacion from '../components/NotificacionOperacion';

function Catalogo() {
    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [mostrarModalDescuento, setMostrarModalDescuento] = useState(false);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [toast, setToast] = useState({ mostrar: false, mensaje: '', tipo: '' });

    useEffect(() => {
        cargarProductos();
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
                .eq("id_estado", 1)
                .order("creado_en", { ascending: false });

            if (error) throw error;
            setProductos(data || []);
        } catch (err) {
            console.error("Error al cargar productos:", err);
        } finally {
            setCargando(false);
        }
    };

    const abrirModalDescuento = (producto) => {
        setProductoSeleccionado(producto);
        setMostrarModalDescuento(true);
    };

    // Aplicar descuento actualizando precio_venta directamente
    const aplicarDescuento = async (producto, nuevoPrecio) => {
        try {
            const { error } = await supabase
                .from("productos")
                .update({ 
                    precio_venta: nuevoPrecio 
                })
                .eq("id_producto", producto.id_producto);

            if (error) throw error;

            setToast({
                mostrar: true,
                mensaje: `✓ Descuento aplicado. Nuevo precio: $${nuevoPrecio.toFixed(2)}`,
                tipo: "exito"
            });

            // Recargar catálogo para mostrar el nuevo precio
            cargarProductos();

        } catch (err) {
            console.error(err);
            setToast({
                mostrar: true,
                mensaje: "Error al aplicar el descuento en la base de datos",
                tipo: "error"
            });
        }
    };

    return (
        <Container>
            <br />
            <Row className="mb-4">
                <Col>
                    <h1 className="text-center">
                        <i className="bi bi-shop me-2"></i>
                        Catálogo de Productos
                    </h1>
                </Col>
            </Row>

            {cargando ? (
                <div className="text-center my-5">
                    <Spinner animation="border" variant="success" size="lg" />
                    <p className="mt-3">Cargando catálogo...</p>
                </div>
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
                                            onClick={() => abrirModalDescuento(producto)}
                                        >
                                            <i className="bi bi-tag-fill me-1"></i>
                                            Aplicar Descuento
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* Modal */}
            <ModalDescuentoProducto
                mostrarModal={mostrarModalDescuento}
                setMostrarModal={setMostrarModalDescuento}
                productoSeleccionado={productoSeleccionado}
                aplicarDescuento={aplicarDescuento}
            />

            {/* Notificación */}
            <NotificacionOperacion
                mostrar={toast.mostrar}
                mensaje={toast.mensaje}
                tipo={toast.tipo}
                onCerrar={() => setToast({ ...toast, mostrar: false })}
            />

            {!cargando && productos.length === 0 && (
                <Row className="text-center my-5">
                    <Col>
                        <p className="text-muted">No hay productos disponibles en el catálogo.</p>
                    </Col>
                </Row>
            )}
        </Container>
    );
}

export default Catalogo;