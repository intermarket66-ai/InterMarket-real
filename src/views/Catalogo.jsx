import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Spinner } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig';

function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

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
          categorias (
            nombre_categoria
          )
        `)
        .eq("estado", "activo")
        .order("id", { ascending: true });

      if (error) {
        console.error("Error al cargar productos:", error.message);
        return;
      }
      setProductos(data || []);
    } catch (err) {
      console.error("Excepción al cargar productos:", err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <Container>
      <br />
      <Row>
        <Col>
          <h1>Catálogo de Productos</h1>
        </Col>
      </Row>
      <br />

      {cargando ? (
        <div className="text-center">
          <Spinner animation="border" />
          <p>Cargando catálogo...</p>
        </div>
      ) : (
        <Row>
          {productos.map((producto) => (
            <Col key={producto.id} xs={12} sm={6} md={4} lg={3} className="mb-4">
              <Card className="h-100 shadow-sm">
                {producto.imagenes && (
                  <Card.Img
                    variant="top"
                    src={producto.imagenes}
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
                    {producto.descripcion.length > 100
                      ? `${producto.descripcion.substring(0, 100)}...`
                      : producto.descripcion
                    }
                  </Card.Text>
                  <div className="mb-2">
                    <Badge bg="secondary">
                      {producto.categorias?.nombre_categoria || 'Sin categoría'}
                    </Badge>
                  </div>
                  <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <small className="text-muted">Precio:</small>
                        <div className="fw-bold text-success">${producto.precio_venta}</div>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

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
