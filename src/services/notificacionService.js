import { supabase } from '../database/supabaseconfig';

/**
 * Crea una notificación en la base de datos para un usuario.
 * @param {string} usuarioId - ID del usuario destinatario (auth.users)
 * @param {string} tipo - Tipo: 'stock_bajo', 'nuevo_pedido', 'envio', etc.
 * @param {string} titulo - Título corto de la notificación
 * @param {string} mensaje - Cuerpo del mensaje
 * @param {object} metadata - Datos extra (id_producto, etc.)
 */
export const crearNotificacion = async (usuarioId, tipo, titulo, mensaje, metadata = {}) => {
    try {
        const { error } = await supabase.from('notificaciones').insert([{
            usuario_id: usuarioId,
            tipo,
            titulo,
            mensaje,
            metadata,
            leido: false,
        }]);
        if (error) console.error('Error al crear notificación:', error);
    } catch (err) {
        console.error('Error inesperado al crear notificación:', err);
    }
};

/**
 * Verifica el stock de un producto y crea notificación de stock bajo si corresponde.
 * @param {string} idProducto
 * @param {string} nombreProducto
 * @param {number} stockActual
 * @param {number} umbral - Por debajo de este número se considera stock bajo (default: 5)
 */
export const notificarStockBajo = async (idProducto, nombreProducto, stockActual, umbral = 5) => {
    if (stockActual > umbral) return; // Stock normal, no notificar

    // Obtener el vendedor dueño de este producto
    const { data: producto } = await supabase
        .from('productos')
        .select('id_tienda')
        .eq('id_producto', idProducto)
        .single();

    if (!producto?.id_tienda) return;

    // Obtener el usuario_id del dueño de la tienda
    const { data: perfil } = await supabase
        .from('perfiles')
        .select('id_usuario')
        .eq('id_tienda', producto.id_tienda)
        .single();

    if (!perfil?.id_usuario) return;

    const titulo = stockActual === 0
        ? `¡Producto agotado!`
        : `⚠️ Stock bajo`;

    const mensaje = stockActual === 0
        ? `Tu producto "${nombreProducto}" se ha agotado. Actualiza el stock para seguir vendiendo.`
        : `Tu producto "${nombreProducto}" tiene solo ${stockActual} unidad(es) disponible(s). Considera reabastecer pronto.`;

    await crearNotificacion(perfil.id_usuario, 'stock_bajo', titulo, mensaje, {
        id_producto: idProducto,
        nombre_producto: nombreProducto,
        stock_actual: stockActual,
    });
};
