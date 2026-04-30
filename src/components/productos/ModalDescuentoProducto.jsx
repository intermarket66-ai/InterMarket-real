import React, { useState } from "react";
import { Modal, Form, Button, Row, Col, Alert } from "react-bootstrap";

const ModalDescuentoProducto = ({
    mostrarModal,
    setMostrarModal,
    productoSeleccionado,
    aplicarDescuento
}) => {
    const [descuento, setDescuento] = useState("");
    const [tipoDescuento, setTipoDescuento] = useState("porcentaje");
    const [deshabilitado, setDeshabilitado] = useState(false);
    const [error, setError] = useState("");

    if (!productoSeleccionado) return null;

    const precioActual = parseFloat(productoSeleccionado.precio_venta) || 0;

    const calcularNuevoPrecio = () => {
        if (!descuento) return precioActual;
        const valor = parseFloat(descuento);
        if (isNaN(valor)) return precioActual;

        if (tipoDescuento === "porcentaje") {
            const montoDescuento = precioActual * (valor / 100);
            return Math.max(0, precioActual - montoDescuento);
        } else {
            return Math.max(0, precioActual - valor);
        }
    };

    const handleAplicarDescuento = async () => {
        if (!descuento || parseFloat(descuento) <= 0) {
            setError("Debe ingresar un valor de descuento mayor a 0");
            return;
        }

        setError("");
        setDeshabilitado(true);

        const nuevoPrecio = calcularNuevoPrecio();

        await aplicarDescuento(productoSeleccionado, nuevoPrecio);

        setDeshabilitado(false);
        setMostrarModal(false);
        setDescuento("");
    };

    return (
        <Modal show={mostrarModal} onHide={() => setMostrarModal(false)} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Aplicar Descuento - {productoSeleccionado.nombre_producto}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Row className="mb-4">
                    <Col md={6}>
                        <p className="mb-1"><strong>Precio Actual:</strong></p>
                        <h4 className="text-success">${precioActual.toFixed(2)}</h4>
                    </Col>
                    <Col md={6}>
                        <p className="mb-1"><strong>Nuevo Precio:</strong></p>
                        <h4 className="text-primary">${calcularNuevoPrecio().toFixed(2)}</h4>
                    </Col>
                </Row>

                <Form>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Tipo de Descuento</Form.Label>
                                <Form.Select 
                                    value={tipoDescuento} 
                                    onChange={(e) => setTipoDescuento(e.target.value)}
                                >
                                    <option value="porcentaje">Porcentaje (%)</option>
                                    <option value="monto">Monto Fijo ($)</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    {tipoDescuento === "porcentaje" ? "Porcentaje de Descuento" : "Monto a descontar"}
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={descuento}
                                    onChange={(e) => {
                                        setDescuento(e.target.value);
                                        setError("");
                                    }}
                                    placeholder={tipoDescuento === "porcentaje" ? "10" : "5.00"}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    {error && <Alert variant="danger" className="mt-2">{error}</Alert>}
                </Form>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={() => setMostrarModal(false)}>
                    Cancelar
                </Button>
                <Button 
                    variant="success" 
                    onClick={handleAplicarDescuento}
                    disabled={deshabilitado || !descuento}
                >
                    {deshabilitado ? "Aplicando Descuento..." : "Aplicar Descuento"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalDescuentoProducto;