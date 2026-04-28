import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';

const ModalRegistroProducto = ({
    mostrarModal,
    setMostrarModal,
    nuevoProducto,
    manejoCambioInput,
    agregarProducto,
    categorias
}) => {
    const [desabilitado, setDesabilitado] = useState(false);

    const handleRegistrar = async () => {
        if (desabilitado) return;
        setDesabilitado(true);
        await agregarProducto();
        setDesabilitado(false);
    };

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
                <Modal.Title>Agregar Producto</Modal.Title>
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
                                    value={nuevoProducto.nombre_producto}
                                    onChange={manejoCambioInput}
                                    placeholder="Ingresa el nombre del producto"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Categoría *</Form.Label>
                                <Form.Select
                                    name="categoria_id"
                                    value={nuevoProducto.categoria_id}
                                    onChange={manejoCambioInput}
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
                            value={nuevoProducto.descripcion}
                            onChange={manejoCambioInput}
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
                                    value={nuevoProducto.precio_venta}
                                    onChange={manejoCambioInput}
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
                                    value={nuevoProducto.precio_compra}
                                    onChange={manejoCambioInput}
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
                                    value={nuevoProducto.estado}
                                    onChange={manejoCambioInput}
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
                                    value={nuevoProducto.imagenes}
                                    onChange={manejoCambioInput}
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
                    onClick={handleRegistrar}
                    disabled={
                        nuevoProducto.nombre_producto.trim() === "" ||
                        nuevoProducto.descripcion.trim() === "" ||
                        nuevoProducto.precio_venta === "" ||
                        nuevoProducto.precio_compra === "" ||
                        nuevoProducto.categoria_id === "" ||
                        desabilitado
                    }
                >
                    {desabilitado ? "Guardando..." : "Guardar"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalRegistroProducto;