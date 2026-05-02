import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_API_KEY;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const getStripeCustomerId = async (email, userId) => {
    if (!email) return null;

    const existing = await stripe.customers.list({ email, limit: 1 });
    if (existing.data && existing.data.length > 0) {
        return existing.data[0].id;
    }

    const customer = await stripe.customers.create({
        email,
        metadata: { user_id: userId },
    });

    return customer.id;
};

export const handler = async (event, context) => {
    // Handle CORS Preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: 'ok',
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    if (!supabaseUrl || !supabaseAnonKey) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Faltan variables de entorno de Supabase.' }),
        };
    }

    try {
        const { carrito } = JSON.parse(event.body);

        if (!carrito || carrito.length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'El carrito está vacío' }),
            };
        }

        const authHeader = event.headers.authorization || event.headers.Authorization;
        if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'No autorizado.' }),
            };
        }

        const token = authHeader.split(' ')[1];
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false, autoRefreshToken: false },
        });
        await supabase.auth.setAuth(token);
        const { data: authUserData, error: authUserError } = await supabase.auth.getUser();

        if (authUserError || !authUserData?.user) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'No autorizado.' }),
            };
        }

        const userId = authUserData.user.id;
        const email = authUserData.user.email;

        const { data: currentMethod } = await supabase
            .from('metodos_pago')
            .select('id_stripe_customer')
            .eq('id_usuario', userId)
            .limit(1)
            .maybeSingle();

        let stripeCustomerId = currentMethod?.id_stripe_customer || null;
        if (!stripeCustomerId) {
            stripeCustomerId = await getStripeCustomerId(email, userId);
        }

        const line_items = carrito.map((item) => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.nombre_producto,
                    images: item.imagen_url && item.imagen_url.length > 0 ? [item.imagen_url[0]] : [],
                },
                unit_amount: Math.round(item.precio_venta * 100),
            },
            quantity: item.cantidad,
        }));

        const origin = event.headers.origin || 'http://localhost:5173';

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer: stripeCustomerId,
            payment_intent_data: {
                setup_future_usage: 'off_session',
            },
            line_items,
            mode: 'payment',
            success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/cancel`,
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ sessionId: session.id, url: session.url }),
        };

    } catch (error) {
        console.error('Error creating session:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
