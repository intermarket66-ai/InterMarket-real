import React, { useState } from "react";
import { Modal, Form, Button, Row, Col } from "react-bootstrap";

const ModalEdicionProducto = ({
    mostrarModalEdicion,
    setMostrarModalEdicion,
    productoEditar,
    manejoCambioInputEdicion,
    manejoCambioArchivoActualizar,
    actualizarProducto,
    categorias
}) => {
    const [deshabilitado, setDeshabilitado] = useState(false);

    const handleActualizar = async () => {
        if (deshabilitado) return;
        setDeshabilitado(true);
        await actualizarProducto();
        setDeshabilitado(false);
    };

    if (!productoEditar) return null;

    return (
        <Modal
            show={mostrarModalEdicion}
            onHide={() => setMostrarModalEdicion(false)}
            backdrop="static"
            keyboard={false}
            centered
            size="lg"
        >
            <Modal.Header
                closeButton
                className="border-0"
                style={{
                    background: 'linear-gradient(135deg, var(--color-primario) 0%, #1a7a8a 100%)',
                    padding: '0.65rem 1.25rem',
                }}
            >
                <Modal.Title className="fw-bold text-white d-flex align-items-center gap-2" style={{ fontSize: '1rem' }}>
                    <i className="bi bi-pencil-square"></i>
                    Editar Producto
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Form>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Nombre del Producto *</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="nombre_producto"
                                    value={productoEditar.nombre_producto || ''}
                                    onChange={manejoCambioInputEdicion}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Categoría *</Form.Label>
                                <Form.Select
                                    name="categoria_id"
                                    value={productoEditar.categoria_id || ''}
                                    onChange={manejoCambioInputEdicion}
                                >
                                    <option value="">Selecciona una categoría</option>
                                    {categorias.map((cat) => (
                                        <option key={cat.id_categoria} value={cat.id_categoria}>
                                            {cat.nombre_categoria}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label>Descripción</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            name="descripcion"
                            value={productoEditar.descripcion || ''}
                            onChange={manejoCambioInputEdicion}
                        />
                    </Form.Group>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Precio de Compra *</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    name="precio_compra"
                                    value={productoEditar.precio_compra || ''}
                                    onChange={manejoCambioInputEdicion}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Precio de Venta *</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    name="precio_venta"
                                    value={productoEditar.precio_venta || ''}
                                    onChange={manejoCambioInputEdicion}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Estado</Form.Label>
                                <Form.Select
                                    name="id_estado"
                                    value={productoEditar.id_estado || '2'}
                                    onChange={manejoCambioInputEdicion}
                                >
                                    <option value="1">Entregado</option>
                                    <option value="2">Proceso</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Stock Disponible</Form.Label>
                                <Form.Control
                                    type="number"
                                    min="0"
                                    name="stock"
                                    value={productoEditar.stock ?? ''}
                                    onChange={manejoCambioInputEdicion}
                                    placeholder="Ej: 50"
                                />
                                <Form.Text className="text-muted small">Unidades disponibles actualmente.</Form.Text>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Nuevas Imágenes (reemplazan actuales)</Form.Label>
                                <Form.Control
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={manejoCambioArchivoActualizar}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    {productoEditar.url_imagenes && productoEditar.url_imagenes.length > 0 && (
                        <div className="text-center mb-3">
                            <p className="small text-muted mb-2">Imágenes actuales:</p>
                            <div className="d-flex justify-content-center flex-wrap gap-2">
                                {Array.isArray(productoEditar.url_imagenes) 
                                    ? productoEditar.url_imagenes.map((url, idx) => (
                                        <img
                                            key={idx}
                                            src={url}
                                            alt={`Actual ${idx+1}`}
                                            style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'cover', borderRadius: '4px' }}
                                        />
                                    ))
                                    : (
                                        <img
                                            src={productoEditar.url_imagenes}
                                            alt="Actual"
                                            style={{ maxWidth: '100%', maxHeight: '220px', objectFit: 'contain' }}
                                        />
                                    )
                                }
                            </div>
                        </div>
                    )}
                </Form>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={() => setMostrarModalEdicion(false)}>
                    Cancelar
                </Button>
                <Button
                    variant="primary"
                    onClick={handleActualizar}
                    disabled={deshabilitado}
                >
                    {deshabilitado ? "Actualizando..." : "Actualizar Producto"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalEdicionProducto;