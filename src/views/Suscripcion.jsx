import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../database/supabaseconfig';

const Suscripcion = () => {
    const { user, session, changeRole } = useAuth();
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const planes = [
        {
            id: 'plan_basico',
            nombre: 'Plan Emprendedor',
            precio: 9.99,
            color: '#10454F',
            caracteristicas: [
                'Hasta 50 productos activos',
                'Estadísticas básicas de ventas',
                'Soporte por email',
                'Insignia de vendedor verificado'
            ],
            recomendado: false
        },
        {
            id: 'plan_pro',
            nombre: 'Plan Profesional',
            precio: 24.99,
            color: '#DF4A9F',
            caracteristicas: [
                'Productos ilimitados',
                'Estadísticas avanzadas y reportes',
                'Soporte prioritario 24/7',
                'Posicionamiento destacado en búsquedas',
                'Herramientas de marketing'
            ],
            recomendado: true
        }
    ];

    const manejarSuscripcion = async (planId) => {
        try {
            setCargando(true);
            setError(null);

            // Para propósitos de este ejercicio, simularemos el éxito directamente
            // o llamaremos a la función de simulación.
            
            const response = await fetch('/.netlify/functions/simular-suscripcion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    planId,
                    id_operacion: Date.now().toString()
                })
            });

            const result = await response.json();

            if (result.success) {
                // Actualizar rol localmente y navegar
                changeRole('vendedor');
                navigate('/vendedor');
            } else {
                throw new Error(result.error || 'Error al procesar la suscripción');
            }
        } catch (err) {
            console.error('Error:', err);
            setError(err.message);
        } finally {
            setCargando(false);
        }
    };

    return (
        <Container className="py-5 mt-5">
            <div className="text-center mb-5">
                <h1 className="display-4 fw-800" style={{ color: 'var(--color-primario)' }}>Impulsa tu Negocio</h1>
                <p className="lead text-muted">Elige el plan que mejor se adapte a tus necesidades y comienza a vender hoy mismo.</p>
            </div>

            {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

            <Row className="justify-content-center g-4">
                {planes.map((plan) => (
                    <Col key={plan.id} md={6} lg={4}>
                        <Card 
                            className={`h-100 border-0 shadow-lg position-relative ${plan.recomendado ? 'transform-scale-105' : ''}`}
                            style={{ borderRadius: '24px', overflow: 'hidden' }}
                        >
                            {plan.recomendado && (
                                <div 
                                    className="position-absolute top-0 end-0 p-3"
                                    style={{ zIndex: 1 }}
                                >
                                    <Badge bg="warning" text="dark" className="px-3 py-2 rounded-pill fw-bold">
                                        RECOMENDADO
                                    </Badge>
                                </div>
                            )}
                            
                            <Card.Header 
                                className="text-white text-center py-4 border-0"
                                style={{ background: plan.color }}
                            >
                                <h3 className="fw-bold mb-0">{plan.nombre}</h3>
                            </Card.Header>

                            <Card.Body className="p-4 d-flex flex-column">
                                <div className="text-center mb-4">
                                    <span className="display-4 fw-800">$ {plan.precio}</span>
                                    <span className="text-muted"> / mes</span>
                                </div>

                                <ul className="list-unstyled mb-5 flex-grow-1">
                                    {plan.caracteristicas.map((feature, idx) => (
                                        <li key={idx} className="mb-3 d-flex align-items-start">
                                            <i className="bi bi-check-circle-fill me-2 text-success"></i>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button 
                                    variant={plan.recomendado ? "primary" : "outline-primary"}
                                    className="w-100 py-3 rounded-pill fw-bold fs-5"
                                    disabled={cargando}
                                    onClick={() => manejarSuscripcion(plan.id)}
                                >
                                    {cargando ? <Spinner size="sm" /> : 'Suscribirme Ahora'}
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            <div className="text-center mt-5 text-muted small">
                <p>Al suscribirte, aceptas nuestros términos y condiciones de vendedor. <br/>
                Puedes cancelar tu suscripción en cualquier momento desde tu panel de configuración.</p>
            </div>

            <style>{`
                .fw-800 { font-weight: 800; }
                .transform-scale-105 { transform: scale(1.05); z-index: 2; }
                @media (max-width: 768px) {
                    .transform-scale-105 { transform: none; }
                }
            `}</style>
        </Container>
    );
};

export default Suscripcion;
