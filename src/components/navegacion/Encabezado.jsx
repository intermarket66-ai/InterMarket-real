import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Container, Nav, Navbar, Offcanvas } from "react-bootstrap";
import logo from "../../assets/icono_intermAeview.png";
import { supabase } from "../../database/supabaseconfig";
import "../../App.css";

const Encabezado = () => {
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const [carritoCount, setCarritoCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation(); // Para detectar la ruta actual

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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      localStorage.removeItem("usuario-supabase");
      setMostrarMenu(false);
      navigate("/login");
    } catch (error) {
      console.error("Error cerrando sesión:", error.message);
    }
  };

  // Detectar rutas especiales
  const esLogin = location.pathname === "/login";
  const esCatalogo =
    location.pathname === "/catalogo" &&
    localStorage.getItem("usuario-supabase") === null;

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

          

          <Nav.Link
            onClick={() => manejarNavegacion("/productos")}
            className={mostrarMenu ? "color-texto-marca" : "text-dark"}
          >
            {mostrarMenu ? <i className="bi-bag-heart-fill me-2"></i> : null}
            <strong>Productos</strong>
          </Nav.Link>

          <Nav.Link
            onClick={() => manejarNavegacion("/tiendas")}
            className={mostrarMenu ? "color-texto-marca" : "text-dark"}
          >
            {mostrarMenu ? <i className="bi bi-shop-window me-2"></i> : null}
            <strong>Tiendas</strong>
          </Nav.Link>

          <Nav.Link
            onClick={() => manejarNavegacion("/vendedor")}
            className={mostrarMenu ? "color-texto-marca" : "text-dark"}
          >
            {mostrarMenu ? <i className="bi-cash-coin me-2"></i> : null}
            <strong>Ventas</strong>
          </Nav.Link>

          <Nav.Link
            onClick={() => manejarNavegacion("/mensajes")}
            className={mostrarMenu ? "color-texto-marca" : "text-dark"}
          >
            {mostrarMenu ? <i className="bi bi-chat-dots-fill me-2"></i> : null}
            <strong>Mensajes</strong>
          </Nav.Link>

          {/* Opción para ir al catálogo público desde admin */}
          <Nav.Link
            onClick={() => manejarNavegacion("/catalogo")}
            className={mostrarMenu ? "color-texto-marca" : "text-dark"}
          >
            {mostrarMenu ? <i className="bi-images me-2"></i> : null}
            <strong>Catálogo</strong>
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
              <i className="bi-envelope-fill me-2"></i>
              {localStorage.getItem("usuario-supabase")?.toLowerCase() || "Usuario"}
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

       {/* Botón del Carrito - Modificado */}
{!esLogin && (
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
