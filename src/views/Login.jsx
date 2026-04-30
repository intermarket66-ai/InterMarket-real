import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Row, Col } from 'react-bootstrap';
import FormularioLogin from '../components/login/FormularioLogin';
import { supabase } from "../database/supabaseconfig";
import logo from "../assets/icono_intermAeview.png"; // Tu logo actualizado
import "../App.css";

function Login() {
  const [usuario, setUsuario] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const navegar = useNavigate();

  const iniciarSesion = async () => {
    try {
      setCargando(true);
      setError(null);
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: usuario,
        password: contraseña,
      });

      if (authError) {
        setError("Credenciales incorrectas. Verifica tus datos.");
        return;
      }
      if (data.user) {
        localStorage.setItem("usuario-supabase", usuario);
        navegar("/");
      }
    } catch (err) {
      setError("Error de conexión con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { 
    if (localStorage.getItem("usuario-supabase")) navegar("/");
  }, [navegar]);

  return (
    <div className="login-page-bg">
      <Container>
        <Row className="justify-content-center">
          <Col xs={11} sm={9} md={7} lg={5} xl={4}>
            <Card className="login-card-unique border-0">
              <Card.Body className="p-4 p-md-5">
                <div className="text-center mb-4">
                  <img src={logo} alt="InterMarket" className="img-figma-style mb-4" />
                  <h1 className="login-header-title">InterMarket</h1>
                  <p className="login-header-subtitle">Gestión de Inventario y Ventas</p>
                </div>
                
                <FormularioLogin
                  usuario={usuario}
                  contraseña={contraseña}
                  error={error}
                  setUsuario={setUsuario}
                  setContraseña={setContraseña}
                  iniciarSesion={iniciarSesion}
                  cargando={cargando}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Login;