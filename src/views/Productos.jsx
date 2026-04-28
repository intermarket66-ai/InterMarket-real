import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Spinner } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";
import NotificacionOperacion from '../components/NotificacionOperacion';
import ModalRegistroProducto from '../components/productos/ModalRegistroProducto';
import ModalEdicionProducto from '../components/productos/ModalEdicionProducto';
import ModalEliminacionProducto from '../components/productos/ModalEliminacionProducto';
import TarjetasProductos from '../components/productos/TarjetasProductos';

const Productos = () => {
  // Variables de estado
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModalRegistro, setMostrarModalRegistro] = useState(false);
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
  const [mostrarModalEliminacion, setMostrarModalEliminacion] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [productoEditar, setProductoEditar] = useState(null);
  const [toast, setToast] = useState({ mostrar: false, mensaje: '', tipo: '' });
  const [vistaTabla, setVistaTabla] = useState(false);

  const [nuevoProducto, setNuevoProducto] = useState({
    nombre_producto: '',
    descripcion: '',
    precio_venta: '',
    precio_compra: '',
    categoria_id: '',
    imagenes: '',
    estado: 'activo'
  });

  // Cargar productos desde Supabase
  const cargarProductos = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from("productos")
        .select(`
          *,
          categorias (
            nombre_categoria
          )
        `)
        .order("id", { ascending: true });

      if (error) {
        console.error("Error al cargar productos:", error.message);
        setToast({
          mostrar: true,
          mensaje: "Error al cargar productos.",
          tipo: "error",
        });
        return;
      }
      setProductos(data || []);
    } catch (err) {
      console.error("Excepción al cargar productos:", err.message);
      setToast({
        mostrar: true,
        mensaje: "Error inesperado al cargar productos.",
        tipo: "error",
      });
    } finally {
      setCargando(false);
    }
  };

  // Cargar categorías para el dropdown
  const cargarCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .order("nombre_categoria", { ascending: true });

      if (error) {
        console.error("Error al cargar categorías:", error.message);
        return;
      }
      setCategorias(data || []);
    } catch (err) {
      console.error("Excepción al cargar categorías:", err.message);
    }
  };

  // Agregar producto
  const agregarProducto = async () => {
    try {
      if (
        !nuevoProducto.nombre_producto.trim() ||
        !nuevoProducto.descripcion.trim() ||
        !nuevoProducto.precio_venta ||
        !nuevoProducto.precio_compra ||
        !nuevoProducto.categoria_id
      ) {
        setToast({
          mostrar: true,
          mensaje: "Debe llenar todos los campos obligatorios.",
          tipo: "advertencia",
        });
        return;
      }

      const productoData = {
        nombre_producto: nuevoProducto.nombre_producto,
        descripcion: nuevoProducto.descripcion,
        precio_venta: parseFloat(nuevoProducto.precio_venta),
        precio_compra: parseFloat(nuevoProducto.precio_compra),
        categoria_id: parseInt(nuevoProducto.categoria_id),
        imagenes: nuevoProducto.imagenes || null,
        estado: nuevoProducto.estado || 'activo'
      };

      const { error } = await supabase.from("productos").insert([productoData]);

      if (error) {
        console.error("Error al agregar producto:", error.message);
        setToast({
          mostrar: true,
          mensaje: "Error al registrar producto.",
          tipo: "error",
        });
        return;
      }

      // Éxito
      setToast({
        mostrar: true,
        mensaje: `Producto "${nuevoProducto.nombre_producto}" registrado exitosamente.`,
        tipo: "exito",
      });

      // Limpiar formulario y cerrar modal
      setNuevoProducto({
        nombre_producto: '',
        descripcion: '',
        precio_venta: '',
        precio_compra: '',
        categoria_id: '',
        imagenes: '',
        estado: 'activo'
      });
      setMostrarModalRegistro(false);
      cargarProductos();

    } catch (err) {
      console.error("Excepción al agregar producto:", err.message);
      setToast({
        mostrar: true,
        mensaje: "Error inesperado al registrar producto.",
        tipo: "error",
      });
    }
  };

  // Editar producto
  const editarProducto = async () => {
    try {
      if (
        !productoEditar.nombre_producto.trim() ||
        !productoEditar.descripcion.trim() ||
        !productoEditar.precio_venta ||
        !productoEditar.precio_compra ||
        !productoEditar.categoria_id
      ) {
        setToast({
          mostrar: true,
          mensaje: "Debe llenar todos los campos obligatorios.",
          tipo: "advertencia",
        });
        return;
      }

      const productoData = {
        nombre_producto: productoEditar.nombre_producto,
        descripcion: productoEditar.descripcion,
        precio_venta: parseFloat(productoEditar.precio_venta),
        precio_compra: parseFloat(productoEditar.precio_compra),
        categoria_id: parseInt(productoEditar.categoria_id),
        imagenes: productoEditar.imagenes || null,
        estado: productoEditar.estado
      };

      const { error } = await supabase
        .from("productos")
        .update(productoData)
        .eq("id", productoEditar.id);

      if (error) {
        console.error("Error al editar producto:", error.message);
        setToast({
          mostrar: true,
          mensaje: "Error al actualizar producto.",
          tipo: "error",
        });
        return;
      }

      // Éxito
      setToast({
        mostrar: true,
        mensaje: `Producto "${productoEditar.nombre_producto}" actualizado exitosamente.`,
        tipo: "exito",
      });

      setMostrarModalEdicion(false);
      setProductoEditar(null);
      cargarProductos();

    } catch (err) {
      console.error("Excepción al editar producto:", err.message);
      setToast({
        mostrar: true,
        mensaje: "Error inesperado al actualizar producto.",
        tipo: "error",
      });
    }
  };

  // Eliminar producto
  const eliminarProducto = async () => {
    try {
      const { error } = await supabase
        .from("productos")
        .delete()
        .eq("id", productoAEliminar.id);

      if (error) {
        console.error("Error al eliminar producto:", error.message);
        setToast({
          mostrar: true,
          mensaje: "Error al eliminar producto.",
          tipo: "error",
        });
        return;
      }

      // Éxito
      setToast({
        mostrar: true,
        mensaje: `Producto "${productoAEliminar.nombre_producto}" eliminado exitosamente.`,
        tipo: "exito",
      });

      setMostrarModalEliminacion(false);
      setProductoAEliminar(null);
      cargarProductos();

    } catch (err) {
      console.error("Excepción al eliminar producto:", err.message);
      setToast({
        mostrar: true,
        mensaje: "Error inesperado al eliminar producto.",
        tipo: "error",
      });
    }
  };

  // Métodos para control de apertura de modales
  const abrirModalEdicion = (producto) => {
    setProductoEditar({
      id: producto.id,
      nombre_producto: producto.nombre_producto,
      descripcion: producto.descripcion,
      precio_venta: producto.precio_venta ?? '',
      precio_compra: producto.precio_compra ?? '',
      categoria_id: producto.categoria_id ?? '',
      imagenes: producto.imagenes || '',
      estado: producto.estado || 'activo'
    });
    setMostrarModalEdicion(true);
  };

  const abrirModalEliminacion = (producto) => {
    setProductoAEliminar(producto);
    setMostrarModalEliminacion(true);
  };

  // Manejo de cambios en inputs
  const manejoCambioInput = (e) => {
    const { name, value } = e.target;
    setNuevoProducto(prev => ({ ...prev, [name]: value }));
  };

  const manejoCambioEdicion = (e) => {
    const { name, value } = e.target;
    setProductoEditar(prev => ({ ...prev, [name]: value }));
  };

  // Cargar datos al iniciar
  useEffect(() => {
    cargarProductos();
    cargarCategorias();
  }, []);

  return (
    <Container>
      <br />

      {/* Título y botón Nuevo Producto */}
      <Row className="align-items-center mb-3">
        <Col xs={9} sm={7} md={7} lg={7} className="d-flex align-items-center">
          <h3 className="mb-0">
            <i className="bi-box-seam me-2"></i> Productos
          </h3>
        </Col>
        <Col xs={3} sm={5} md={5} lg={5} className="text-end">
          <Button
            onClick={() => setMostrarModalRegistro(true)}
            size="md"
          >
            <i className="bi-plus-lg"></i>
            <span className="d-none d-sm-inline ms-2">Nuevo Producto</span>
          </Button>
        </Col>
      </Row>

      {/* Botones de vista */}
      <Row className="mb-3">
        <Col>
          <Button
            variant={!vistaTabla ? "primary" : "outline-primary"}
            size="sm"
            className="me-2"
            onClick={() => setVistaTabla(false)}
          >
            <i className="bi-grid"></i> Tarjetas
          </Button>
          <Button
            variant={vistaTabla ? "primary" : "outline-primary"}
            size="sm"
            onClick={() => setVistaTabla(true)}
          >
            <i className="bi-table"></i> Tabla
          </Button>
        </Col>
      </Row>

      <hr />

      {/* Modales */}
      <ModalRegistroProducto
        mostrarModal={mostrarModalRegistro}
        setMostrarModal={setMostrarModalRegistro}
        nuevoProducto={nuevoProducto}
        manejoCambioInput={manejoCambioInput}
        agregarProducto={agregarProducto}
        categorias={categorias}
      />

      <ModalEdicionProducto
        mostrarModal={mostrarModalEdicion}
        setMostrarModal={setMostrarModalEdicion}
        productoEditar={productoEditar}
        manejoCambioEdicion={manejoCambioEdicion}
        editarProducto={editarProducto}
        categorias={categorias}
      />

      <ModalEliminacionProducto
        mostrarModal={mostrarModalEliminacion}
        setMostrarModal={setMostrarModalEliminacion}
        productoAEliminar={productoAEliminar}
        eliminarProducto={eliminarProducto}
      />

      {/* Notificación */}
      <NotificacionOperacion
        mostrar={toast.mostrar}
        mensaje={toast.mensaje}
        tipo={toast.tipo}
        onCerrar={() => setToast({ ...toast, mostrar: false })}
      />

      {/* Loading */}
      {cargando && (
        <Row className="text-center my-5">
          <Col>
            <Spinner animation="border" variant="success" size="lg" />
            <p className="mt-3 text-muted">Cargando productos...</p>
          </Col>
        </Row>
      )}

      {/* Lista de productos */}
      {!cargando && productos.length > 0 && !vistaTabla && (
        <TarjetasProductos
          productos={productos}
          abrirModalEdicion={abrirModalEdicion}
          abrirModalEliminacion={abrirModalEliminacion}
        />
      )}

      {/* Tabla de productos */}
      {!cargando && productos.length > 0 && vistaTabla && (
        <Row>
          <Col>
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead className="table-dark">
                  <tr>
                    
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Categoría</th>
                    <th>Precio Venta</th>
                    <th>Precio Compra</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((producto) => (
                    <tr key={producto.id}>
                      
                      <td>{producto.nombre_producto}</td>
                      <td>{producto.descripcion}</td>
                      <td>{producto.categorias?.nombre_categoria || 'Sin categoría'}</td>
                      <td>${producto.precio_venta}</td>
                      <td>${producto.precio_compra}</td>
                      <td>
                        <span className={`badge ${producto.estado === 'activo' ? 'bg-success' : 'bg-danger'}`}>
                          {producto.estado}
                        </span>
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => abrirModalEdicion(producto)}
                        >
                          <i className="bi-pencil"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => abrirModalEliminacion(producto)}
                        >
                          <i className="bi-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Col>
        </Row>
      )}

      {/* Mensaje cuando no hay productos */}
      {!cargando && productos.length === 0 && (
        <Row className="text-center my-5">
          <Col>
            <p className="text-muted">No hay productos registrados.</p>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default Productos;
