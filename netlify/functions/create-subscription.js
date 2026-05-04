import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_API_KEY;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export const handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: 'ok' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const { planId, successUrl, cancelUrl } = JSON.parse(event.body || '{}');

        if (!planId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Faltan datos requeridos (planId).' }),
            };
        }

        // 1. Obtener el token del usuario
        const authHeader = event.headers.authorization || event.headers.Authorization;
        if (!authHeader) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'No autorizado' }) };
        }

        const token = authHeader.split(' ')[1];
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        });

        const { data: authUserData, error: authUserError } = await supabase.auth.getUser(token);
        if (authUserError || !authUserData?.user) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'Usuario no válido' }) };
        }

        const userEmail = authUserData.user.email;
        const userId = authUserData.user.id;

        // Definir planes (esto podría estar en la DB)
        const planes = {
            'plan_basico': {
                nombre: 'Plan Emprendedor',
                precio: 9.99,
                id_precio_stripe: process.env.STRIPE_PRICE_EMPRENDEDOR // Configurar en Netlify
            },
            'plan_pro': {
                nombre: 'Plan Profesional',
                precio: 24.99,
                id_precio_stripe: process.env.STRIPE_PRICE_PRO // Configurar en Netlify
            }
        };

        const plan = planes[planId];
        if (!plan) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Plan no válido' }) };
        }

        // 2. Crear Checkout Session en Stripe para SUSCRIPCIÓN
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: plan.nombre,
                            description: `Suscripción mensual para vender en InterMarket`,
                        },
                        unit_amount: Math.round(plan.precio * 100),
                        recurring: {
                            interval: 'month',
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&plan_id=${planId}`,
            cancel_url: cancelUrl,
            customer_email: userEmail,
            metadata: {
                userId: userId,
                planId: planId
            }
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ id: session.id, url: session.url }),
        };

    } catch (error) {
        console.error('Error en create-subscription:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
