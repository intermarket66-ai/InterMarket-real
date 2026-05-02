import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Container, Nav, Navbar, Offcanvas, Dropdown, Badge } from "react-bootstrap";
import logo from "../../assets/icono_intermAeview.png";
import { supabase } from "../../database/supabaseconfig";
import { useAuth } from "../../context/AuthContext";
import "../../App.css";

const Encabezado = () => {
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const [carritoCount, setCarritoCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation(); // Para detectar la ruta actual
  const { user, role, signOut } = useAuth();

  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);

  // Cargar notificaciones
  useEffect(() => {
    if (!user) return;
    
    let perfilId;
    
    const cargarNotificaciones = async () => {
      const { data: perfilData } = await supabase.from('perfiles').select('perfil_id').eq('id_usuario', user.id).maybeSingle();
      if (!perfilData) return;
      perfilId = perfilData.perfil_id;
      
      const { data } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('usuario_id', perfilId)
        .order('creado_en', { ascending: false })
        .limit(10);
        
      if (data) {
        setNotificaciones(data);
        setNoLeidas(data.filter(n => !n.leido).length);
      }
    };
    
    cargarNotificaciones();
    
    const channel = supabase.channel('notificaciones_navbar')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificaciones' }, payload => {
        // En un entorno de producción, filtrar con RLS o en el channel, aquí validamos localmente:
        // Pero como no tenemos el id del usuario en la notificación directamente sino el perfil_id,
        // simplemente recargamos si no coincide, o asumimos que el RLS detiene eventos ajenos.
        // Dado que Supabase Realtime no filtra RLS por defecto si no lo configuramos, recargaremos:
        cargarNotificaciones();
      })
      .subscribe();
      
      return () => supabase.removeChannel(channel);
  }, [user]);

  const marcarComoLeidas = async () => {
      if (noLeidas === 0) return;
      setNoLeidas(0);
      
      const noLeidasIds = notificaciones.filter(n => !n.leido).map(n => n.id_notificacion);
      if (noLeidasIds.length === 0) return;
      
      setNotificaciones(prev => prev.map(n => ({...n, leido: true})));
      await supabase.from('notificaciones').update({ leido: true }).in('id_notificacion', noLeidasIds);
  };

  const manejarToggle = () => setMostrarMenu(!mostrarMenu);

  const manejarNavegacion = (ruta) => {
    navigate(ruta);
    setMostrarMenu(false);
  };

  const actualizarCarritoCount = () => {
    const carritoGuardado = JSON.parse(localStorage.getItem("carrito") || "[]");
    const cantidad = carritoGuardado.reduce(
      (total, item) => total + (item.cantidad || 0),
      0
    );
    setCarritoCount(cantidad);
  };

  useEffect(() => {
    actualizarCarritoCount();
    window.addEventListener("storage", actualizarCarritoCount);
    window.addEventListener("carritoActualizado", actualizarCarritoCount);
    return () => {
      window.removeEventListener("storage", actualizarCarritoCount);
      window.removeEventListener("carritoActualizado", actualizarCarritoCount);
    };
  }, []);

  const cerrarSesion = async () => {
    try {
      await signOut();
      setMostrarMenu(false);
      navigate("/login");
    } catch (error) {
      console.error("Error cerrando sesión:", error.message);
    }
  };

  // Detectar rutas especiales
  const esLogin = location.pathname === "/login";
  const esCatalogo = location.pathname === "/catalogo" && !user;

  // Contenido del menú
  let contenidoMenu;

  if (esLogin) {
    contenidoMenu = (
      <Nav className="ms-auto pe-2">
        <Nav.Link
          onClick={() => manejarNavegacion("/login")}
          className={mostrarMenu ? "color-texto-marca" : "text-dark"}
        >
          <i className="bi-person-fill-lock me-2"></i>
          Iniciar sesión
        </Nav.Link>
      </Nav>
    );
  } else if (esCatalogo) {
    contenidoMenu = (
      <Nav className="ms-auto pe-2">
        <Nav.Link
          onClick={() => manejarNavegacion("/catalogo")}
          className={mostrarMenu ? "color-texto-marca" : "text-dark"}
        >
          <i className="bi-images me-2"></i>
          <strong>Catálogo</strong>
        </Nav.Link>
      </Nav>
    );
  } else {
    contenidoMenu = (
      <>
        <Nav className="navbar">
          <Nav.Link
            onClick={() => manejarNavegacion("/")}
            className={mostrarMenu ? "color-texto-marca" : "text-dark"}
          >
            {mostrarMenu ? <i className="bi-house-fill me-2"></i> : null}
            <strong>Inicio</strong>
          </Nav.Link>

          {/* Menú Vendedor */}
          {role === 'vendedor' && (
            <>
              <Nav.Link
                onClick={() => manejarNavegacion("/productos")}
                className={mostrarMenu ? "color-texto-marca" : "text-dark"}
              >
                {mostrarMenu ? <i className="bi-box-seam me-2"></i> : null}
                <strong>Mis Productos</strong>
              </Nav.Link>

              <Nav.Link
                onClick={() => manejarNavegacion("/tiendas")}
                className={mostrarMenu ? "color-texto-marca" : "text-dark"}
              >
                {mostrarMenu ? <i className="bi bi-shop-window me-2"></i> : null}
                <strong>Mi Tienda</strong>
              </Nav.Link>

              <Nav.Link
                onClick={() => manejarNavegacion("/vendedor")}
                className={mostrarMenu ? "color-texto-marca" : "text-dark"}
              >
                {mostrarMenu ? <i className="bi-cash-coin me-2"></i> : null}
                <strong>Ventas y Pedidos</strong>
              </Nav.Link>
            </>
          )}

          {/* Menú Comprador */}
          {role === 'comprador' && (
            <>
              <Nav.Link
                onClick={() => manejarNavegacion("/catalogo")}
                className={mostrarMenu ? "color-texto-marca" : "text-dark"}
              >
                {mostrarMenu ? <i className="bi-images me-2"></i> : null}
                <strong>Catálogo</strong>
              </Nav.Link>

              <Nav.Link
                onClick={() => manejarNavegacion("/perfil")}
                className={mostrarMenu ? "color-texto-marca" : "text-dark"}
              >
                {mostrarMenu ? <i className="bi-person-lines-fill me-2"></i> : null}
                <strong>Mi Perfil</strong>
              </Nav.Link>
            </>
          )}

          <Nav.Link
            onClick={() => manejarNavegacion("/mensajes")}
            className={mostrarMenu ? "color-texto-marca" : "text-dark"}
          >
            {mostrarMenu ? <i className="bi bi-chat-dots-fill me-2"></i> : null}
            <strong>Mensajes</strong>
          </Nav.Link>

          <hr />

          {/* Ícono cerrar sesión en barra superior */}
          {mostrarMenu ? null : (
            <Nav.Link
              onClick={cerrarSesion}
              className={mostrarMenu ? "color-texto-marca" : "text-dark"}
            >
              <i className="bi-box-arrow-right me-2"></i>
            </Nav.Link>
          )}
          <hr />
        </Nav>

        {/* Información de usuario y botón cerrar sesión */}
        {mostrarMenu && (
          <div className="mt-3 p-3 rounded bg-light text-dark">
            <p className="mb-2">
              <i className="bi-person-badge-fill me-2"></i>
              {user?.email || "Usuario"} ({role || "invitado"})
            </p>

            <button
              className="btn btn-outline-danger mt-3 w-100"
              onClick={cerrarSesion}
            >
              <i className="bi-box-arrow-right me-2"></i>
              Cerrar sesión
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <Navbar className="color-navbar shadow-lg" bg="text-warning" expand="md" fixed="top" variant="dark">
      <Container>
        <Navbar.Brand
          onClick={() => manejarNavegacion(esCatalogo ? "/catalogo" : "/")}
          className="text-dark fw-bold d-flex align-items-center"
          style={{ cursor: "pointer" }}
        >
          <img
           
            alt=""
            src={logo}
            width="45"
            height="45"
            className="d-inline-block me-2"
          />
          <strong>
            <h4 className=  "mb-0">InterMarket</h4>
          </strong>
        </Navbar.Brand>

        {/* Contenedor de iconos derecha (Notificaciones + Carrito) */}
        <div className="d-flex align-items-center ms-auto me-md-2">
          
          {/* Campanita de Notificaciones */}
          {user && !esLogin && (
            <Dropdown align="end" className="me-2" onToggle={(isOpen) => { if (isOpen) marcarComoLeidas(); }}>
              <Dropdown.Toggle variant="outline-dark" className="border-0 bg-transparent text-dark p-2 position-relative shadow-none">
                <i className="bi bi-bell-fill fs-5"></i>
                {noLeidas > 0 && (
                  <Badge bg="danger" className="position-absolute top-0 start-50 translate-middle rounded-pill" style={{fontSize: '0.65rem'}}>
                    {noLeidas}
                  </Badge>
                )}
              </Dropdown.Toggle>
              <Dropdown.Menu className="shadow-lg border-0" style={{ minWidth: '300px', maxHeight: '400px', overflowY: 'auto' }}>
                <Dropdown.Header className="fw-bold bg-light border-bottom text-dark">Notificaciones</Dropdown.Header>
                {notificaciones.length === 0 ? (
                  <Dropdown.Item className="text-muted text-center py-3">No tienes notificaciones nuevas</Dropdown.Item>
                ) : (
                  notificaciones.map(noti => (
                    <Dropdown.Item key={noti.id_notificacion} className={`border-bottom py-2 text-wrap ${!noti.leido ? 'bg-light' : ''}`}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <strong className={!noti.leido ? 'text-primary' : 'text-dark'}>{noti.titulo}</strong>
                        <small className="text-muted" style={{fontSize: '0.7rem'}}>
                          {new Date(noti.creado_en).toLocaleDateString()}
                        </small>
                      </div>
                      <p className="mb-0 text-muted" style={{fontSize: '0.85rem'}}>{noti.mensaje}</p>
                    </Dropdown.Item>
                  ))
                )}
              </Dropdown.Menu>
            </Dropdown>
          )}

        {/* Botón del Carrito - Solo para compradores */}
{!esLogin && role === 'comprador' && (
  <button
    type="button"
    className="btn btn-outline-primary btn-sm me-2 d-flex align-items-center carrito-navbar-btn"
    onClick={() => {
      // Si estamos en /catalogo, abrir el modal
      if (location.pathname === "/catalogo") {
        // Disparamos un evento que escuchará el componente Catalogo
        window.dispatchEvent(new Event("abrirCarrito"));
      } else {
        // Si no estamos en catálogo, navegamos primero
        navigate("/catalogo");
        // Y después de navegar, abrimos el modal (con un pequeño delay)
        setTimeout(() => {
          window.dispatchEvent(new Event("abrirCarrito"));
        }, 300);
      }
    }}
  >
    <i className="bi bi-cart-fill me-2"></i>
    <span>Carrito</span>
    {carritoCount > 0 && (
      <span className="badge bg-danger rounded-pill ms-2">
        {carritoCount}
      </span>
    )}
  </button>
)}
        </div>

        {/* Menú lateral */}
        <Navbar.Offcanvas
          id="menu-offcanvas"
          placement="end"
          show={mostrarMenu}
          onHide={() => setMostrarMenu(false)}
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>Menú InterMarket</Offcanvas.Title>
          </Offcanvas.Header>

          <Offcanvas.Body>{contenidoMenu}</Offcanvas.Body>
        </Navbar.Offcanvas>
      </Container>
    </Navbar>
  );
};

export default Encabezado;
