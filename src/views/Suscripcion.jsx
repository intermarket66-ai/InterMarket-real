import React, { useState } from "react";
import { Container, Row, Button, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../database/supabaseconfig";
import TarjetaPlan from "../components/suscripcion/TarjetaPlan";

const Suscripcion = () => {
  const navigate = useNavigate();
  const { user, role, changeRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Redirigir si ya es vendedor para evitar doble suscripción accidental
  React.useEffect(() => {
    if (role === "vendedor") {
      navigate("/vendedor");
    }
  }, [role, navigate]);

  const planes = [
    {
      id: "plan_bronce",
      nombre: "Plan Bronce",
      precio: 9.99,
      duracion: "Mensual",
      caracteristicas: [
        "Hasta 50 productos",
        "Soporte por email",
        "Estadísticas básicas",
        "Panel de vendedor"
      ],
      color: "#cd7f32"
    },
    {
      id: "plan_plata",
      nombre: "Plan Plata",
      precio: 24.99,
      duracion: "Trimestral",
      caracteristicas: [
        "Hasta 200 productos",
        "Soporte prioritario",
        "Estadísticas avanzadas",
        "Destacados en catálogo"
      ],
      color: "#c0c0c0",
      popular: true
    },
    {
      id: "plan_oro",
      nombre: "Plan Oro",
      precio: 79.99,
      duracion: "Anual",
      caracteristicas: [
        "Productos ilimitados",
        "Soporte 24/7",
        "Asesoría de marketing",
        "Cero comisiones por venta"
      ],
      color: "#ffd700"
    }
  ];

  const handleSuscripcion = async (plan) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Guardar la suscripción en Supabase
      const { error: subError } = await supabase
        .from("suscripciones")
        .insert([
          {
            id_usuario: user.id,
            plan: plan.nombre,
            monto: plan.precio,
            estado: "activo",
            fecha_inicio: new Date().toISOString(),
            fecha_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Ejemplo 30 días
          }
        ]);

      if (subError) {
        // Si la tabla no existe, el usuario probablemente no ha corrido el SQL
        if (subError.code === '42P01') {
            throw new Error("La tabla de suscripciones no existe. Por favor contacta al administrador.");
        }
        throw subError;
      }

      // 2. Actualizar el rol del usuario a 'vendedor' en la tabla usuarios
      const { error: roleError } = await supabase
        .from("usuarios")
        .update({ rol: "vendedor" })
        .eq("id_usuario", user.id);

      if (roleError) throw roleError;

      // 3. Cambiar el rol en el contexto y redirigir
      changeRole("vendedor");
      navigate("/vendedor");
    } catch (err) {
      console.error("Error al procesar suscripción:", err);
      setError(err.message || "Ocurrió un error al procesar tu suscripción.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5 mt-5">
      <div className="text-center mb-5">
        <h1 className="fw-bold display-4 mb-3">Elige tu Plan de Vendedor</h1>
        <p className="text-muted fs-5 mx-auto" style={{ maxWidth: "700px" }}>
          Para comenzar a vender en InterMarket, selecciona el plan que mejor se adapte a las necesidades de tu negocio.
        </p>
      </div>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      <Row className="justify-content-center g-4">
        {planes.map((plan) => (
          <TarjetaPlan 
            key={plan.id} 
            plan={plan} 
            loading={loading} 
            onSelect={handleSuscripcion} 
          />
        ))}
      </Row>

      <div className="text-center mt-5">
        <Button variant="link" className="text-muted" onClick={() => navigate("/seleccion-rol")}>
          <i className="bi bi-arrow-left me-2"></i>
          Volver a selección de rol
        </Button>
      </div>
    </Container>
  );
};

export default Suscripcion;
