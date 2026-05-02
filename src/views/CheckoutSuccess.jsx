import React, { useEffect, useState } from 'react';
import { Container, Card, Spinner, Button } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../database/supabaseconfig';
import { useAuth } from '../context/AuthContext';
import { enviarNotificacionPorCorreo } from '../services/emailService';

const CheckoutSuccess = () => {
    const { user, session } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [procesando, setProcesando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const confirmarCompra = async () => {
            if (!user) {
                setError("Debes iniciar sesión para confirmar la compra.");
                setProcesando(false);
                return;
            }

            const carritoPendienteStr = localStorage.getItem('carritoPendiente');
            const totalPendienteStr = localStorage.getItem('totalPendiente');
            const sessionId = new URLSearchParams(location.search).get('session_id');

            if (sessionId && session?.access_token) {
                try {
                    await fetch('/.netlify/functions/save-payment-method', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${session.access_token}`,
                        },
                        body: JSON.stringify({ session_id: sessionId }),
                    });
                } catch (err) {
                    console.warn('No se pudo guardar el método de pago Stripe:', err);
                }
            }

            if (!carritoPendienteStr || !totalPendienteStr) {
                // Ya se procesó o no hay nada pendiente
                setProcesando(false);
                return;
            }

            try {
                const carrito = JSON.parse(carritoPendienteStr);
                const total = parseFloat(totalPendienteStr);

                // Obtener el perfil del comprador
                const { data: perfilData } = await supabase.from('perfiles').select('perfil_id, usuarios(username)').eq('id_usuario', user.id).maybeSingle();
                const perfilId = perfilData?.perfil_id;
                const nombreComprador = perfilData?.usuarios?.username || 'Un comprador';

                if (!perfilId) throw new Error("Perfil de comprador no encontrado.");

                // 1. Crear Venta principal
                const { data: venta, error: ventaError } = await supabase.from('ventas').insert({
                    id_usuario: user.id,
                    monto_total: total,
                    id_estado: 1 // Pendiente
                }).select().single();

                if (ventaError) throw ventaError;

                // 2. Insertar Pedidos (Order items)
                const pedidos = carrito.map(item => ({
                    perfil_id: perfilId,
                    venta_id: venta.venta_id,
                    producto_id: item.id_producto,
                    id_estado: 1, // Pendiente
                    precio_unitario: item.precio_venta
                }));

                await supabase.from('pedidos').insert(pedidos);

                // 3. Enviar notificaciones a los vendedores
                const tiendasIds = [...new Set(carrito.map(item => item.id_tienda).filter(Boolean))];

                for (const idTienda of tiendasIds) {
                    const { data: vendedorData } = await supabase
                        .from('perfiles')
                        .select('perfil_id, usuarios(email)')
                        .eq('id_tienda', idTienda)
                        .maybeSingle();

                    if (vendedorData?.perfil_id) {
                        const titulo = '¡Nuevo pedido recibido!';
                        const msj = `${nombreComprador} acaba de realizar una compra en tu tienda por Stripe. Revisa tu panel de ventas.`;
                        await supabase.from('notificaciones').insert([{
                            usuario_id: vendedorData.perfil_id,
                            titulo: titulo,
                            mensaje: msj
                        }]);

                        if (vendedorData.usuarios?.email) {
                            enviarNotificacionPorCorreo(vendedorData.usuarios.email, titulo, msj);
                        }
                    }
                }

                // Limpiar todo después del éxito
                localStorage.removeItem('carritoPendiente');
                localStorage.removeItem('totalPendiente');
                localStorage.removeItem('carrito'); // Vaciar el carrito real
                window.dispatchEvent(new Event('carritoActualizado'));
                
            } catch (err) {
                console.error("Error al confirmar la venta en Supabase:", err);
                setError(err.message);
            } finally {
                setProcesando(false);
            }
        };

        confirmarCompra();
    }, [user]);

    return (
        <Container className="py-5 mt-5">
            <Card className="text-center shadow-sm border-0 p-5">
                <Card.Body>
                    {procesando ? (
                        <>
                            <Spinner animation="border" variant="primary" style={{ width: '4rem', height: '4rem' }} />
                            <Card.Title as="h2" className="mt-4">Procesando tu orden...</Card.Title>
                            <Card.Text className="text-muted">Por favor no cierres esta página.</Card.Text>
                        </>
                    ) : error ? (
                        <>
                            <div className="mb-4 text-danger">
                                <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '4rem' }}></i>
                            </div>
                            <Card.Title as="h2" className="mb-3">Hubo un problema</Card.Title>
                            <Card.Text className="text-muted mb-4">{error}</Card.Text>
                            <Button variant="primary" onClick={() => navigate('/catalogo')}>
                                Volver al Catálogo
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="mb-4 text-success">
                                <i className="bi bi-check-circle-fill" style={{ fontSize: '4rem' }}></i>
                            </div>
                            <Card.Title as="h2" className="mb-3">¡Pago Exitoso!</Card.Title>
                            <Card.Text className="text-muted mb-4">
                                Tu compra se ha procesado correctamente y los vendedores han sido notificados.
                            </Card.Text>
                            <Button variant="primary" onClick={() => navigate('/catalogo')}>
                                Seguir Comprando
                            </Button>
                        </>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default CheckoutSuccess;
