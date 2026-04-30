import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button, Card, Spinner } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";
import NotificacionOperacion from '../components/NotificacionOperacion';
import TarjetasProductos from '../components/productos/TarjetasProductos';

const AdminInicio = () => {
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [toast, setToast] = useState({ mostrar: false, mensaje: '', tipo: '' });

  useEffect(() => {
    const fetchData = async () => {
      setCargando(true);
      const { data: ventasData } = await supabase.from("ventas").select("*");
      setVentas(ventasData || []);
      const { data: productosData } = await supabase.from("productos").select("*");
      setProductos(productosData || []);
      const { data: usuariosData } = await supabase.from("usuarios").select("*");
      setUsuarios(usuariosData || []);
      setCargando(false);
    };
    fetchData();
  }, []);

  return (
    <Container className="mt-3">
      <Row className="align-items-center mb-3">
        <Col>
          <h2><i className="bi bi-speedometer2 me-2"></i> Dashboard Administrador</h2>
        </Col>
      </Row>
      {cargando ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <div>Cargando datos...</div>
        </div>
      ) : (
        <>
          <Row className="mb-4">
            <Col md={4}>
              <Card className="mb-3 shadow-sm">
                <Card.Body>
                  <Card.Title>Ventas</Card.Title>
                  <Card.Text className="display-6 fw-bold">{ventas.length}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="mb-3 shadow-sm">
                <Card.Body>
                  <Card.Title>Productos</Card.Title>
                  <Card.Text className="display-6 fw-bold">{productos.length}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="mb-3 shadow-sm">
                <Card.Body>
                  <Card.Title>Usuarios</Card.Title>
                  <Card.Text className="display-6 fw-bold">{usuarios.length}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Opción para crear venta si no hay ventas */}
          {ventas.length === 0 && (
            <Row className="mb-4">
              <Col>
                <Button variant="success">Crear primera venta</Button>
              </Col>
            </Row>
          )}

          {/* Listado de productos */}
          <Row className="mb-4">
            <Col>
              <h4>Productos</h4>
              <TarjetasProductos productos={productos} />
              <Button variant="primary" className="mt-3">Añadir producto</Button>
            </Col>
          </Row>

          {/* Mensajes recibidos (simulado) */}
          <Row className="mb-4">
            <Col>
              <h4>Mensajes de usuarios</h4>
              <div className="text-muted">(Aquí se mostrarían los mensajes recibidos de los usuarios)</div>
            </Col>
          </Row>
        </>
      )}
      <NotificacionOperacion
        mostrar={toast.mostrar}
        mensaje={toast.mensaje}
        tipo={toast.tipo}
        onClose={() => setToast({ mostrar: false, mensaje: '', tipo: '' })}
      />
    </Container>
  );
};

export default AdminInicio;
