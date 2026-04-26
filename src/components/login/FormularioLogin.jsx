import React from "react";
import {Form, Button,Card, Alert} from "react-bootstrap"
import logo from "../../assets/Logo_intermarket.png"

const FormularioLogin =  ({usuario, contraseña, error, setUsuario, setContraseña, iniciarSesion}) =>{
    return (
<Card style = {{minWidth: "320px", maxWidth: "400px", width: "100%" }} className="p-4 shadow-lg">
  <Card.Body>
    <img style={{width: "24rem", marginTop: "-38px", marginLeft: "-40px"  }} src={logo} alt="Logo" />   
    <h3 className=" mb-3">Login</h3>

    {error && <Alert variant="danger">{error}</Alert>}

    <Form>
      <Form.Group className="mb-3" controlId="usuario">
        
        <Form.Control
          type="text"
          placeholder="Usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="contrasena">
      
        <Form.Control
          type="password"
          placeholder="Contraseña"
          value={contraseña}
          onChange={(e) => setContraseña(e.target.value)}
          required
        />
      </Form.Group>

      <Button variant="primary" className="w-100" onClick={iniciarSesion}>
        Iniciar Sesión
      </Button>
    </Form>
  </Card.Body>
</Card>

    )
}


export default FormularioLogin;