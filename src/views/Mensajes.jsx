import React, { useEffect, useMemo, useState } from "react";
import { Button, Col, Container, Form, Row, Spinner } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";
import NotificacionOperacion from "../components/NotificacionOperacion";
import { useAuth } from "../context/AuthContext";
import { enviarNotificacionPorCorreo } from "../services/emailService";

const Mensajes = () => {
    const [chats, setChats] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [textoBusqueda, setTextoBusqueda] = useState("");
    const [chatActivo, setChatActivo] = useState(null);
    const [toast, setToast] = useState({ mostrar: false, mensaje: "", tipo: "" });

    const { user } = useAuth();
    const [textoMensaje, setTextoMensaje] = useState("");
    const [mensajes, setMensajes] = useState([]);
    const [miPerfilId, setMiPerfilId] = useState(null);

    // 1. Obtener mi Perfil ID
    useEffect(() => {
        const obtenerPerfilId = async () => {
            if (!user) return;
            const { data } = await supabase.from('perfiles').select('perfil_id').eq('id_usuario', user.id).maybeSingle();
            if (data) setMiPerfilId(data.perfil_id);
        };
        obtenerPerfilId();
    }, [user]);

    const cargarChats = async () => {
        try {
            setCargando(true);
            if (!miPerfilId) return;

            const { data, error } = await supabase
                .from("chats")
                .select("*, productos(nombre_producto, imagen_url)")
                .or(`comprador_id.eq.${miPerfilId},vendedor_id.eq.${miPerfilId}`)
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
        if (miPerfilId) cargarChats();
    }, [miPerfilId]);

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

    // 2. Cargar mensajes del chat activo y suscribirse a Realtime
    useEffect(() => {
        if (!chatActivo) {
            setMensajes([]);
            return;
        }

        const cargarMensajes = async () => {
            const { data, error } = await supabase
                .from("mensajes")
                .select("*")
                .eq("id_chat", chatActivo.id_chat)
                .order("creado_en", { ascending: true });
            
            if (data) setMensajes(data);
        };

        cargarMensajes();

        const channel = supabase.channel(`mensajes_chat_${chatActivo.id_chat}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'mensajes', filter: `id_chat=eq.${chatActivo.id_chat}` },
                (payload) => {
                    setMensajes((prev) => [...prev, payload.new]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [chatActivo]);

    const enviarMensaje = async () => {
        if (!chatActivo || !textoMensaje.trim() || !miPerfilId) return;
        
        const texto = textoMensaje.trim();
        setTextoMensaje(""); // Limpiar optimista

        const { error } = await supabase
            .from("mensajes")
            .insert([{
                id_chat: chatActivo.id_chat,
                emisor_id: miPerfilId,
                texto: texto
            }]);

        if (error) {
            setToast({ mostrar: true, mensaje: "Error al enviar mensaje.", tipo: "error" });
        } else {
            // 3. Crear notificación para el receptor
            const receptorId = chatActivo.vendedor_id === miPerfilId ? chatActivo.comprador_id : chatActivo.vendedor_id;
            if (receptorId) {
                const titulo = 'Nuevo mensaje';
                const msjAviso = `Tienes un nuevo mensaje en el chat.`;
                await supabase.from('notificaciones').insert([{
                    usuario_id: receptorId,
                    titulo: titulo,
                    mensaje: msjAviso
                }]);

                const { data: receptorData } = await supabase.from('perfiles').select('usuarios(email)').eq('perfil_id', receptorId).maybeSingle();
                if (receptorData?.usuarios?.email) {
                    enviarNotificacionPorCorreo(receptorData.usuarios.email, titulo, msjAviso);
                }
            }
        }
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
                                            <small className="text-muted text-truncate" style={{ display: 'block', maxWidth: '200px' }}>
                                                {chat.productos?.nombre_producto || `Producto: ${chat.producto_id?.slice(0, 10)}...`}
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
                                    {mensajes.map((mensaje) => {
                                        const esMio = mensaje.emisor_id === miPerfilId;
                                        return (
                                            <div
                                                key={mensaje.id_mensaje}
                                                className={`burbuja-wrapper ${esMio ? "yo" : "otro"}`}
                                            >
                                                <div className="burbuja-mensaje">
                                                    <p>{mensaje.texto}</p>
                                                    <small>{new Date(mensaje.creado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                                                </div>
                                            </div>
                                        );
                                    })}
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
