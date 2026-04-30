import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Spinner } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";
import NotificacionOperacion from '../components/NotificacionOperacion';
import ModalRegistroProducto from '../components/productos/ModalRegistroProducto';
import ModalEdicionProducto from '../components/productos/ModalEdicionProducto';
import ModalEliminacionProducto from '../components/productos/ModalEliminacionProducto';
import TarjetasProductos from '../components/productos/TarjetasProductos';
import TablaProductos from '../components/productos/TablaProductos';  
import CuadroBusquedas from "../components/busquedas/CuadroBusquedas";

const Productos = () => {
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
    
    // Estados para búsqueda
    const [textoBusqueda, setTextoBusqueda] = useState("");
    const [busquedaDebounce, setBusquedaDebounce] = useState("");

    // Estado para nuevo producto
    const [nuevoProducto, setNuevoProducto] = useState({
        nombre_producto: '',
        descripcion: '',
        precio_venta: '',
        precio_compra: '',
        categoria_id: '',
        url_imagenes: '',
        id_estado: '2'
    });

    // ================== CARGAR DATOS ==================
    const cargarProductos = async () => {
        try {
            setCargando(true);
            const { data, error } = await supabase
                .from("productos")
                .select(`
                    *,
                    categorias (nombre_categoria)
                `)
                .order("creado_en", { ascending: false });

            if (error) throw error;
            setProductos(data || []);
        } catch (err) {
            console.error("Error al cargar productos:", err.message);
            setToast({ mostrar: true, mensaje: "Error al cargar productos", tipo: "error" });
        } finally {
            setCargando(false);
        }
    };

    const cargarCategorias = async () => {
        try {
            const { data, error } = await supabase
                .from("categorias")
                .select("*")
                .order("nombre_categoria");
            if (error) throw error;
            setCategorias(data || []);
        } catch (err) {
            console.error("Error al cargar categorías:", err.message);
        }
    };

    // ================== BÚSQUEDA CON DEBOUNCE ==================
    useEffect(() => {
        const timeout = setTimeout(() => {
            setBusquedaDebounce(textoBusqueda);
        }, 300);

        return () => clearTimeout(timeout);
    }, [textoBusqueda]);

    // ================== FILTRADO DE PRODUCTOS ==================
    const productosFiltrados = productos.filter((producto) => {
        const busqueda = busquedaDebounce.toLowerCase().trim();
        
        if (!busqueda) return true; // Si no hay texto, mostrar todos

        return (
            producto.nombre_producto?.toLowerCase().includes(busqueda) ||
            producto.descripcion?.toLowerCase().includes(busqueda) ||
            producto.categorias?.nombre_categoria?.toLowerCase().includes(busqueda) ||
            producto.precio_venta?.toString().includes(busqueda) ||
            producto.precio_compra?.toString().includes(busqueda)
        );
    });

    // ================== MANEJADORES ==================
    const manejarCambioBusqueda = (e) => {
        setTextoBusqueda(e.target.value);
    };

    const convertirArchivoABase64 = (archivo) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(archivo);
        });

    const manejoCambioArchivo = async (e) => {
        const archivo = e.target.files?.[0];
        if (!archivo) return;
        try {
            const base64 = await convertirArchivoABase64(archivo);
            setNuevoProducto(prev => ({ ...prev, url_imagenes: base64 }));
        } catch (err) {
            console.error('Error al leer imagen:', err);
        }
    };

    const manejoCambioArchivoActualizar = async (e) => {
        const archivo = e.target.files?.[0];
        if (!archivo) return;
        try {
            const base64 = await convertirArchivoABase64(archivo);
            setProductoEditar(prev => ({ ...prev, url_imagenes: base64 }));
        } catch (err) {
            console.error('Error al leer imagen:', err);
        }
    };

    const manejoCambioInput = (e) => {
        const { name, value } = e.target;
        setNuevoProducto(prev => ({ ...prev, [name]: value }));
    };

    const manejoCambioInputEdicion = (e) => {
        const { name, value } = e.target;
        setProductoEditar(prev => ({ ...prev, [name]: value }));
    };

    const abrirModalEdicion = (producto) => {
        setProductoEditar({
            id_producto: producto.id_producto,
            nombre_producto: producto.nombre_producto,
            descripcion: producto.descripcion,
            precio_compra: producto.precio_compra,
            precio_venta: producto.precio_venta,
            categoria_id: producto.categoria_id,
            url_imagenes: producto.url_imagenes || '',
            id_estado: producto.id_estado?.toString() || '2'
        });
        setMostrarModalEdicion(true);
    };

    const abrirModalEliminacion = (producto) => {
        setProductoAEliminar(producto);
        setMostrarModalEliminacion(true);
    };

    // ================== CRUD ==================
    const agregarProducto = async () => {
        try {
            if (!nuevoProducto.nombre_producto?.trim() || 
                !nuevoProducto.categoria_id || 
                !nuevoProducto.precio_venta) {
                setToast({ 
                    mostrar: true, 
                    mensaje: "Nombre, Categoría y Precio de Venta son obligatorios", 
                    tipo: "advertencia" 
                });
                return;
            }

            const productoData = {
                nombre_producto: nuevoProducto.nombre_producto.trim(),
                descripcion: nuevoProducto.descripcion?.trim() || null,
                precio_compra: parseFloat(nuevoProducto.precio_compra) || 0,
                precio_venta: parseFloat(nuevoProducto.precio_venta),
                categoria_id: parseInt(nuevoProducto.categoria_id),
                url_imagenes: nuevoProducto.url_imagenes ? [nuevoProducto.url_imagenes] : null,
                id_estado: parseInt(nuevoProducto.id_estado) || 2,
            };

            const { error } = await supabase.from("productos").insert([productoData]);

            if (error) throw error;

            setToast({ 
                mostrar: true, 
                mensaje: `Producto "${nuevoProducto.nombre_producto}" registrado exitosamente`, 
                tipo: "exito" 
            });

            setMostrarModalRegistro(false);
            setNuevoProducto({
                nombre_producto: '', 
                descripcion: '', 
                precio_venta: '', 
                precio_compra: '', 
                categoria_id: '', 
                url_imagenes: '', 
                id_estado: '2'
            });

            cargarProductos();
        } catch (err) {
            console.error(err);
            setToast({ mostrar: true, mensaje: "Error al registrar producto", tipo: "error" });
        }
    };

    const actualizarProducto = async () => {
        try {
            if (!productoEditar?.nombre_producto?.trim() || !productoEditar?.categoria_id) {
                setToast({ mostrar: true, mensaje: "Nombre y Categoría son obligatorios", tipo: "advertencia" });
                return;
            }

            const productoData = {
                nombre_producto: productoEditar.nombre_producto.trim(),
                descripcion: productoEditar.descripcion?.trim() || null,
                precio_compra: parseFloat(productoEditar.precio_compra) || 0,
                precio_venta: parseFloat(productoEditar.precio_venta),
                categoria_id: parseInt(productoEditar.categoria_id),
                url_imagenes: productoEditar.url_imagenes ? [productoEditar.url_imagenes] : null,
                id_estado: parseInt(productoEditar.id_estado) || 2,
            };

            const { error } = await supabase
                .from("productos")
                .update(productoData)
                .eq("id_producto", productoEditar.id_producto);

            if (error) throw error;

            setToast({ 
                mostrar: true, 
                mensaje: `Producto "${productoEditar.nombre_producto}" actualizado exitosamente`, 
                tipo: "exito" 
            });

            setMostrarModalEdicion(false);
            setProductoEditar(null);
            cargarProductos();
        } catch (err) {
            console.error(err);
            setToast({ mostrar: true, mensaje: "Error al actualizar producto", tipo: "error" });
        }
    };

    const eliminarProducto = async () => {
        try {
            const { error } = await supabase
                .from("productos")
                .delete()
                .eq("id_producto", productoAEliminar.id_producto);

            if (error) throw error;

            setToast({ 
                mostrar: true, 
                mensaje: `Producto "${productoAEliminar.nombre_producto}" eliminado exitosamente`, 
                tipo: "exito" 
            });

            setMostrarModalEliminacion(false);
            setProductoAEliminar(null);
            cargarProductos();
        } catch (err) {
            setToast({ mostrar: true, mensaje: "Error al eliminar producto", tipo: "error" });
        }
    };

    // Cargar datos al montar el componente
    useEffect(() => {
        cargarProductos();
        cargarCategorias();
    }, []);

    return (
        <Container>
            <br />
            <Row className="align-items-center mb-3">
                <Col xs={9} sm={7} md={7} lg={7}>
                    <h3><i className="bi bi-box-seam me-2"></i> Productos</h3>
                </Col>
                <Col xs={3} sm={5} md={5} lg={5} className="text-end">
                    <Button onClick={() => setMostrarModalRegistro(true)}>
                        <i className="bi bi-plus-lg"></i> Nuevo Producto
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
                        <i className="bi bi-grid"></i> Tarjetas
                    </Button>
                    <Button
                        variant={vistaTabla ? "primary" : "outline-primary"}
                        size="sm"
                        onClick={() => setVistaTabla(true)}
                    >
                        <i className="bi bi-table"></i> Tabla
                    </Button>
                </Col>
            </Row>

            {/* Cuadro de Búsqueda */}
            <Row className="mb-3">
                <Col>
                    <CuadroBusquedas 
                        textoBusqueda={textoBusqueda} 
                        manejarCambioBusqueda={manejarCambioBusqueda} 
                    />
                </Col>
            </Row>

            <hr />

            {/* Modales */}
            <ModalRegistroProducto
                mostrarModal={mostrarModalRegistro}
                setMostrarModal={setMostrarModalRegistro}
                nuevoProducto={nuevoProducto}
                manejoCambioInput={manejoCambioInput}
                manejoCambioArchivo={manejoCambioArchivo}
                agregarProducto={agregarProducto}
                categorias={categorias}
            />

            <ModalEdicionProducto
                mostrarModalEdicion={mostrarModalEdicion}
                setMostrarModalEdicion={setMostrarModalEdicion}
                productoEditar={productoEditar}
                manejoCambioInputEdicion={manejoCambioInputEdicion}
                manejoCambioArchivoActualizar={manejoCambioArchivoActualizar}
                actualizarProducto={actualizarProducto}
                categorias={categorias}
            />

            <ModalEliminacionProducto
                mostrarModal={mostrarModalEliminacion}
                setMostrarModal={setMostrarModalEliminacion}
                productoAEliminar={productoAEliminar}
                eliminarProducto={eliminarProducto}
            />

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

            {/* Vista Tarjetas */}
            {!cargando && productosFiltrados.length > 0 && !vistaTabla && (
                <TarjetasProductos
                    productos={productosFiltrados}
                    abrirModalEdicion={abrirModalEdicion}
                    abrirModalEliminacion={abrirModalEliminacion}
                />
            )}

            {/* Vista Tabla */}
            {!cargando && productosFiltrados.length > 0 && vistaTabla && (
                <div className="table-responsive">
                    <TablaProductos
                        productos={productosFiltrados}
                        abrirModalEdicion={abrirModalEdicion}
                        abrirModalEliminacion={abrirModalEliminacion}
                    />
                </div>
            )}

            {/* Mensaje: No se encontraron resultados */}
            {!cargando && productosFiltrados.length === 0 && productos.length > 0 && (
                <Row className="text-center my-5">
                    <Col>
                        <p className="text-muted fs-5">
                            No se encontraron productos que coincidan con "<strong>{textoBusqueda}</strong>"
                        </p>
                    </Col>
                </Row>
            )}

            {/* Mensaje: No hay productos registrados */}
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