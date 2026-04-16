import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Encabezado from "./components/navegacion/Encabezado";

import Inicio from "./views/Inicio";
import Catalogo from "./views/Catalogo";
import Categorias from "./views/Categorias";
import Login from "./views/Login";
import RutaProtegida from "./components/rutas/RutaProtegida";
import Productos from "./views/Productos";
import Pagina404 from "./views/Pagina404";

import "./App.css"


const App = () => {
  return (
    <Router>
      <Encabezado />
      
      <main className="margen-superior-main">
        <Routes>
          <Route path="/login" element={<Login/>} />
          
          <Route path="/" element={<RutaProtegida><Inicio/></RutaProtegida>} />
          <Route path="/categorias" element={<RutaProtegida><Categorias /></RutaProtegida>} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/productos" element={<RutaProtegida><Productos /></RutaProtegida>} />
          
          <Route path="*" element={<Pagina404 />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;

