import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

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
  const mostrarEncabezado = location.pathname !== "/seleccion-rol";

  return (
    <>
      {mostrarEncabezado && <Encabezado />}

      <main className={mostrarEncabezado ? "margen-superior-main" : ""}>
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
          
          {/* Rutas de Administrador (si aplica, asumo que se mantiene por el momento) */}
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

