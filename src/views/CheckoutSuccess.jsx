import React, { useEffect, useState, useRef } from 'react';
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
    const procesadoRef = useRef(false);

    useEffect(() => {
        // Bloqueo para evitar doble ejecución (React Strict Mode o re-renders)
        if (procesadoRef.current) return;

        const confirmarCompra = async () => {
            if (!user || !session?.access_token) {
                // Esperar a que la sesión esté cargada
                return;
            }

            const carritoPendienteStr = localStorage.getItem('carritoPendiente');
            const totalPendienteStr = localStorage.getItem('totalPendiente');
            const direccionPendiente = localStorage.getItem('direccionPendiente');
            const sessionId = new URLSearchParams(location.search).get('session_id');

            if (!carritoPendienteStr || !totalPendienteStr) {
                // Ya se procesó o no hay nada pendiente
                setProcesando(false);
                return;
            }

            // Activar el candado de inmediato
            procesadoRef.current = true;

            try {
                const carrito = JSON.parse(carritoPendienteStr);
                const total = parseFloat(totalPendienteStr);

                // Llamar a la función de Netlify para procesar todo en el servidor
                const response = await fetch('/.netlify/functions/complete-order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                        session_id: sessionId,
                        carrito,
                        total,
                        id_direccion: direccionPendiente
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al procesar la orden final');
                }

                // Limpiar todo después del éxito
                localStorage.removeItem('carritoPendiente');
                localStorage.removeItem('totalPendiente');
                localStorage.removeItem('carrito');
                window.dispatchEvent(new Event('carritoActualizado'));

                // Reducir stock de cada producto
                for (const item of carrito) {
                    const { data: prod } = await supabase
                        .from('productos')
                        .select('stock')
                        .eq('id_producto', item.id_producto)
                        .single();
                    if (prod && prod.stock !== null) {
                        await supabase
                            .from('productos')
                            .update({ stock: Math.max(0, prod.stock - (item.cantidad || 1)) })
                            .eq('id_producto', item.id_producto);
                    }
                }
                
            } catch (err) {
                console.error("Error al confirmar la venta:", err);
                
                // Si el error es por duplicado, lo tratamos como éxito porque la venta ya existe
                if (err.message.includes('unique_stripe_intent') || err.message.includes('23505')) {
                    console.log("Detectada venta duplicada, marcando como éxito.");
                    localStorage.removeItem('carritoPendiente');
                    localStorage.removeItem('totalPendiente');
                    localStorage.removeItem('direccionPendiente');
                    localStorage.removeItem('carrito');
                    window.dispatchEvent(new Event('carritoActualizado'));
                    setProcesando(false);
                    return;
                }

                setError(err.message);
                // Si hubo un error real de red, permitimos reintentar si el usuario recarga
                procesadoRef.current = false;
            } finally {
                setProcesando(false);
            }
        };

        confirmarCompra();
    }, [user, session, location.search]);

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
