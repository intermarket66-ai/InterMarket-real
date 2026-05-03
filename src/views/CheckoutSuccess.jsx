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
                        total
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al procesar la orden final');
                }

                // Opcional: También guardar el método de pago si quieres
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

                // Limpiar todo después del éxito
                localStorage.removeItem('carritoPendiente');
                localStorage.removeItem('totalPendiente');
                localStorage.removeItem('carrito'); // Vaciar el carrito real
                window.dispatchEvent(new Event('carritoActualizado'));
                
            } catch (err) {
                console.error("Error al confirmar la venta:", err);
                setError(err.message);
            } finally {
                setProcesando(false);
            }
        };

        confirmarCompra();
    }, [user, session]);

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
