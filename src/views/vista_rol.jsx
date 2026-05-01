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
        <p className="rol-tagline">Mercado de Tiendas</p>
        <h1 className="rol-title">Bienvenido a InterMarket</h1>
        <p className="rol-subtitle">
          Selecciona como quieres usar la plataforma en esta sesion.
        </p>

        <div className="rol-grid">
          <button
            type="button"
            className="rol-card"
            onClick={() => handleRoleSelection("comprador")}
          >
            <span className="rol-icon">
              <i className="bi bi-bag-check-fill" />
            </span>
            <h2>Quiero comprar</h2>
            <p>Explora categorias, revisa productos y encuentra ofertas.</p>
          </button>

          <button
            type="button"
            className="rol-card"
            onClick={() => handleRoleSelection("vendedor")}
          >
            <span className="rol-icon">
              <i className="bi bi-shop-window" />
            </span>
            <h2>Quiero vender</h2>
            <p>Publica articulos, administra inventario y gestiona ventas.</p>
          </button>
        </div>

        <button type="button" className="rol-logout" onClick={cerrarSesion}>
          Cerrar sesion
        </button>
      </div>
    </section>
  );
};

export default VistaRol;