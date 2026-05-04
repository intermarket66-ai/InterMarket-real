import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Row, Col, Container } from "react-bootstrap";
import "../App.css";

const VistaRol = () => {
  const navigate = useNavigate();
  const { changeRole, signOut } = useAuth();

  const handleRoleSelection = (rol) => {
    changeRole(rol);
    navigate(rol === "vendedor" ? "/vendedor" : "/catalogo");
  };

  const cerrarSesion = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <section className="rol-page-modern-bg">
      <Container className="rol-container-wow">
        <div className="mb-5">
            <h1 className="fw-900 mb-3" style={{ color: 'var(--color-primario)', fontSize: 'clamp(2.5rem, 6vw, 4rem)', letterSpacing: '-2px' }}>
                Tu siguiente paso
            </h1>
            <p className="text-muted fs-5">Elige cómo quieres interactuar con InterMarket hoy.</p>
        </div>

        <Row className="justify-content-center g-4">
          <Col md={6} lg={5}>
            <div
              className="rol-card-wow h-100"
              onClick={() => handleRoleSelection("comprador")}
            >
              <div className="rol-icon-wow">
                <i className="bi bi-cart-check" />
              </div>
              <h2 className="rol-title-card">Comprador</h2>
              <p className="rol-desc-card">
                Explora productos únicos, descubre ofertas exclusivas y gestiona tus pedidos con facilidad.
              </p>
            </div>
          </Col>

          <Col md={6} lg={5}>
            <div
              className="rol-card-wow h-100"
              onClick={() => handleRoleSelection("vendedor")}
            >
              <div className="rol-icon-wow">
                <i className="bi bi-graph-up-arrow" />
              </div>
              <h2 className="rol-title-card">Vendedor</h2>
              <p className="rol-desc-card">
                Haz crecer tu negocio, publica nuevos productos y lleva el control total de tus ventas.
              </p>
            </div>
          </Col>
        </Row>

        <button type="button" className="rol-btn-logout-wow shadow-sm" onClick={cerrarSesion}>
          <i className="bi bi-power me-2"></i>
          Cerrar sesión segura
        </button>
      </Container>
    </section>
  );
};

export default VistaRol;