import React, {useState, useEffect} from 'react'
import { useNavigate } from 'react-router-dom';
import FormularioLogin from '../components/login/FormularioLogin';
import {supabase} from "../database/supabaseconfig";
import "../App.css"

function Login() {
  const [usuario, setUsuario] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [error, setError] = useState(null);
  const navegar = useNavigate();

const iniciarSesion = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: usuario,
      password: contraseña,
    });

    if (error) {
      setError("Credenciales incorrectas. Inténtalo de nuevo.");
   return;
    }
    if (data.user) {
      localStorage.setItem("usuario-supabase", usuario);
      navegar("/");
    }
  } catch (err) {
    setError("Ocurrió un error al iniciar sesión. Inténtalo de nuevo.");
    console.error("Error en la solicitud:", err);
  }
};
useEffect(() => { 
  const usuarioGuardado = localStorage.getItem("usuario-supabase");
  if (usuarioGuardado) {
    navegar("/");
  }
}, [navegar]);

  const estiloContenedor = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "rgba(255, 255, 255, 0.5)",
    padding: "20px",
    overflow: "hidden",
  };

  return (
    <div style={estiloContenedor}>
      <FormularioLogin
        usuario={usuario}
        contraseña={contraseña}
        error={error}
        setUsuario={setUsuario}
        setContraseña={setContraseña}
        iniciarSesion={iniciarSesion}
      />
      
    </div>
  )
}



export default Login
