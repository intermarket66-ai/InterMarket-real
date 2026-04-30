import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Spinner, Button } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";

const Perfil = () => {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerfil = async () => {
      setLoading(true);
      // Obtener usuario autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPerfil(null);
        setLoading(false);
        return;
      }
      // Buscar perfil por id_usuario
      const { data: perfilData } = await supabase
        .from("perfiles")
        .select("*")
        .eq("id_usuario", user.id)
        .single();
      setPerfil(perfilData);
      setLoading(false);
    };
    fetchPerfil();
  }, []);

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
        <div>Cargando perfil...</div>
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
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow-sm">
            <Card.Body>
              <div className="text-center mb-3">
                <img
                  src={perfil.foto_perfil || "https://ui-avatars.com/api/?name=User"}
                  alt="Foto de perfil"
                  className="rounded-circle mb-2"
                  style={{ width: 100, height: 100, objectFit: "cover" }}
                />
                <h4 className="mt-2">{perfil.nombre || "Usuario"}</h4>
                <div className="text-muted small mb-2">{perfil.email || "Sin email"}</div>
              </div>
              <div>
                <strong>Rol:</strong> {perfil.rol || "No especificado"}
              </div>
              <div>
                <strong>Creado en:</strong> {perfil.creado_en ? new Date(perfil.creado_en).toLocaleString() : "-"}
              </div>
              <div className="mt-3 text-center">
                <Button variant="primary">Editar perfil</Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Perfil;
