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
        const { session_id, carrito, total } = JSON.parse(event.body || '{}');

        if (!session_id || !carrito || !total) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Faltan datos requeridos (session_id, carrito, total).' }),
            };
        }

        // 1. Obtener el token del usuario para actuar en su nombre (respeta RLS)
        const authHeader = event.headers.authorization || event.headers.Authorization;
        if (!authHeader) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'No autorizado' }) };
        }

        const token = authHeader.split(' ')[1];
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: authUserData, error: authUserError } = await supabase.auth.getUser(token);
        if (authUserError || !authUserData?.user) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'Usuario no válido' }) };
        }

        const userId = authUserData.user.id;

        // 2. Verificar la sesión en Stripe
        const session = await stripe.checkout.sessions.retrieve(session_id);
        if (!session || session.payment_status !== 'paid') {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'El pago no ha sido completado en Stripe.' }),
            };
        }

        // 3. Obtener el perfil del comprador
        const { data: perfilData, error: perfilError } = await supabase
            .from('perfiles')
            .select('perfil_id, usuarios(username)')
            .eq('id_usuario', userId)
            .maybeSingle();

        if (perfilError || !perfilData) {
            throw new Error("No se pudo encontrar el perfil del usuario.");
        }

        const perfilId = perfilData.perfil_id;
        const nombreComprador = perfilData.usuarios?.username || 'Un comprador';

        // 4. Crear la Venta en Supabase
        const { data: venta, error: ventaError } = await supabase
            .from('ventas')
            .insert({
                id_usuario: userId,
                monto_total: total,
                id_estado: 2, // 2 = Pagado/Aceptado (ya que Stripe confirmó el pago)
                id_stripe_intent: session.payment_intent
            })
            .select()
            .single();

        if (ventaError) throw ventaError;

        // 5. Crear los Pedidos (Items)
        const pedidos = carrito.map(item => ({
            perfil_id: perfilId,
            venta_id: venta.venta_id,
            producto_id: item.id_producto,
            id_estado: 1, // El item individual empieza como 'Pendiente' hasta que el vendedor lo acepte
            precio_unitario: item.precio_venta
        }));

        const { error: pedidosError } = await supabase.from('pedidos').insert(pedidos);
        if (pedidosError) throw pedidosError;

        // 6. Notificaciones a los vendedores (Opcional, pero recomendado)
        const tiendasIds = [...new Set(carrito.map(item => item.id_tienda).filter(Boolean))];
        for (const idTienda of tiendasIds) {
            const { data: vendedorData } = await supabase
                .from('perfiles')
                .select('perfil_id')
                .eq('id_tienda', idTienda)
                .maybeSingle();

            if (vendedorData) {
                await supabase.from('notificaciones').insert([{
                    usuario_id: vendedorData.perfil_id,
                    titulo: '¡Nueva venta realizada!',
                    mensaje: `${nombreComprador} ha comprado productos de tu tienda. Pago confirmado vía Stripe.`
                }]);
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, venta_id: venta.venta_id }),
        };

    } catch (error) {
        console.error('Error en complete-order:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
