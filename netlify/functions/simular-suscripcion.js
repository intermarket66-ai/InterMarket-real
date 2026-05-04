import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_API_KEY;

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
        const { planId, id_operacion } = JSON.parse(event.body || '{}');

        if (!planId || !id_operacion) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Faltan datos requeridos.' }),
            };
        }

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

        const userId = authUserData.user.id;

        // Actualizar el rol del usuario a 'vendedor' en la tabla usuarios
        const { error: updateError } = await supabase
            .from('usuarios')
            .update({ rol: 'vendedor' })
            .eq('id_usuario', userId);

        if (updateError) throw updateError;

        // Podríamos insertar un registro en una tabla de suscripciones aquí si existiera
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: 'Suscripción simulada exitosa. Ahora eres vendedor.' }),
        };

    } catch (error) {
        console.error('Error en simular-suscripcion:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
