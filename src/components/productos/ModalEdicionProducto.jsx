import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';

const ModalEdicionProducto = ({
    mostrarModal,
    setMostrarModal,
    productoEditar,
    manejoCambioEdicion,
    editarProducto,
    categorias
}) => {
    const [desabilitado, setDesabilitado] = useState(false);

    const handleEditar = async () => {
        if (desabilitado) return;
        setDesabilitado(true);
        await editarProducto();
        setDesabilitado(false);
    };

    if (!productoEditar) return null;

    return (
        <Modal
            show={mostrarModal}
            onHide={() => setMostrarModal(false)}
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
                                    value={productoEditar.nombre_producto}
                                    onChange={manejoCambioEdicion}
                                    placeholder="Ingresa el nombre del producto"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Categoría *</Form.Label>
                                <Form.Select
                                    name="categoria_id"
                                    value={productoEditar.categoria_id}
                                    onChange={manejoCambioEdicion}
                                >
                                    <option value="">Selecciona una categoría</option>
                                    {categorias.map((categoria) => (
                                        <option key={categoria.id_categoria} value={categoria.id_categoria}>
                                            {categoria.nombre_categoria}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label>Descripción *</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            name="descripcion"
                            value={productoEditar.descripcion}
                            onChange={manejoCambioEdicion}
                            placeholder="Ingresa la descripción del producto"
                        />
                    </Form.Group>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Precio de Venta *</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    name="precio_venta"
                                    value={productoEditar.precio_venta}
                                    onChange={manejoCambioEdicion}
                                    placeholder="0.00"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Precio de Compra *</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    name="precio_compra"
                                    value={productoEditar.precio_compra}
                                    onChange={manejoCambioEdicion}
                                    placeholder="0.00"
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Estado</Form.Label>
                                <Form.Select
                                    name="estado"
                                    value={productoEditar.estado}
                                    onChange={manejoCambioEdicion}
                                >
                                    <option value="activo">Activo</option>
                                    <option value="inactivo">Inactivo</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Imágenes (URL)</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="imagenes"
                                    value={productoEditar.imagenes}
                                    onChange={manejoCambioEdicion}
                                    placeholder="Ingresa la URL de la imagen"
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </Form>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={() => setMostrarModal(false)}>
                    Cancelar
                </Button>
                <Button
                    variant="primary"
                    onClick={handleEditar}
                    disabled={
                        productoEditar.nombre_producto.trim() === "" ||
                        productoEditar.descripcion.trim() === "" ||
                        productoEditar.precio_venta === "" ||
                        productoEditar.precio_compra === "" ||
                        productoEditar.categoria_id === "" ||
                        desabilitado
                    }
                >
                    {desabilitado ? "Actualizando..." : "Actualizar"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalEdicionProducto;