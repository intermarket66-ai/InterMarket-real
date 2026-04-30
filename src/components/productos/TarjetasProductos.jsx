import React from 'react';
import { Row, Col, Card, Button, Badge } from 'react-bootstrap';

const TarjetasProductos = ({ productos, abrirModalEdicion, abrirModalEliminacion }) => {
    return (
        <Row>
            {productos.map((producto) => (
                <Col key={producto.id_producto} xs={12} sm={6} md={4} lg={3} className="mb-4">
                    <Card className="h-100 shadow-sm">
                        {producto.url_imagenes && (
                            <Card.Img
                                variant="top"
                                src={producto.url_imagenes}
                                alt={producto.nombre_producto}
                                style={{ height: '200px', objectFit: 'cover' }}
                                onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/200x200?text=Sin+Imagen';
                                }}
                            />
                        )}
                        <Card.Body className="d-flex flex-column">
                            <Card.Title className="text-truncate" title={producto.nombre_producto}>
                                {producto.nombre_producto}
                            </Card.Title>
                            
                            <Card.Text className="text-muted small mb-2">
                                {producto.descripcion?.length > 100
                                    ? `${producto.descripcion.substring(0, 100)}...`
                                    : producto.descripcion || 'Sin descripción'}
                            </Card.Text>

                            <div className="mb-2">
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
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div>
                                        <small className="text-muted">Venta:</small>
                                        <div className="fw-bold text-success">${producto.precio_venta}</div>
                                    </div>
                                    <div className="text-end">
                                        <small className="text-muted">Compra:</small>
                                        <div className="fw-bold text-primary">${producto.precio_compra}</div>
                                    </div>
                                </div>

                                <div className="d-flex gap-2">
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => abrirModalEdicion(producto)}
                                        className="flex-fill"
                                    >
                                        <i className="bi bi-pencil"></i> Editar
                                    </Button>
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => abrirModalEliminacion(producto)}
                                        className="flex-fill"
                                    >
                                        <i className="bi bi-trash"></i> Eliminar
                                    </Button>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            ))}
        </Row>
    );
};

export default TarjetasProductos;