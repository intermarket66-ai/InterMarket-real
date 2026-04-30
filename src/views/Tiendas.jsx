import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Spinner, Alert } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";
import NotificacionOperacion from "../components/NotificacionOperacion";
import ModalRegistroTienda from "../components/tiendas/ModalRegistroTienda";
import ModalEdicionTienda from "../components/tiendas/ModalEdicionTienda";
import ModalEliminacionTienda from "../components/tiendas/ModalEliminacionTienda";
import TablaTiendas from "../components/tiendas/TablaTiendas";
import TarjetasTiendas from "../components/tiendas/TarjetasTiendas";
import CuadroBusquedas from "../components/busquedas/CuadroBusquedas";
import Paginacion from "../components/ordenamiento/Paginacion";

const Tiendas = () => {
    const [tiendas, setTiendas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [tiendasFiltradas, setTiendasFiltradas] = useState([]);

    const [mostrarModalRegistro, setMostrarModalRegistro] = useState(false);
    const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
    const [mostrarModalEliminacion, setMostrarModalEliminacion] = useState(false);
    const [tiendaAEliminar, setTiendaAEliminar] = useState(null);
    const [tiendaEditar, setTiendaEditar] = useState(null);
    const [toast, setToast] = useState({ mostrar: false, mensaje: "", tipo: "" });

    const [textoBusqueda, setTextoBusqueda] = useState("");
    const [registrosPorPagina, establecerRegistrosPorPagina] = useState(5);
    const [paginaActual, establecerPaginaActual] = useState(1);

    const [nuevaTienda, setNuevaTienda] = useState({
        nombre_tienda: "",
        imagen_url: ""
    });

    const convertirArchivoABase64 = (archivo) =>
        new Promise((resolve, reject) => {
            const lector = new FileReader();
            lector.readAsDataURL(archivo);
            lector.onload = () => resolve(lector.result);
            lector.onerror = (error) => reject(error);
        });

    const cargarTiendas = async () => {
        try {
            setCargando(true);
            const { data, error } = await supabase
                .from("tiendas")
                .select("*")
                .order("creado_en", { ascending: false });
            if (error) throw error;
            setTiendas(data || []);
        } catch (err) {
            console.error("Error al cargar tiendas:", err.message);
            setToast({ mostrar: true, mensaje: "Error al cargar tiendas", tipo: "error" });
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarTiendas();
    }, []);

    useEffect(() => {
        if (!textoBusqueda.trim()) {
            setTiendasFiltradas(tiendas);
            return;
        }

        const texto = textoBusqueda.toLowerCase().trim();
        const filtradas = tiendas.filter((tienda) => tienda.nombre_tienda?.toLowerCase().includes(texto));
        setTiendasFiltradas(filtradas);
    }, [textoBusqueda, tiendas]);

    useEffect(() => {
        establecerPaginaActual(1);
    }, [textoBusqueda]);

    const tiendasPaginadas = tiendasFiltradas.slice(
        (paginaActual - 1) * registrosPorPagina,
        paginaActual * registrosPorPagina
    );

    const manejarCambioBusqueda = (e) => setTextoBusqueda(e.target.value);

    const manejoCambioInput = (e) => {
        const { name, value } = e.target;
        setNuevaTienda((prev) => ({ ...prev, [name]: value }));
    };

    const manejoCambioInputEdicion = (e) => {
        const { name, value } = e.target;
        setTiendaEditar((prev) => ({ ...prev, [name]: value }));
    };

    const manejoCambioArchivo = async (e) => {
        const archivo = e.target.files?.[0];
        if (!archivo) return;
        try {
            const base64 = await convertirArchivoABase64(archivo);
            setNuevaTienda((prev) => ({ ...prev, imagen_url: base64 }));
        } catch (err) {
            setToast({ mostrar: true, mensaje: "No se pudo procesar la imagen", tipo: "error" });
        }
    };

    const manejoCambioArchivoActualizar = async (e) => {
        const archivo = e.target.files?.[0];
        if (!archivo) return;
        try {
            const base64 = await convertirArchivoABase64(archivo);
            setTiendaEditar((prev) => ({ ...prev, imagen_url: base64 }));
        } catch (err) {
            setToast({ mostrar: true, mensaje: "No se pudo procesar la imagen", tipo: "error" });
        }
    };

    const abrirModalEdicion = (tienda) => {
        setTiendaEditar(tienda);
        setMostrarModalEdicion(true);
    };

    const abrirModalEliminacion = (tienda) => {
        setTiendaAEliminar(tienda);
        setMostrarModalEliminacion(true);
    };

    const agregarTienda = async () => {
        try {
            if (!nuevaTienda.nombre_tienda.trim()) {
                setToast({ mostrar: true, mensaje: "Debe llenar el nombre de la tienda.", tipo: "advertencia" });
                return;
            }

            const payload = {
                nombre_tienda: nuevaTienda.nombre_tienda.trim(),
                imagen_url: nuevaTienda.imagen_url || null
            };

            const { error } = await supabase.from("tiendas").insert([payload]);
            if (error) throw error;

            await cargarTiendas();
            setMostrarModalRegistro(false);
            setNuevaTienda({ nombre_tienda: "", imagen_url: "" });
            setToast({ mostrar: true, mensaje: "Tienda registrada exitosamente.", tipo: "exito" });
        } catch (err) {
            console.error("Error al registrar tienda:", err.message);
            setToast({ mostrar: true, mensaje: `Error al registrar tienda: ${err.message}`, tipo: "error" });
        }
    };

    const actualizarTienda = async () => {
        if (!tiendaEditar) return;
        try {
            if (!tiendaEditar.nombre_tienda?.trim()) {
                setToast({ mostrar: true, mensaje: "Debe llenar el nombre de la tienda.", tipo: "advertencia" });
                return;
            }

            const payload = {
                nombre_tienda: tiendaEditar.nombre_tienda.trim(),
                imagen_url: tiendaEditar.imagen_url || null
            };

            const { error } = await supabase
                .from("tiendas")
                .update(payload)
                .eq("id_tienda", tiendaEditar.id_tienda);
            if (error) throw error;

            await cargarTiendas();
            setMostrarModalEdicion(false);
            setToast({ mostrar: true, mensaje: "Tienda actualizada exitosamente.", tipo: "exito" });
        } catch (err) {
            console.error("Error al actualizar tienda:", err.message);
            setToast({ mostrar: true, mensaje: `Error al actualizar tienda: ${err.message}`, tipo: "error" });
        }
    };

    const eliminarTienda = async () => {
        if (!tiendaAEliminar) return;
        try {
            const { error } = await supabase
                .from("tiendas")
                .delete()
                .eq("id_tienda", tiendaAEliminar.id_tienda);
            if (error) throw error;

            await cargarTiendas();
            setMostrarModalEliminacion(false);
            setToast({ mostrar: true, mensaje: "Tienda eliminada exitosamente.", tipo: "exito" });
        } catch (err) {
            console.error("Error al eliminar tienda:", err.message);
            setToast({ mostrar: true, mensaje: `Error al eliminar tienda: ${err.message}`, tipo: "error" });
        }
    };

    return (
        <Container>
            <br />
            <br />
            <br />
            <br />
            <Row className="align-items-center mb-3">
                <Col xs={9}>
                    <h3><i className="bi bi-shop-window me-2" /> Tiendas</h3>
                </Col>
                <Col xs={3} className="text-end">
                    <Button onClick={() => setMostrarModalRegistro(true)}>
                        <i className="bi bi-plus-lg" /> <span className="d-none d-sm-inline">Nueva</span>
                    </Button>
                </Col>
            </Row>
            <hr />

            <CuadroBusquedas textoBusqueda={textoBusqueda} manejarCambioBusqueda={manejarCambioBusqueda} />

            {textoBusqueda.trim() !== "" && tiendasFiltradas.length === 0 && (
                <Alert variant="warning" className="mt-3">
                    No se encontraron tiendas que coincidan con la búsqueda.
                </Alert>
            )}

            <ModalRegistroTienda
                mostrarModal={mostrarModalRegistro}
                setMostrarModal={setMostrarModalRegistro}
                nuevaTienda={nuevaTienda}
                manejoCambioInput={manejoCambioInput}
                manejoCambioArchivo={manejoCambioArchivo}
                agregarTienda={agregarTienda}
            />

            <ModalEdicionTienda
                mostrarModalEdicion={mostrarModalEdicion}
                setMostrarModalEdicion={setMostrarModalEdicion}
                tiendaEditar={tiendaEditar}
                manejoCambioInputEdicion={manejoCambioInputEdicion}
                manejoCambioArchivoActualizar={manejoCambioArchivoActualizar}
                actualizarTienda={actualizarTienda}
            />

            <ModalEliminacionTienda
                mostrarModal={mostrarModalEliminacion}
                setMostrarModal={setMostrarModalEliminacion}
                tiendaAEliminar={tiendaAEliminar}
                eliminarTienda={eliminarTienda}
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
                    <div className="d-lg-none">
                        <TarjetasTiendas
                            tiendas={tiendasPaginadas}
                            abrirModalEdicion={abrirModalEdicion}
                            abrirModalEliminacion={abrirModalEliminacion}
                        />
                    </div>

                    <div className="d-none d-lg-block">
                        <TablaTiendas
                            tiendas={tiendasPaginadas}
                            abrirModalEdicion={abrirModalEdicion}
                            abrirModalEliminacion={abrirModalEliminacion}
                        />
                    </div>

                    {tiendas.length === 0 && <p className="text-center">No hay tiendas registradas.</p>}
                </>
            )}

            <Paginacion
                registrosPorPagina={registrosPorPagina}
                totalRegistros={tiendasFiltradas.length}
                paginaActual={paginaActual}
                establecerPaginaActual={establecerPaginaActual}
                establecerRegistrosPorPagina={establecerRegistrosPorPagina}
            />
        </Container>
    );
};

export default Tiendas;
