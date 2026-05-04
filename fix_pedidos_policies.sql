-- Corregir las políticas de la tabla pedidos que usaban producto_id

-- 1. Eliminar las políticas antiguas que están rotas
DROP POLICY IF EXISTS "Vendedores ven pedidos de sus productos" ON public.pedidos;
DROP POLICY IF EXISTS "Vendedores pueden actualizar estado de pedidos" ON public.pedidos;

-- 2. Crear las nuevas políticas usando id_producto
CREATE POLICY "Vendedores ven pedidos de sus productos" ON public.pedidos FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.productos pr
    JOIN public.perfiles pe ON pe.id_tienda = pr.id_tienda
    WHERE pr.id_producto = pedidos.id_producto AND pe.id_usuario = auth.uid()
  )
);

CREATE POLICY "Vendedores pueden actualizar estado de pedidos" ON public.pedidos FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.productos pr
    JOIN public.perfiles pe ON pe.id_tienda = pr.id_tienda
    WHERE pr.id_producto = pedidos.id_producto AND pe.id_usuario = auth.uid()
  )
);

-- NOTA: Forzar recarga del caché de Supabase por si acaso
NOTIFY pgrst, 'reload schema';
