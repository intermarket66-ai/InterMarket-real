import React, { useState } from 'react';
import { Form, Button, Alert, InputGroup } from 'react-bootstrap';

const FormularioRegistro = ({ correo, contraseña, confirmarContraseña, error, exito, setCorreo, setContraseña, setConfirmarContraseña, registrarUsuario, registrarConGoogle, cargando }) => {
  const [mostrarContraseña, setMostrarContraseña] = useState(false);

  return (
    <Form onSubmit={(e) => { e.preventDefault(); registrarUsuario(); }} className="mt-2">
      {error && <Alert variant="danger" className="border-0 rounded-4 text-center small py-2 mb-3 shadow-sm">{error}</Alert>}
      {exito && <Alert variant="success" className="border-0 rounded-4 text-center small py-2 mb-3 shadow-sm">{exito}</Alert>}
      
      <Form.Group className="mb-3">
        <InputGroup className="unique-input-group">
          <InputGroup.Text>
            <i className="bi bi-envelope"></i>
          </InputGroup.Text>
          <Form.Control
            type="email"
            placeholder="Correo electrónico"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
        </InputGroup>
      </Form.Group>

      <Form.Group className="mb-3">
        <InputGroup className="unique-input-group">
          <InputGroup.Text>
            <i className="bi bi-shield-lock-fill"></i>
          </InputGroup.Text>
          <Form.Control
            type={mostrarContraseña ? 'text' : 'password'}
            placeholder="Contraseña (mín. 6 caracteres)"
            value={contraseña}
            onChange={(e) => setContraseña(e.target.value)}
            required
            minLength={6}
          />
          <InputGroup.Text 
            onClick={() => setMostrarContraseña(!mostrarContraseña)} 
            style={{cursor: 'pointer'}}
          >
            <i className={`bi ${mostrarContraseña ? 'bi-eye-slash' : 'bi-eye'}`}></i>
          </InputGroup.Text>
        </InputGroup>
      </Form.Group>

      <Form.Group className="mb-4">
        <InputGroup className="unique-input-group">
          <InputGroup.Text>
            <i className="bi bi-shield-check"></i>
          </InputGroup.Text>
          <Form.Control
            type={mostrarContraseña ? 'text' : 'password'}
            placeholder="Confirmar contraseña"
            value={confirmarContraseña}
            onChange={(e) => setConfirmarContraseña(e.target.value)}
            required
            minLength={6}
          />
        </InputGroup>
      </Form.Group>

      <Button type="submit" className="unique-login-btn w-100 shadow mb-3" disabled={cargando}>
        {cargando ? (
          <><span className="spinner-border spinner-border-sm me-2"></span> Registrando...</>
        ) : 'Crear Cuenta'}
      </Button>

      <div className="d-flex align-items-center mb-3">
        <hr className="flex-grow-1 text-muted" />
        <span className="px-3 text-muted small">o</span>
        <hr className="flex-grow-1 text-muted" />
      </div>

      <Button 
        type="button" 
        variant="outline-dark" 
        className="w-100 shadow-sm d-flex justify-content-center align-items-center mb-2" 
        onClick={registrarConGoogle}
        disabled={cargando}
      >
        <i className="bi bi-google me-2 text-danger"></i> Registrarse con Google
      </Button>
    </Form>
  );
};

export default FormularioRegistro;
