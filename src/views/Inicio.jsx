import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from 'react-bootstrap';

function Inicio() {
  const { role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!role) {
        navigate('/seleccion-rol');
      } else if (role === 'vendedor') {
        navigate('/vendedor');
      } else {
        navigate('/catalogo');
      }
    }
  }, [role, loading, navigate]);

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <Spinner animation="border" variant="primary" />
    </div>
  );
}

export default Inicio;