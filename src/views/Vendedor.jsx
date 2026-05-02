import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Spinner, Table, Badge, Card } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";
import { useAuth } from "../context/AuthContext";

const Vendedor = () => {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarPedidos = async () => {
    if (!user) return;
    try {
      setCargando(true);
      
      // 1. Obtener la tienda del vendedor
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('id_tienda')
        .eq('id_usuario', user.id)
        .maybeSingle();
        
      if (!perfil?.id_tienda) {
        setPedidos([]);
        return;
      }
      
      // 2. Obtener los pedidos asociados a los productos de su tienda
      const { data, error } = await supabase
        .from("pedidos")
        .select(`
          id_pedido,
          creado_en,
          precio_unitario,
          id_estado,
          productos!inner (nombre_producto, id_tienda),
          perfiles ( usuarios ( username ) )
        `)
        .eq("productos.id_tienda", perfil.id_tienda)
        .order("creado_en", { ascending: false });

      if (error) throw error;
      setPedidos(data || []);
    } catch (err) {
      console.error("Error al cargar pedidos:", err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPedidos();
    
    if (user) {
      // Suscripción a cambios en la tabla pedidos
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pedidos'
          },
          (payload) => {
            console.log('Cambio en pedidos:', payload);
            cargarPedidos();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      }
    }
  }, [user]);

  const cambiarEstadoPedido = async (id_pedido, nuevoEstadoId) => {
    try {
      const { error } = await supabase
        .from("pedidos")
        .update({ id_estado: nuevoEstadoId })
        .eq("id_pedido", id_pedido);
        
      if (error) throw error;
      cargarPedidos();
    } catch (error) {
      alert("Error al actualizar pedido");
    }
  };

  const badgeColor = (id_estado) => {
    switch(id_estado) {
      case 1: return 'warning'; // Pendiente
      case 2: return 'success'; // Pagado / Aceptado
      case 3: return 'danger'; // Cancelado / Rechazado
      case 4: return 'info'; // Entregado / Completado
      default: return 'secondary';
    }
  };
  
  const getEstadoTexto = (id_estado) => {
    switch(id_estado) {
      case 1: return 'Pendiente';
      case 2: return 'Pagado';
      case 3: return 'Cancelado';
      case 4: return 'Entregado';
      default: return 'Desconocido';
    }
  };

  return (
    <Container>
      <br />
      <br />
      <br />
      <br />
      <Row className="mb-4">
        <Col>
          <h2 className="text-primary"><i className="bi bi-speedometer2 me-2"></i>Dashboard Vendedor</h2>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center shadow-sm border-0">
            <Card.Body>
              <h5 className="text-muted">Total Pedidos</h5>
              <h2 className="fw-bold">{pedidos.length}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center shadow-sm border-0">
            <Card.Body>
              <h5 className="text-muted">Pedidos Pendientes</h5>
              <h2 className="fw-bold text-warning">
                {pedidos.filter(p => p.id_estado === 1).length}
              </h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center shadow-sm border-0 bg-primary text-white">
            <Card.Body>
              <h5 className="text-white-50">Ingresos Potenciales</h5>
              <h2 className="fw-bold">
                ${pedidos.filter(p => p.id_estado !== 3).reduce((acc, p) => acc + Number(p.precio_unitario), 0).toFixed(2)}
              </h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm border-0 mb-5">
        <Card.Header className="bg-white border-bottom-0 pt-4 pb-0">
          <h4 className="m-0"><i className="bi bi-list-check me-2"></i>Gestión de Pedidos</h4>
        </Card.Header>
        <Card.Body>
          {cargando ? (
            <div className="text-center p-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Cargando pedidos...</p>
            </div>
          ) : pedidos.length === 0 ? (
            <div className="text-center p-5 bg-light rounded">
              <i className="bi bi-inbox text-muted" style={{ fontSize: '3rem' }}></i>
              <p className="mt-3 text-muted">Aún no tienes pedidos asociados a tu tienda.</p>
            </div>
          ) : (
            <>
              {/* VISTA MÓVIL (TARJETAS) */}
              <div className="d-lg-none">
                <Row xs={1} md={2} className="g-3">
                  {pedidos.map((pedido) => (
                    <Col key={pedido.id_pedido}>
                      <Card className="h-100 shadow-sm border-0">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <small className="text-muted">ID: {pedido.id_pedido.split('-')[0]}</small>
                            <Badge bg={badgeColor(pedido.id_estado)} className="px-2 py-1 text-uppercase">
                              {getEstadoTexto(pedido.id_estado)}
                            </Badge>
                          </div>
                          <Card.Title className="h5 mb-1">{pedido.productos?.nombre_producto}</Card.Title>
                          <Card.Subtitle className="mb-2 text-muted">
                            <i className="bi bi-person me-1"></i> {pedido.perfiles?.usuarios?.username || 'Usuario'}
                          </Card.Subtitle>
                          <hr className="my-2" />
                          <div className="d-flex justify-content-between mb-2">
                            <span>Fecha:</span>
                            <strong>{new Date(pedido.creado_en).toLocaleDateString()}</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-3">
                            <span>Monto:</span>
                            <strong className="text-success">${Number(pedido.precio_unitario).toFixed(2)}</strong>
                          </div>
                          <div className="d-flex justify-content-end gap-2">
                            {pedido.id_estado === 1 && (
                              <>
                                <Button 
                                  variant="outline-success" 
                                  size="sm" 
                                  onClick={() => cambiarEstadoPedido(pedido.id_pedido, 2)}
                                >
                                  <i className="bi bi-check-circle me-1"></i> Aceptar
                                </Button>
                                <Button 
                                  variant="outline-danger" 
                                  size="sm"
                                  onClick={() => cambiarEstadoPedido(pedido.id_pedido, 3)}
                                >
                                  <i className="bi bi-x-circle me-1"></i> Rechazar
                                </Button>
                              </>
                            )}
                            {pedido.id_estado === 2 && (
                              <Button 
                                variant="outline-info" 
                                size="sm" 
                                onClick={() => cambiarEstadoPedido(pedido.id_pedido, 4)}
                              >
                                <i className="bi bi-box-seam me-1"></i> Entregar
                              </Button>
                            )}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>

              {/* VISTA ESCRITORIO (TABLA) */}
              <div className="d-none d-lg-block">
                <Table responsive hover className="align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>ID Pedido</th>
                      <th>Fecha</th>
                      <th>Producto</th>
                      <th>Comprador</th>
                      <th>Monto</th>
                      <th>Estado</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidos.map((pedido) => (
                      <tr key={pedido.id_pedido}>
                        <td><small className="text-muted">{pedido.id_pedido.split('-')[0]}</small></td>
                        <td>{new Date(pedido.creado_en).toLocaleDateString()}</td>
                        <td>{pedido.productos?.nombre_producto}</td>
                        <td>{pedido.perfiles?.usuarios?.username || 'Usuario'}</td>
                        <td className="fw-bold text-success">${Number(pedido.precio_unitario).toFixed(2)}</td>
                        <td>
                          <Badge bg={badgeColor(pedido.id_estado)} className="px-3 py-2 text-uppercase">
                            {getEstadoTexto(pedido.id_estado)}
                          </Badge>
                        </td>
                        <td className="text-center">
                          {pedido.id_estado === 1 && (
                            <>
                              <Button 
                                variant="success" 
                                size="sm" 
                                className="me-2 rounded-pill px-3"
                                onClick={() => cambiarEstadoPedido(pedido.id_pedido, 2)}
                              >
                                <i className="bi bi-check-circle me-1"></i> Aceptar
                              </Button>
                              <Button 
                                variant="danger" 
                                size="sm"
                                className="rounded-pill px-3"
                                onClick={() => cambiarEstadoPedido(pedido.id_pedido, 3)}
                              >
                                <i className="bi bi-x-circle me-1"></i> Rechazar
                              </Button>
                            </>
                          )}
                          {pedido.id_estado === 2 && (
                            <Button 
                              variant="info" 
                              size="sm" 
                              className="rounded-pill px-3 text-white"
                              onClick={() => cambiarEstadoPedido(pedido.id_pedido, 4)}
                            >
                              <i className="bi bi-box-seam me-1"></i> Marcar Entregado
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Vendedor;