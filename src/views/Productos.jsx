import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Spinner, Alert } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";
import NotificacionOperacion from '../components/NotificacionOperacion';
import ModalRegistroProducto from '../components/productos/ModalRegistroProducto';
import ModalEdicionProducto from '../components/productos/ModalEdicionProducto';
import ModalEliminacionProducto from '../components/productos/ModalEliminacionProducto';
import ModalDescuentoProducto from '../components/productos/ModalDescuentoProducto';
import TarjetasProductos from '../components/productos/TarjetasProductos';
import TablaProductos from '../components/productos/TablaProductos';  
import CuadroBusquedas from "../components/busquedas/CuadroBusquedas";
import Paginacion from "../components/ordenamiento/Paginacion";
import { useAuth } from '../context/AuthContext';

const Productos = () => {
    const { user } = useAuth();
    // --- ESTADOS DE DATOS ---
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [productosFiltrados, setProductosFiltrados] = useState([]);
    const [idTienda, setIdTienda] = useState(null);
    
    // --- ESTADOS DE MODALES Y UI ---
    const [mostrarModalRegistro, setMostrarModalRegistro] = useState(false);
    const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
    const [mostrarModalEliminacion, setMostrarModalEliminacion] = useState(false);
    const [mostrarModalDescuento, setMostrarModalDescuento] = useState(false);
    const [productoAEliminar, setProductoAEliminar] = useState(null);
    const [productoSeleccionadoDescuento, setProductoSeleccionadoDescuento] = useState(null);
    const [productoEditar, setProductoEditar] = useState(null);
    const [toast, setToast] = useState({ mostrar: false, mensaje: '', tipo: '' });
    
    // --- ESTADOS DE BÚSQUEDA Y PAGINACIÓN ---
    const [textoBusqueda, setTextoBusqueda] = useState("");
    const [registrosPorPagina, establecerRegistrosPorPagina] = useState(5);
    const [paginaActual, establecerPaginaActual] = useState(1);

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
            if (!user) return;
            
            // Buscar tienda del perfil
            const { data: perfilData } = await supabase.from('perfiles').select('id_tienda').eq('id_usuario', user.id).maybeSingle();
            const id_tienda_vendedor = perfilData?.id_tienda;
            setIdTienda(id_tienda_vendedor);

            if (!id_tienda_vendedor) {
                setProductos([]);
                setCargando(false);
                return;
            }

            const { data, error } = await supabase
                .from("productos")
                .select(`*, categorias (nombre_categoria)`)
                .eq("id_tienda", id_tienda_vendedor)
                .order("creado_en", { ascending: false });

            if (error) throw error;
            setProductos(data || []);
        } catch (err) {
            console.error("Error:", err.message);
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
            console.error("Error categorías:", err.message);
        }
    };

    // ================== FILTRADO Y PAGINACIÓN (Lógica Categorías) ==================
    useEffect(() => {
        if (!textoBusqueda.trim()) {
            setProductosFiltrados(productos);
        } else {
            const busqueda = textoBusqueda.toLowerCase().trim();
            const filtrados = productos.filter((p) => {
                const nombreStr = p.nombre_producto ? String(p.nombre_producto).toLowerCase() : "";
                const catStr = p.categorias?.nombre_categoria ? String(p.categorias.nombre_categoria).toLowerCase() : "";
                return nombreStr.includes(busqueda) || catStr.includes(busqueda);
            });
            setProductosFiltrados(filtrados);
        }
    }, [textoBusqueda, productos]);

    useEffect(() => {
        establecerPaginaActual(1);
    }, [textoBusqueda]);

    const productosPaginados = productosFiltrados.slice(
        (paginaActual - 1) * registrosPorPagina,
        paginaActual * registrosPorPagina
    );

    // ================== MANEJADORES CRUD ==================
    const manejarCambioBusqueda = (e) => setTextoBusqueda(e.target.value);

    const manejoCambioInput = (e) => {
        const { name, value } = e.target;
        setNuevoProducto((prev) => ({ ...prev, [name]: value }));
    };

    const manejoCambioInputEdicion = (e) => {
        const { name, value } = e.target;
        setProductoEditar((prev) => ({ ...prev, [name]: value }));
    };

    const parsearNumero = (valor) => Number.parseFloat(String(valor).replace(",", "."));

    // Ya no usamos Base64, subiremos directamente el archivo a Supabase Storage
    const subirImagenASupabase = async (archivo, bucketName) => {
        try {
            const fileExt = archivo.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;
            
            const { error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, archivo);
            if (uploadError) throw uploadError;
            
            const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
            return data.publicUrl;
        } catch (error) {
            console.error("Error subiendo imagen:", error);
            throw new Error("No se pudo subir la imagen al servidor.");
        }
    };

    const manejoCambioArchivo = (e) => {
        const archivos = Array.from(e.target.files || []);
        if (archivos.length === 0) return;
        setNuevoProducto((prev) => ({ ...prev, archivos_imagen: archivos }));
    };

    const manejoCambioArchivoActualizar = (e) => {
        const archivos = Array.from(e.target.files || []);
        if (archivos.length === 0) return;
        setProductoEditar((prev) => ({ ...prev, archivos_imagen: archivos }));
    };

    const abrirModalEdicion = (producto) => {
        setProductoEditar({
            ...producto,
            url_imagenes: Array.isArray(producto.imagen_url) ? producto.imagen_url : (producto.imagen_url ? [producto.imagen_url] : []),
            archivos_imagen: null,
            id_estado: producto.id_estado?.toString() || '2'
        });
        setMostrarModalEdicion(true);
    };

    const abrirModalEliminacion = (producto) => {
        setProductoAEliminar(producto);
        setMostrarModalEliminacion(true);
    };

    const abrirModalDescuento = (producto) => {
        setProductoSeleccionadoDescuento(producto);
        setMostrarModalDescuento(true);
    };

    const aplicarDescuento = async (producto, nuevoPrecio) => {
        try {
            const precioActual = Number(producto.precio_venta || 0);
            const precioCompra = Number(producto.precio_compra || 0);

            if (nuevoPrecio >= precioActual) {
                setToast({
                    mostrar: true,
                    mensaje: "El nuevo precio debe ser menor al precio actual.",
                    tipo: "advertencia"
                });
                return false;
            }

            if (nuevoPrecio < precioCompra) {
                setToast({
                    mostrar: true,
                    mensaje: `El precio con descuento no puede ser menor al precio de compra ($${precioCompra.toFixed(2)}).`,
                    tipo: "advertencia"
                });
                return false;
            }

            const precioFinal = Math.round(nuevoPrecio * 100) / 100;
            const precioOriginalExistente = Number(producto.precio_original || 0);
            const precioParaGuardar = precioOriginalExistente > 0 ? precioOriginalExistente : precioActual;

            // 1. Enviar el cambio a Supabase
            const { error } = await supabase
                .from("productos")
                .update({ 
                    precio_venta: precioFinal, 
                    precio_original: precioParaGuardar
                })
                .eq("id_producto", producto.id_producto);

            if (error) {
                console.error("Error al aplicar descuento en BD:", error);
                throw error;
            }

            // 2. Actualizar el estado local
            setProductos((prev) =>
                prev.map((item) =>
                    item.id_producto === producto.id_producto
                        ? {
                            ...item,
                            precio_venta: precioFinal,
                            precio_original: precioParaGuardar
                        }
                        : item
                )
            );

            setToast({
                mostrar: true,
                mensaje: `Descuento aplicado con éxito. Nuevo precio: $${precioFinal.toFixed(2)}`,
                tipo: "exito"
            });
            return true;
        } catch (err) {
            console.error("Error al aplicar descuento:", err.message);
            setToast({ mostrar: true, mensaje: "Error al aplicar descuento.", tipo: "error" });
            return false;
        }
    };

    const agregarProducto = async () => {
        try {
            if (
                !nuevoProducto.nombre_producto.trim() ||
                !nuevoProducto.categoria_id ||
                !nuevoProducto.precio_compra ||
                !nuevoProducto.precio_venta
            ) {
                setToast({ mostrar: true, mensaje: "Debe llenar todos los campos obligatorios.", tipo: "advertencia" });
                return;
            }

            const precioCompra = parsearNumero(nuevoProducto.precio_compra);
            const precioVenta = parsearNumero(nuevoProducto.precio_venta);
            const categoriaId = Number.parseInt(nuevoProducto.categoria_id, 10);
            const idEstado = Number.parseInt(nuevoProducto.id_estado || "2", 10);

            if (!Number.isFinite(precioCompra) || !Number.isFinite(precioVenta) || !Number.isInteger(categoriaId)) {
                setToast({ mostrar: true, mensaje: "Precio o categoría inválidos. Verifica los datos.", tipo: "advertencia" });
                return;
            }

            setCargando(true);

            let urlsPublicas = [];
            if (nuevoProducto.archivos_imagen && nuevoProducto.archivos_imagen.length > 0) {
                // Subir cada archivo secuencialmente (o en paralelo con Promise.all)
                for (const archivo of nuevoProducto.archivos_imagen) {
                    const url = await subirImagenASupabase(archivo, 'productos');
                    urlsPublicas.push(url);
                }
            }

            const payload = {
                nombre_producto: nuevoProducto.nombre_producto.trim(),
                descripcion: nuevoProducto.descripcion?.trim() || "",
                precio_venta: precioVenta,
                precio_compra: precioCompra,
                categoria_id: categoriaId,
                id_estado: Number.isInteger(idEstado) ? idEstado : 2,
                imagen_url: urlsPublicas.length > 0 ? urlsPublicas : null,
                id_tienda: idTienda
            };

            const { error } = await supabase.from("productos").insert([payload]);
            if (error) throw error;

            await cargarProductos();
            setMostrarModalRegistro(false);
            setNuevoProducto({
                nombre_producto: "",
                descripcion: "",
                precio_venta: "",
                precio_compra: "",
                categoria_id: "",
                url_imagenes: "",
                archivo_imagen: null,
                id_estado: "2"
            });
            setToast({ mostrar: true, mensaje: "Producto registrado exitosamente.", tipo: "exito" });
        } catch (err) {
            console.error("Error al registrar producto:", err.message);
            setToast({ mostrar: true, mensaje: `Error al registrar producto: ${err.message}`, tipo: "error" });
        } finally {
            setCargando(false);
        }
    };

    const actualizarProducto = async () => {
        if (!productoEditar) return;
        try {
            if (
                !productoEditar.nombre_producto?.trim() ||
                !productoEditar.categoria_id ||
                !productoEditar.precio_compra ||
                !productoEditar.precio_venta
            ) {
                setToast({ mostrar: true, mensaje: "Debe llenar todos los campos obligatorios.", tipo: "advertencia" });
                return;
            }

            setCargando(true);

            let urlsPublicas = productoEditar.url_imagenes || []; 
            if (productoEditar.archivos_imagen && productoEditar.archivos_imagen.length > 0) {
                urlsPublicas = []; // Opción A: Reemplazar por completo
                for (const archivo of productoEditar.archivos_imagen) {
                    const url = await subirImagenASupabase(archivo, 'productos');
                    urlsPublicas.push(url);
                }
            }

            const payload = {
                nombre_producto: productoEditar.nombre_producto.trim(),
                descripcion: productoEditar.descripcion?.trim() || "",
                precio_venta: Number(productoEditar.precio_venta),
                precio_compra: Number(productoEditar.precio_compra),
                categoria_id: Number(productoEditar.categoria_id),
                id_estado: Number(productoEditar.id_estado || 2),
                imagen_url: urlsPublicas.length > 0 ? urlsPublicas : null
            };

            const { error } = await supabase
                .from("productos")
                .update(payload)
                .eq("id_producto", productoEditar.id_producto);

            if (error) throw error;

            await cargarProductos();
            setMostrarModalEdicion(false);
            setToast({ mostrar: true, mensaje: "Producto actualizado exitosamente.", tipo: "exito" });
        } catch (err) {
            console.error("Error al actualizar producto:", err.message);
            setToast({ mostrar: true, mensaje: "Error al actualizar producto.", tipo: "error" });
        } finally {
            setCargando(false);
        }
    };

    const eliminarProducto = async () => {
        if (!productoAEliminar) return;
        try {
            const { error } = await supabase
                .from("productos")
                .delete()
                .eq("id_producto", productoAEliminar.id_producto);

            if (error) throw error;

            await cargarProductos();
            setMostrarModalEliminacion(false);
            setToast({ mostrar: true, mensaje: "Producto eliminado exitosamente.", tipo: "exito" });
        } catch (err) {
            console.error("Error al eliminar producto:", err.message);
            setToast({ mostrar: true, mensaje: "Error al eliminar producto.", tipo: "error" });
        }
    };

    useEffect(() => {
        cargarProductos();
        cargarCategorias();
    }, []);

    return (
        <Container>
            <br />
             <br />
              <br />
               <br />
            <Row className="align-items-center mb-3">
                <Col xs={9}>
                    <h3><i className="bi bi-box-seam me-2"></i> Productos</h3>
                </Col>
                <Col xs={3} className="text-end">
                    <Button 
                        onClick={() => setMostrarModalRegistro(true)}
                        disabled={!idTienda}
                        title={!idTienda ? "Debes crear una tienda primero" : ""}
                    >
                        <i className="bi bi-plus-lg"></i> <span className="d-none d-sm-inline">Nuevo</span>
                    </Button>
                </Col>
            </Row>
            <hr />

            {!idTienda && (
                <Alert variant="danger" className="text-center mt-4">
                    <h5><i className="bi bi-exclamation-triangle-fill me-2"></i> ¡Atención!</h5>
                    <p className="mb-0">
                        Para poder agregar productos, primero debes registrar o tener vinculada una <strong>Tienda</strong>. 
                        Ve a la sección "Mis Tiendas" para crear una.
                    </p>
                </Alert>
            )}

            <CuadroBusquedas 
                textoBusqueda={textoBusqueda} 
                manejarCambioBusqueda={manejarCambioBusqueda} 
            />

            {textoBusqueda.trim() !== '' && productosFiltrados.length === 0 && (
                <Alert variant="warning" className="mt-3">
                    No se encontraron productos que coincidan con la búsqueda.
                </Alert>
            )}

           <br/> 

            {/* MODALES */}
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

            <ModalDescuentoProducto
                mostrarModal={mostrarModalDescuento}
                setMostrarModal={setMostrarModalDescuento}
                productoSeleccionado={productoSeleccionadoDescuento}
                aplicarDescuento={aplicarDescuento}
            />

            <NotificacionOperacion
                mostrar={toast.mostrar}
                mensaje={toast.mensaje}
                tipo={toast.tipo}
                onCerrar={() => setToast({ ...toast, mostrar: false })}
            />

            {cargando ? (
                <div className="text-center my-5">
                    <Spinner animation="border" variant="success" />
                </div>
            ) : (
                <>
                    {/* VISTA RESPONSIVE: LOGICA DE CATEGORIAS */}
                    
                    {/* Vista Móvil (Tarjetas): Se oculta en pantallas grandes (lg) */}
                    <div className="d-lg-none">
                        <TarjetasProductos
                            productos={productosPaginados}
                            abrirModalEdicion={abrirModalEdicion}
                            abrirModalEliminacion={abrirModalEliminacion}
                            abrirModalDescuento={abrirModalDescuento}
                        />
                    </div>

                    {/* Vista Escritorio (Tabla): Solo se muestra en pantallas grandes (lg) */}
                    <div className="d-none d-lg-block">
                        <TablaProductos
                            productos={productosPaginados}
                            abrirModalEdicion={abrirModalEdicion}
                            abrirModalEliminacion={abrirModalEliminacion}
                            abrirModalDescuento={abrirModalDescuento}
                        />
                    </div>

                    {productos.length === 0 && <p className="text-center">No hay productos registrados.</p>}
                </>
            )}

            <Paginacion
                registrosPorPagina={registrosPorPagina}
                totalRegistros={productosFiltrados.length}
                paginaActual={paginaActual}
                establecerPaginaActual={establecerPaginaActual}
                establecerRegistrosPorPagina={establecerRegistrosPorPagina}
            />
        </Container>
    );
};

export default Productos;