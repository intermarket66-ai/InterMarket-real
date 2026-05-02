import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
    <section className="rol-page-bg">
      <div className="rol-wrapper">
        <div className="text-center mb-5">
            <span className="text-uppercase fw-bold text-muted small ls-2 mb-2 d-block">Bienvenido de nuevo</span>
            <h1 className="rol-title">¿Cómo quieres continuar hoy?</h1>
            <p className="rol-subtitle text-center">
              Selecciona tu rol para personalizar tu experiencia en InterMarket.
            </p>
        </div>

        <div className="rol-grid">
          <div
            className="rol-card"
            onClick={() => handleRoleSelection("comprador")}
          >
            <div className="rol-icon">
              <i className="bi bi-bag-heart" />
            </div>
            <h2>Comprador</h2>
            <p>Explora el catálogo, encuentra las mejores ofertas y gestiona tus compras con facilidad.</p>
          </div>

          <div
            className="rol-card"
            onClick={() => handleRoleSelection("vendedor")}
          >
            <div className="rol-icon">
              <i className="bi bi-shop" />
            </div>
            <h2>Vendedor</h2>
            <p>Administra tu inventario, publica nuevos productos y lleva el control total de tus ventas.</p>
          </div>
        </div>

        <div className="text-center">
            <button type="button" className="rol-logout" onClick={cerrarSesion}>
              <i className="bi bi-box-arrow-left me-2"></i>
              Cerrar sesión
            </button>
        </div>
      </div>
    </section>
  );
};

export default VistaRol;