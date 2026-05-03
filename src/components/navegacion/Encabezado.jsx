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
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, signOut } = useAuth();

  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cargar notificaciones
  useEffect(() => {
    if (!user) return;

    const cargarNotificaciones = async () => {
      const { data: perfilData } = await supabase.from('perfiles').select('perfil_id').eq('id_usuario', user.id).maybeSingle();
      if (!perfilData) return;
      const perfilId = perfilData.perfil_id;

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
    setNotificaciones(prev => prev.map(n => ({ ...n, leido: true })));
    await supabase.from('notificaciones').update({ leido: true }).in('id_notificacion', noLeidasIds);
  };

  const manejarToggle = () => setMostrarMenu(!mostrarMenu);

  const manejarNavegacion = (ruta) => {
    navigate(ruta);
    setMostrarMenu(false);
  };

  const actualizarCarritoCount = () => {
    const carritoGuardado = JSON.parse(localStorage.getItem("carrito") || "[]");
    setCarritoCount(carritoGuardado.reduce((total, item) => total + (item.cantidad || 0), 0));
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
    await signOut();
    setMostrarMenu(false);
    navigate("/login");
  };

  const esLogin = location.pathname === "/login";
  const esCatalogo = location.pathname === "/catalogo" && !user;

  const MobileNavLink = ({ ruta, icono, texto, color = "" }) => (
    <Nav.Link 
        onClick={() => manejarNavegacion(ruta)} 
        className={`mobile-nav-link ${location.pathname === ruta ? "active" : ""} ${color}`}
    >
        <i className={`bi bi-${icono}`}></i>
        <span>{texto}</span>
    </Nav.Link>
  );

  return (
    <Navbar className={`color-navbar ${scrolled ? 'scrolled shadow-sm' : ''}`} expand="md" fixed="top">
      <Container>
        <Navbar.Brand
          onClick={() => manejarNavegacion(esCatalogo ? "/catalogo" : "/")}
          className="d-flex align-items-center"
          style={{ cursor: "pointer" }}
        >
          <img alt="InterMarket" src={logo} width="40" height="40" className="me-2" />
          <h4 className="mb-0 fw-800" style={{ color: 'var(--color-primario)' }}>InterMarket</h4>
        </Navbar.Brand>

        <div className="d-flex align-items-center order-md-2">
          {user && !esLogin && (
            <Dropdown align="end" className="me-2" onToggle={(isOpen) => { if (isOpen) marcarComoLeidas(); }}>
              <Dropdown.Toggle variant="link" className="p-2 text-dark position-relative text-decoration-none border-0 shadow-none">
                <i className="bi bi-bell fs-5"></i>
                {noLeidas > 0 && (
                  <Badge bg="danger" className="position-absolute top-0 start-50 translate-middle rounded-pill" style={{ fontSize: '0.6rem', padding: '0.3em 0.5em' }}>
                    {noLeidas}
                  </Badge>
                )}
              </Dropdown.Toggle>
              <Dropdown.Menu className="shadow-lg border-0 rounded-lg mt-2 notification-dropdown" style={{ maxHeight: '480px', overflowY: 'auto' }}>
                <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light sticky-top">
                  <h6 className="mb-0 fw-bold">Notificaciones</h6>
                </div>
                {notificaciones.length === 0 ? (
                  <div className="p-4 text-center text-muted">No hay notificaciones</div>
                ) : (
                  notificaciones.map(noti => (
                    <Dropdown.Item key={noti.id_notificacion} className={`p-3 border-bottom text-wrap ${!noti.leido ? 'bg-light' : ''}`}>
                      <div className="d-flex justify-content-between mb-1">
                        <span className={`fw-bold small ${!noti.leido ? 'text-primary' : ''}`}>{noti.titulo}</span>
                      </div>
                      <p className="mb-0 small text-secondary">{noti.mensaje}</p>
                    </Dropdown.Item>
                  ))
                )}
              </Dropdown.Menu>
            </Dropdown>
          )}

          {!esLogin && role === 'comprador' && (
            <button
              type="button"
              className="btn btn-primary btn-sm rounded-pill px-3 me-2 d-flex align-items-center"
              onClick={() => {
                if (location.pathname === "/catalogo") window.dispatchEvent(new Event("abrirCarrito"));
                else { navigate("/catalogo"); setTimeout(() => window.dispatchEvent(new Event("abrirCarrito")), 300); }
              }}
            >
              <i className="bi bi-cart2 me-2"></i>
              <span className="d-none d-sm-inline">Carrito</span>
              {carritoCount > 0 && <Badge bg="white" text="dark" className="ms-2 rounded-pill">{carritoCount}</Badge>}
            </button>
          )}
          
          <Navbar.Toggle aria-controls="offcanvasNavbar-expand-md" onClick={manejarToggle} className="border-0 shadow-none custom-toggler d-md-none">
             <i className={`bi ${mostrarMenu ? 'bi-x-lg' : 'bi-list'}`}></i>
          </Navbar.Toggle>
        </div>

        <Navbar.Collapse className="d-none d-md-flex">
          <Nav className="ms-auto align-items-center">
             {!esLogin && !esCatalogo ? (
                <>
                  <Nav.Link onClick={() => manejarNavegacion("/")} className={location.pathname === "/" ? "active fw-bold" : ""}>Inicio</Nav.Link>
                  {role === 'vendedor' && (
                    <>
                      <Nav.Link onClick={() => manejarNavegacion("/productos")} className={location.pathname === "/productos" ? "active fw-bold" : ""}>Productos</Nav.Link>
                      <Nav.Link onClick={() => manejarNavegacion("/tiendas")} className={location.pathname === "/tiendas" ? "active fw-bold" : ""}>Tienda</Nav.Link>
                    </>
                  )}
                  {role === 'comprador' && (
                    <>
                      <Nav.Link onClick={() => manejarNavegacion("/catalogo")} className={location.pathname === "/catalogo" ? "active fw-bold" : ""}>Catálogo</Nav.Link>
                      <Nav.Link onClick={() => manejarNavegacion("/perfil")} className={location.pathname === "/perfil" ? "active fw-bold" : ""}>Perfil</Nav.Link>
                    </>
                  )}
                  <Nav.Link onClick={() => manejarNavegacion("/mensajes")} className={location.pathname === "/mensajes" ? "active fw-bold" : ""}>Mensajes</Nav.Link>
                  <Nav.Link onClick={cerrarSesion} className="text-danger ms-2"><i className="bi bi-box-arrow-right"></i></Nav.Link>
                </>
             ) : (
                <Nav.Link onClick={() => manejarNavegacion("/login")} className="fw-bold"><i className="bi bi-person-circle me-2"></i>Acceso</Nav.Link>
             )}
          </Nav>
        </Navbar.Collapse>

        <Navbar.Offcanvas
          id="offcanvasNavbar-expand-md"
          aria-labelledby="offcanvasNavbarLabel-expand-md"
          placement="end"
          show={mostrarMenu}
          onHide={() => setMostrarMenu(false)}
          className="modern-offcanvas d-md-none"
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title id="offcanvasNavbarLabel-expand-md">InterMarket</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="d-flex flex-column p-0">
            {user && (
                <div className="offcanvas-user-section">
                    <div className="user-avatar-placeholder">{(user.email || "U").charAt(0).toUpperCase()}</div>
                    <div>
                        <div className="fw-bold text-dark small">{user.email || 'Usuario'}</div>
                        <div className="text-muted" style={{fontSize: '0.75rem'}}>Rol: {role || 'Cargando...'}</div>
                    </div>
                </div>
            )}
            <Nav className="flex-column">
              {esLogin ? (
                 <MobileNavLink ruta="/login" icono="person-circle" texto="Iniciar sesión" />
              ) : esCatalogo ? (
                 <MobileNavLink ruta="/catalogo" icono="grid" texto="Ver Catálogo" />
              ) : (
                <>
                  <MobileNavLink ruta="/" icono="house" texto="Inicio" />
                  {role === 'vendedor' && (
                    <>
                      <MobileNavLink ruta="/productos" icono="box-seam" texto="Mis Productos" />
                      <MobileNavLink ruta="/tiendas" icono="shop" texto="Mi Tienda" />
                      <MobileNavLink ruta="/vendedor" icono="graph-up-arrow" texto="Panel de Ventas" />
                    </>
                  )}
                  {role === 'comprador' && (
                    <>
                      <MobileNavLink ruta="/catalogo" icono="search" texto="Explorar Productos" />
                      <MobileNavLink ruta="/perfil" icono="person-badge" texto="Mi Perfil" />
                    </>
                  )}
                  <MobileNavLink ruta="/mensajes" icono="chat-left-dots" texto="Mensajes" />
                  <div className="mt-4">
                      <Nav.Link onClick={cerrarSesion} className="mobile-nav-link mobile-logout">
                        <i className="bi bi-box-arrow-left"></i>
                        <span>Cerrar sesión</span>
                      </Nav.Link>
                  </div>
                </>
              )}
            </Nav>
          </Offcanvas.Body>
        </Navbar.Offcanvas>
      </Container>
    </Navbar>
  );
};

export default Encabezado;
