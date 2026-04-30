import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

import Encabezado from "./components/navegacion/Encabezado";

import Inicio from "./views/Inicio";
import Catalogo from "./views/Catalogo";
import Categorias from "./views/Categorias";
import Login from "./views/Login";
import RutaProtegida from "./components/rutas/RutaProtegida";
import Productos from "./views/Productos";
import Tiendas from "./views/Tiendas";
import Vendedor from "./views/Vendedor";
import Pagina404 from "./views/Pagina404";
import VistaRol from "./views/vista_rol";
import AdminInicio from "./views/AdminInicio";
import Perfil from "./views/Perfil";
import Mensajes from "./views/Mensajes";

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
          <Route path="/seleccion-rol" element={<RutaProtegida><VistaRol /></RutaProtegida>} />
          
          <Route path="/" element={<RutaProtegida><Inicio/></RutaProtegida>} />
          <Route path="/categorias" element={<RutaProtegida><Categorias /></RutaProtegida>} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/productos" element={<RutaProtegida><Productos /></RutaProtegida>} />
          <Route path="/tiendas" element={<RutaProtegida><Tiendas /></RutaProtegida>} />
          <Route path="/vendedor" element={<RutaProtegida><Vendedor /></RutaProtegida>} />
          <Route path="/admin-inicio" element={<RutaProtegida><AdminInicio /></RutaProtegida>} />
          <Route path="/perfil" element={<RutaProtegida><Perfil /></RutaProtegida>} />
          <Route path="/mensajes" element={<RutaProtegida><Mensajes /></RutaProtegida>} />
          
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

