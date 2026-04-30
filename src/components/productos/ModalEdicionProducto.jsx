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
            <Modal.Header closeButton>
                <Modal.Title>Editar Producto</Modal.Title>
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
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Nueva Imagen (opcional)</Form.Label>
                                <Form.Control
                                    type="file"
                                    accept="image/*"
                                    onChange={manejoCambioArchivoActualizar}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    {productoEditar.url_imagenes && (
                        <div className="text-center mb-3">
                            <p className="small text-muted">Imagen actual:</p>
                            <img
                                src={productoEditar.url_imagenes}
                                alt="Vista previa"
                                style={{ maxWidth: '100%', maxHeight: '220px', objectFit: 'contain' }}
                            />
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