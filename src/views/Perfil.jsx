import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Spinner, Button, Tabs, Tab, Form, Table, Badge, Alert } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Perfil = () => {
  const { user, session } = useAuth();
  const navegar = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminandoTarjetaId, setEliminandoTarjetaId] = useState(null);
  const [fotoUrl, setFotoUrl] = useState("");
  const [archivoNuevo, setArchivoNuevo] = useState(null);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
  
  // Estados para añadir tarjeta
  const [showAddModal, setShowAddModal] = useState(false);
  const [nuevaTarjeta, setNuevaTarjeta] = useState({ tipo: "Visa", ultimo4: "" });
  const [guardandoTarjeta, setGuardandoTarjeta] = useState(false);

  useEffect(() => {
    const fetchDatos = async () => {
      setLoading(true);
      if (!user) {
        setLoading(false);
        return;
      }
      
      // 1. Obtener perfil
      let { data: perfilData } = await supabase
        .from("perfiles")
        .select("*, usuarios(email, username)")
        .eq("id_usuario", user.id)
        .maybeSingle();
        
      if (!perfilData) {
        // Fallback: Si por alguna razón el trigger de Supabase falló al registrarse (ej. con Google), 
        // creamos el registro del usuario y perfil manualmente aquí.
        try {
          const email = user.email || '';
          const username = email ? email.split('@')[0] : 'usuario';
          
          await supabase.from('usuarios').upsert({
            id_usuario: user.id,
            username: username,
            email: email,
            rol: 'comprador'
          });
          
          await supabase.from('perfiles').upsert({
            id_usuario: user.id,
          });

          const { data: retryData } = await supabase
            .from("perfiles")
            .select("*, usuarios(email, username)")
            .eq("id_usuario", user.id)
            .maybeSingle();
            
          perfilData = retryData;
        } catch (err) {
          console.error("Error intentando crear el perfil de respaldo:", err);
        }
      }
        
      if (perfilData) {
        setPerfil(perfilData);
        setFotoUrl(perfilData.foto_perfil || "");
        
        // 2. Obtener historial de pedidos
        const { data: pedidosData } = await supabase
          .from("pedidos")
          .select(`
            id_pedido, 
            creado_en, 
            precio_unitario, 
            id_estado, 
            productos(nombre_producto, imagen_url)
          `)
          .eq("perfil_id", perfilData.perfil_id)
          .order("creado_en", { ascending: false });
          
        setPedidos(pedidosData || []);

        // 3. Obtener métodos de pago guardados del comprador
        const { data: metodosData } = await supabase
          .from("metodos_pago")
          .select("*")
          .eq("id_usuario", user.id)
          .order("creado_en", { ascending: false });

        setMetodosPago(metodosData || []);
      }
      setLoading(false);
    };
    fetchDatos();
  }, [user]);

  const manejarArchivo = (e) => {
    if (e.target.files && e.target.files[0]) {
      setArchivoNuevo(e.target.files[0]);
    }
  };

  const guardarPerfil = async () => {
    if (!perfil) return;
    setGuardando(true);
    setMensaje({ texto: "", tipo: "" });
    try {
      let urlFinal = fotoUrl;

      // Si hay un archivo nuevo, lo subimos
      if (archivoNuevo) {
        const fileExt = archivoNuevo.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const filePath = `avatares/${fileName}`; // Usaremos una carpeta dentro del bucket por orden

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, archivoNuevo);

        if (uploadError) throw uploadError;

        // Obtener la URL pública
        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
          
        urlFinal = publicUrlData.publicUrl;
        setFotoUrl(urlFinal);
      }

      const { error } = await supabase
        .from("perfiles")
        .update({ foto_perfil: urlFinal })
        .eq("perfil_id", perfil.perfil_id);
        
      if (error) throw error;
      setMensaje({ texto: "Perfil actualizado correctamente.", tipo: "success" });
      setArchivoNuevo(null); // Limpiamos el archivo subido
    } catch (err) {
      console.error(err);
      setMensaje({ texto: "Error al actualizar perfil. ¿Ya ejecutaste el código SQL?", tipo: "danger" });
    } finally {
      setGuardando(false);
    }
  };

  const getBadgeColor = (id_estado) => {
    switch(id_estado) {
      case 1: return 'warning'; // Pendiente
      case 2: return 'success'; // Pagado / Aceptado
      case 3: return 'danger'; // Cancelado / Rechazado
      case 4: return 'info'; // Entregado / Completado
      default: return 'secondary';
    }
  };

  const eliminarTarjeta = async (id_metodo_pago) => {
    const confirmar = window.confirm("¿Eliminar esta tarjeta? Esta acción no se puede deshacer.");
    if (!confirmar) return;
    if (!session?.access_token) {
      setMensaje({ texto: "No se pudo autenticar la sesión. Vuelve a iniciar sesión.", tipo: "danger" });
      return;
    }

    setEliminandoTarjetaId(id_metodo_pago);
    setMensaje({ texto: "", tipo: "" });

    try {
      const response = await fetch('/.netlify/functions/delete-payment-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id_metodo_pago }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al eliminar tarjeta');
      }

      setMetodosPago((prev) => prev.filter((m) => m.id_metodo_pago !== id_metodo_pago));
      setMensaje({ texto: "Tarjeta eliminada correctamente.", tipo: "success" });
    } catch (err) {
      console.error(err);
      setMensaje({ texto: err.message || "No se pudo eliminar la tarjeta. Intenta de nuevo más tarde.", tipo: "danger" });
    } finally {
      setEliminandoTarjetaId(null);
    }
  };

  const getEstadoTexto = (id_estado) => {
    switch(id_estado) {
      case 1: return 'En proceso (Pendiente)';
      case 2: return 'Aceptado por vendedor';
      case 3: return 'Rechazado/Cancelado';
      case 4: return 'Enviado/Entregado';
      default: return 'Desconocido';
    }
  };

  const agregarNuevaTarjeta = async () => {
    if (!nuevaTarjeta.ultimo4 || nuevaTarjeta.ultimo4.length !== 4) {
      alert("Por favor, ingresa los últimos 4 dígitos.");
      return;
    }
    setGuardandoTarjeta(true);
    try {
      const { data, error } = await supabase.from("metodos_pago").insert({
        id_usuario: user.id,
        id_stripe_customer: 'cus_manual',
        id_stripe_payment_method: 'pm_manual_' + Date.now(),
        ultimo4: nuevaTarjeta.ultimo4,
        tipo_metodo: nuevaTarjeta.tipo,
      }).select().single();

      if (error) throw error;

      setMetodosPago([data, ...metodosPago]);
      setShowAddModal(false);
      setNuevaTarjeta({ tipo: "Visa", ultimo4: "" });
      setMensaje({ texto: "Tarjeta añadida correctamente.", tipo: "success" });
    } catch (err) {
      console.error(err);
      setMensaje({ texto: "Error al añadir la tarjeta.", tipo: "danger" });
    } finally {
      setGuardandoTarjeta(false);
    }
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
        <div>Cargando panel...</div>
      </Container>
    );
  }

  if (!perfil) {
    return (
      <Container className="mt-5 text-center">
        <Card className="p-4 mx-auto" style={{ maxWidth: 400 }}>
          <Card.Body>
            <Card.Title>Perfil no encontrado</Card.Title>
            <Card.Text>No se encontró información de perfil para este usuario.</Card.Text>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="mt-5 pt-4">
      <Row className="mb-4 align-items-center">
        <Col xs={8} md={9}>
          <h2 className="fw-bold text-primary mb-0"><i className="bi bi-person-circle me-2"></i>Mi Panel</h2>
        </Col>
        <Col xs={4} md={3} className="text-end">
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={() => navegar("/seleccion-rol")}
            className="rounded-pill px-3 shadow-sm"
          >
            <i className="bi bi-arrow-left-right me-1"></i>
            <span className="d-none d-sm-inline">Cambiar Rol</span>
          </Button>
        </Col>
      </Row>

      <Tabs defaultActiveKey="perfil" className="mb-4">
        {/* PESTAÑA MI INFORMACIÓN */}
        <Tab eventKey="perfil" title={<span><i className="bi bi-info-circle me-2"></i>Mi Información</span>}>
          <Card className="shadow-sm border-0 mt-3">
            <Card.Body className="p-4">
              {mensaje.texto && <Alert variant={mensaje.tipo}>{mensaje.texto}</Alert>}
              <Row>
                <Col md={4} className="text-center border-end mb-4 mb-md-0">
                  <img
                    src={fotoUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(perfil.usuarios?.username || user.user_metadata?.full_name || "Usuario")}
                    alt="Foto de perfil"
                    className="rounded-circle mb-3 shadow"
                    style={{ width: 150, height: 150, objectFit: "cover", border: '4px solid #fff' }}
                  />
                  <h4 className="fw-bold">{perfil.usuarios?.username || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || "Usuario"}</h4>
                  <p className="text-muted">{perfil.usuarios?.email || user.email}</p>
                  <Badge bg="primary" className="px-3 py-2 text-uppercase">
                    {perfil.rol || "Comprador"}
                  </Badge>
                </Col>
                
                <Col md={8} className="ps-md-4">
                  <h5 className="border-bottom pb-2 mb-4">Editar Perfil</h5>
                  
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold text-muted">Fotografía de Perfil</Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={manejarArchivo}
                    />
                    <Form.Text className="text-muted">
                      Selecciona una imagen en formato JPG o PNG desde tu dispositivo.
                    </Form.Text>
                  </Form.Group>

                  <Button variant="success" onClick={guardarPerfil} disabled={guardando}>
                    {guardando ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Tab>

        {/* PESTAÑA MÉTODOS DE PAGO */}
        <Tab eventKey="metodos" title={<span><i className="bi bi-credit-card me-2"></i>Métodos de Pago</span>}>
          <Card className="shadow-sm border-0 mt-3">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-4">
                <h5 className="mb-0">Tarjetas guardadas</h5>
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="rounded-pill px-3"
                  onClick={() => setShowAddModal(true)}
                >
                  <i className="bi bi-plus-lg me-1"></i>Añadir Tarjeta
                </Button>
              </div>

              {metodosPago.length === 0 ? (
                <div className="text-center p-5 bg-light rounded">
                  <i className="bi bi-credit-card text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                  <p className="text-muted">No hay tarjetas guardadas en este perfil.</p>
                </div>
              ) : (
                <Table responsive hover className="align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Tipo</th>
                      <th>Últimos 4</th>
                      <th>ID Stripe</th>
                      <th>Guardada</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metodosPago.map((metodo) => (
                      <tr key={metodo.id_metodo_pago}>
                        <td>{metodo.tipo_metodo || 'Tarjeta'}</td>
                        <td>**** **** **** {metodo.ultimo4 || '----'}</td>
                        <td className="text-truncate" style={{ maxWidth: 180 }}>{metodo.id_stripe_payment_method || '-'}</td>
                        <td>{metodo.creado_en ? new Date(metodo.creado_en).toLocaleDateString() : '-'}</td>
                         <td>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => eliminarTarjeta(metodo.id_metodo_pago)}
                            disabled={eliminandoTarjetaId === metodo.id_metodo_pago}
                          >
                            {eliminandoTarjetaId === metodo.id_metodo_pago ? '...' : <i className="bi bi-trash"></i>}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* PESTAÑA MIS PEDIDOS */}
        <Tab eventKey="pedidos" title={<span><i className="bi bi-box-seam me-2"></i>Mis Pedidos ({pedidos.length})</span>}>
          <Card className="shadow-sm border-0 mt-3">
            <Card.Body className="p-4">
              <h5 className="border-bottom pb-2 mb-4">Historial de Compras</h5>
              
              {pedidos.length === 0 ? (
                <div className="text-center p-5 bg-light rounded">
                  <i className="bi bi-cart-x text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                  <p className="text-muted">Aún no has realizado ninguna compra.</p>
                </div>
              ) : (
                <>
                  {/* VISTA MÓVIL (TARJETAS) */}
                  <div className="d-lg-none">
                    <Row xs={1} md={2} className="g-3">
                      {pedidos.map(pedido => (
                        <Col key={pedido.id_pedido}>
                          <Card className="h-100 shadow-sm border-0">
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <small className="text-muted">Pedido #{pedido.id_pedido.split('-')[0]}</small>
                                <Badge bg={getBadgeColor(pedido.id_estado)} className="px-2 py-1 text-uppercase">
                                  {getEstadoTexto(pedido.id_estado)}
                                </Badge>
                              </div>
                              <div className="d-flex align-items-center mb-3">
                                {pedido.productos?.imagen_url?.[0] ? (
                                  <img 
                                    src={pedido.productos.imagen_url[0]} 
                                    alt="" 
                                    style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px'}} 
                                    className="me-3 shadow-sm"
                                  />
                                ) : (
                                  <div className="bg-light me-3 rounded d-flex align-items-center justify-content-center" style={{width: '50px', height: '50px'}}>
                                    <i className="bi bi-image text-muted"></i>
                                  </div>
                                )}
                                <Card.Title className="h6 mb-0">{pedido.productos?.nombre_producto}</Card.Title>
                              </div>
                              <hr className="my-2" />
                              <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Fecha:</span>
                                <strong>{new Date(pedido.creado_en).toLocaleDateString()}</strong>
                              </div>
                              <div className="d-flex justify-content-between">
                                <span className="text-muted">Precio:</span>
                                <strong className="text-success">${Number(pedido.precio_unitario).toFixed(2)}</strong>
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
                          <th>Pedido</th>
                          <th>Fecha</th>
                          <th>Producto</th>
                          <th>Precio</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pedidos.map(pedido => (
                          <tr key={pedido.id_pedido}>
                            <td><small className="text-muted">#{pedido.id_pedido.split('-')[0]}</small></td>
                            <td>{new Date(pedido.creado_en).toLocaleDateString()}</td>
                            <td>
                              <div className="d-flex align-items-center">
                                {pedido.productos?.imagen_url?.[0] && (
                                  <img 
                                    src={pedido.productos.imagen_url[0]} 
                                    alt="" 
                                    style={{width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px'}} 
                                    className="me-2"
                                  />
                                )}
                                <span className="fw-bold">{pedido.productos?.nombre_producto}</span>
                              </div>
                            </td>
                            <td className="text-success fw-bold">${Number(pedido.precio_unitario).toFixed(2)}</td>
                            <td>
                              <Badge bg={getBadgeColor(pedido.id_estado)} className="px-3 py-2 text-uppercase shadow-sm">
                                {getEstadoTexto(pedido.id_estado)}
                              </Badge>
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
        </Tab>
      </Tabs>
      {/* MODAL PARA AÑADIR TARJETA */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title"><i className="bi bi-credit-card-2-front me-2"></i>Añadir Nueva Tarjeta</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Tipo de Tarjeta</Form.Label>
                  <Form.Select 
                    value={nuevaTarjeta.tipo}
                    onChange={(e) => setNuevaTarjeta({...nuevaTarjeta, tipo: e.target.value})}
                  >
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="American Express">American Express</option>
                    <option value="Débito">Tarjeta de Débito</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Últimos 4 Dígitos</Form.Label>
                  <Form.Control
                    type="text"
                    maxLength="4"
                    placeholder="Eje: 4242"
                    value={nuevaTarjeta.ultimo4}
                    onChange={(e) => setNuevaTarjeta({...nuevaTarjeta, ultimo4: e.target.value.replace(/\D/g, '')})}
                  />
                  <Form.Text className="text-muted">
                    Por seguridad, solo guardamos los últimos 4 números.
                  </Form.Text>
                </Form.Group>

                <Alert variant="info" className="small d-flex align-items-center">
                  <i className="bi bi-info-circle-fill me-2 fs-5"></i>
                  Esta tarjeta se añadirá como un método de pago simulado para tus compras.
                </Alert>
              </div>
              <div className="modal-footer border-0">
                <Button variant="light" onClick={() => setShowAddModal(false)}>Cancelar</Button>
                <Button variant="dark" onClick={agregarNuevaTarjeta} disabled={guardandoTarjeta}>
                  {guardandoTarjeta ? 'Guardando...' : 'Añadir Tarjeta'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default Perfil;
