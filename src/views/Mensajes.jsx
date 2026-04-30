import React, { useEffect, useMemo, useState } from "react";
import { Button, Col, Container, Form, Row, Spinner } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";
import NotificacionOperacion from "../components/NotificacionOperacion";

const Mensajes = () => {
    const [chats, setChats] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [textoBusqueda, setTextoBusqueda] = useState("");
    const [chatActivo, setChatActivo] = useState(null);
    const [toast, setToast] = useState({ mostrar: false, mensaje: "", tipo: "" });

    const [textoMensaje, setTextoMensaje] = useState("");
    const [mensajesLocales, setMensajesLocales] = useState({});

    const cargarChats = async () => {
        try {
            setCargando(true);
            const { data, error } = await supabase
                .from("chats")
                .select("*")
                .order("creado_en", { ascending: false });

            if (error) throw error;
            setChats(data || []);
        } catch (err) {
            console.error("Error al cargar chats:", err.message);
            setToast({ mostrar: true, mensaje: `Error al cargar chats: ${err.message}`, tipo: "error" });
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarChats();
    }, []);

    useEffect(() => {
        if (!chatActivo && chats.length > 0) {
            setChatActivo(chats[0]);
        }
    }, [chats, chatActivo]);

    const chatsFiltrados = useMemo(() => {
        if (!textoBusqueda.trim()) return chats;
        const valor = textoBusqueda.toLowerCase().trim();
        return chats.filter((chat) =>
            [chat.comprador_id, chat.vendedor_id, chat.producto_id]
                .filter(Boolean)
                .some((campo) => campo.toLowerCase().includes(valor))
        );
    }, [textoBusqueda, chats]);

    const eliminarChat = async (idChat) => {
        try {
            const { error } = await supabase
                .from("chats")
                .delete()
                .eq("id_chat", idChat);
            if (error) throw error;

            if (chatActivo?.id_chat === idChat) setChatActivo(null);
            setToast({ mostrar: true, mensaje: "Chat eliminado exitosamente.", tipo: "exito" });
            await cargarChats();
        } catch (err) {
            console.error("Error al eliminar chat:", err.message);
            setToast({ mostrar: true, mensaje: `Error al eliminar chat: ${err.message}`, tipo: "error" });
        }
    };

    const obtenerMensajesChat = (chat) => {
        if (!chat) return [];
        if (mensajesLocales[chat.id_chat]) return mensajesLocales[chat.id_chat];

        const mensajesIniciales = [
            {
                id: `${chat.id_chat}-1`,
                emisor: "otro",
                texto: "Hola, el producto aun esta disponible?",
                hora: "10:30"
            },
            {
                id: `${chat.id_chat}-2`,
                emisor: "yo",
                texto: "Si, esta disponible. Te interesa?",
                hora: "10:31"
            }
        ];
        return mensajesIniciales;
    };

    const enviarMensaje = () => {
        if (!chatActivo || !textoMensaje.trim()) return;
        const mensajeNuevo = {
            id: `${chatActivo.id_chat}-${Date.now()}`,
            emisor: "yo",
            texto: textoMensaje.trim(),
            hora: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };

        setMensajesLocales((prev) => {
            const actuales = obtenerMensajesChat(chatActivo);
            return {
                ...prev,
                [chatActivo.id_chat]: [...actuales, mensajeNuevo]
            };
        });
        setTextoMensaje("");
    };

    return (
        <Container className="mensajes-page">
            <br />
            <br />
            <br />
            <br />

            <Row className="g-3">
                <Col lg={4}>
                    <section className="mensajes-lista">
                        <div className="mensajes-lista-header">
                            <h5 className="mb-0">Mensajes</h5>
                            <small className="text-muted">Ver todo</small>
                        </div>

                        <div className="mensajes-buscador">
                            <i className="bi bi-search" />
                            <Form.Control
                                placeholder="Buscar"
                                value={textoBusqueda}
                                onChange={(e) => setTextoBusqueda(e.target.value)}
                            />
                        </div>

                        {cargando ? (
                            <div className="text-center my-5">
                                <Spinner animation="border" variant="success" />
                            </div>
                        ) : (
                            <div className="mensajes-items">
                                {chatsFiltrados.map((chat) => (
                                    <button
                                        type="button"
                                        key={chat.id_chat}
                                        className={`mensajes-item ${chatActivo?.id_chat === chat.id_chat ? "activo" : ""}`}
                                        onClick={() => setChatActivo(chat)}
                                    >
                                        <div className="mensajes-avatar">
                                            {(chat.vendedor_id || "U").slice(0, 1).toUpperCase()}
                                        </div>
                                        <div className="mensajes-item-body">
                                            <div className="mensajes-item-top">
                                                <strong>{`Chat ${chat.id_chat.slice(0, 8)}`}</strong>
                                                <small>{new Date(chat.creado_en).toLocaleDateString()}</small>
                                            </div>
                                            <small className="text-muted">
                                                Producto: {chat.producto_id?.slice(0, 10)}...
                                            </small>
                                        </div>
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="text-danger text-decoration-none"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                eliminarChat(chat.id_chat);
                                            }}
                                        >
                                            <i className="bi bi-trash" />
                                        </Button>
                                    </button>
                                ))}
                                {!cargando && chatsFiltrados.length === 0 && (
                                    <div className="text-center text-muted py-4">No hay chats disponibles.</div>
                                )}
                            </div>
                        )}
                    </section>
                </Col>

                <Col lg={8}>
                    <section className="mensajes-chat">
                        {chatActivo ? (
                            <>
                                <header className="mensajes-chat-header">
                                    <div className="mensajes-avatar grande">
                                        {(chatActivo.vendedor_id || "U").slice(0, 1).toUpperCase()}
                                    </div>
                                    <div>
                                        <strong>{`Chat ${chatActivo.id_chat.slice(0, 8)}`}</strong>
                                        <small className="d-block text-muted">Producto: {chatActivo.producto_id}</small>
                                    </div>
                                </header>

                                <div className="mensajes-chat-cuerpo">
                                    {obtenerMensajesChat(chatActivo).map((mensaje) => (
                                        <div
                                            key={mensaje.id}
                                            className={`burbuja-wrapper ${mensaje.emisor === "yo" ? "yo" : "otro"}`}
                                        >
                                            <div className="burbuja-mensaje">
                                                <p>{mensaje.texto}</p>
                                                <small>{mensaje.hora}</small>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <footer className="mensajes-chat-footer">
                                    <button type="button" className="btn btn-link text-dark p-0">
                                        <i className="bi bi-plus-lg" />
                                    </button>
                                    <Form.Control
                                        placeholder="Enviar mensaje"
                                        value={textoMensaje}
                                        onChange={(e) => setTextoMensaje(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                enviarMensaje();
                                            }
                                        }}
                                    />
                                    <button type="button" className="btn btn-link text-primary p-0" onClick={enviarMensaje}>
                                        <i className="bi bi-send-fill" />
                                    </button>
                                </footer>
                            </>
                        ) : (
                            <div className="h-100 d-flex justify-content-center align-items-center text-muted">
                                Selecciona un chat para comenzar.
                            </div>
                        )}
                    </section>
                </Col>
            </Row>

            <NotificacionOperacion
                mostrar={toast.mostrar}
                mensaje={toast.mensaje}
                tipo={toast.tipo}
                onCerrar={() => setToast((prev) => ({ ...prev, mostrar: false }))}
            />
        </Container>
    );
};

export default Mensajes;
