import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";

import Encabezado from "./components/navegacion/Encabezado";

import Inicio from "./views/Inicio";
import Catalogo from "./views/Catalogo";
import Categorias from "./views/Categorias";
import Login from "./views/Login";
import Registro from "./views/Registro";
import RutaProtegida from "./components/rutas/RutaProtegida";
import Productos from "./views/Productos";
import Tiendas from "./views/Tiendas";
import Vendedor from "./views/Vendedor";
import Pagina404 from "./views/Pagina404";
import VistaRol from "./views/vista_rol";
import AdminInicio from "./views/AdminInicio";
import Perfil from "./views/Perfil";
import Mensajes from "./views/Mensajes";
import CheckoutSuccess from "./views/CheckoutSuccess";
import CheckoutCancel from "./views/CheckoutCancel";

import "./App.css"


const AppLayout = () => {
  const location = useLocation();
  
  // Normalizar path para la comparación (sin slash final y en minúsculas)
  const currentPath = (location.pathname || "").toLowerCase().replace(/\/$/, "");
  
  // No mostrar encabezado en estas rutas específicas
  const rutasSinNavbar = ["/login", "/registro", "/seleccion-rol"];
  const mostrarEncabezado = !rutasSinNavbar.includes(currentPath || "/");

  // Nota: Si currentPath es vacío (ruta raíz), se maneja por separado si es necesario.
  // Pero aquí, si currentPath es "", mostramos el navbar si no está en la lista.
  
  // Re-evaluación simplificada:
  const isAuthPage = currentPath === "/login" || currentPath === "/registro" || currentPath === "/seleccion-rol";
  const shouldShowNavbar = !isAuthPage;

  return (
    <>
      {shouldShowNavbar && <Encabezado />}

      <main className={shouldShowNavbar ? "margen-superior-main" : ""}>
        <Routes>
          <Route path="/login" element={<Login/>} />
          <Route path="/registro" element={<Registro/>} />
          
          {/* Ruta Inicio redirige según el rol */}
          <Route path="/" element={<RutaProtegida><Inicio/></RutaProtegida>} />
          
          {/* Selección de vista/rol */}
          <Route path="/seleccion-rol" element={<RutaProtegida><VistaRol /></RutaProtegida>} />
          
          {/* Rutas compartidas o públicas */}
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/perfil" element={<RutaProtegida><Perfil /></RutaProtegida>} />
          <Route path="/mensajes" element={<RutaProtegida><Mensajes /></RutaProtegida>} />
          
          {/* Rutas de Pago (Stripe) */}
          <Route path="/success" element={<RutaProtegida><CheckoutSuccess /></RutaProtegida>} />
          <Route path="/cancel" element={<RutaProtegida><CheckoutCancel /></RutaProtegida>} />
          
          {/* Rutas de Vendedor */}
          <Route path="/productos" element={<RutaProtegida rolesPermitidos={['vendedor']}><Productos /></RutaProtegida>} />
          <Route path="/tiendas" element={<RutaProtegida rolesPermitidos={['vendedor']}><Tiendas /></RutaProtegida>} />
          <Route path="/vendedor" element={<RutaProtegida rolesPermitidos={['vendedor']}><Vendedor /></RutaProtegida>} />
          
          {/* Rutas de Administrador */}
          <Route path="/admin-inicio" element={<RutaProtegida><AdminInicio /></RutaProtegida>} />
          <Route path="/categorias" element={<RutaProtegida><Categorias /></RutaProtegida>} />
          
          <Route path="*" element={<Pagina404 />} />
        </Routes>
      </main>
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
