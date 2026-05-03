-- Ejecuta este script en el Editor SQL de Supabase para poblar los estados iniciales
-- Es necesario para que las ventas y pedidos puedan guardarse correctamente.

INSERT INTO public.estados (id_estado, nombre_estado)
VALUES 
  (1, 'Pendiente'),
  (2, 'Pagado/Aceptado'),
  (3, 'Cancelado/Rechazado'),
  (4, 'Entregado/Completado')
ON CONFLICT (id_estado) DO UPDATE SET nombre_estado = EXCLUDED.nombre_estado;

-- Reiniciar la secuencia si es necesario
SELECT setval(pg_get_serial_sequence('public.estados', 'id_estado'), coalesce(max(id_estado), 1)) FROM public.estados;
