import React, { useState } from "react";
import { Modal, Form, Button, Row, Col, Badge } from "react-bootstrap";

const ModalRegistroProducto = ({
    mostrarModal,
    setMostrarModal,
    nuevoProducto,
    manejoCambioInput,
    manejoCambioArchivo,
    agregarProducto,
    categorias
}) => {
    const [deshabilitado, setDeshabilitado] = useState(false);

    const handleAgregar = async () => {
        if (deshabilitado) return;
        setDeshabilitado(true);
        await agregarProducto();
        setDeshabilitado(false);
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
            <Modal.Header
                closeButton
                className="border-0"
                style={{
                    background: 'linear-gradient(135deg, var(--color-primario) 0%, #1a7a8a 100%)',
                    padding: '0.65rem 1.25rem',
                }}
            >
                <Modal.Title className="fw-bold text-white d-flex align-items-center gap-2" style={{ fontSize: '1rem' }}>
                    <i className="bi bi-plus-circle"></i>
                    Registrar Nuevo Producto
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
                                    value={nuevoProducto.nombre_producto}
                                    onChange={manejoCambioInput}
                                    placeholder="Ingrese el nombre del producto"
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
                        <Form.Label>Descripción</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            name="descripcion"
                            value={nuevoProducto.descripcion}
                            onChange={manejoCambioInput}
                            placeholder="Descripción del producto"
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
                                    value={nuevoProducto.precio_compra}
                                    onChange={manejoCambioInput}
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
                                    value={nuevoProducto.precio_venta}
                                    onChange={manejoCambioInput}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Stock Inicial *</Form.Label>
                                <Form.Control
                                    type="number"
                                    min="0"
                                    name="stock"
                                    value={nuevoProducto.stock ?? ''}
                                    onChange={manejoCambioInput}
                                    placeholder="Ej: 50"
                                />
                                <Form.Text className="text-muted small">Unidades disponibles para venta.</Form.Text>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Seleccionar Imágenes (varias)</Form.Label>
                                <Form.Control
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={manejoCambioArchivo}
                                />
                                <Form.Text className="text-muted small">
                                    Puedes seleccionar varias imágenes a la vez.
                                </Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>

                    {nuevoProducto.archivos_imagen && nuevoProducto.archivos_imagen.length > 0 && (
                        <div className="mb-3">
                            <Form.Label className="small text-muted">Vista previa de imágenes seleccionadas:</Form.Label>
                            <div className="d-flex flex-wrap gap-2 justify-content-center p-2 border rounded bg-light">
                                {Array.from(nuevoProducto.archivos_imagen).map((file, idx) => (
                                    <div key={idx} className="position-relative">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={`Vista previa ${idx + 1}`}
                                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                            onLoad={(e) => URL.revokeObjectURL(e.target.src)}
                                        />
                                        <Badge 
                                            bg="dark" 
                                            className="position-absolute top-0 end-0 m-1 opacity-75" 
                                            style={{ fontSize: '0.6rem' }}
                                        >
                                            {idx + 1}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Form>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={() => setMostrarModal(false)}>
                    Cancelar
                </Button>
                <Button
                    variant="primary"
                    onClick={handleAgregar}
                    disabled={deshabilitado}
                >
                    {deshabilitado ? "Guardando..." : "Guardar Producto"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalRegistroProducto;