import React from 'react';
import { Navigate } from 'react-router-dom';

function RutaProtegida({ children }) {
  const usuarioGuardado = localStorage.getItem("usuario-supabase");
  // Verifica si el usuario está autenticado usando localStorage
const estaLogueado = !!localStorage.getItem("usuario-supabase");

// Log para depuración
console.log("Usuario autenticado:", estaLogueado);
return estaLogueado ? children : <Navigate to="/login" replace />;
}

export default RutaProtegida;
