-- 1. Habilitar inserción de tiendas para usuarios autenticados
-- Nota: Usamos auth.uid() para asegurar que solo usuarios logueados crean tiendas.
CREATE POLICY "Usuarios autenticados crean tiendas" ON public.tiendas 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 2. Permitir que los dueños actualicen su tienda
CREATE POLICY "Vendedores actualizan su propia tienda" ON public.tiendas 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.perfiles p
    WHERE p.id_usuario = auth.uid() AND p.id_tienda = tiendas.id_tienda
  )
);

-- 3. Permitir que los dueños eliminen su tienda
CREATE POLICY "Vendedores eliminan su propia tienda" ON public.tiendas 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.perfiles p
    WHERE p.id_usuario = auth.uid() AND p.id_tienda = tiendas.id_tienda
  )
);

-- 4. Asegurar que los perfiles se puedan actualizar (vincular id_tienda)
-- Esta ya debería existir pero la reforzamos
DROP POLICY IF EXISTS "Usuarios actualizan su propio perfil_detalle" ON public.perfiles;
CREATE POLICY "Usuarios actualizan su propio perfil_detalle" ON public.perfiles 
FOR UPDATE USING (auth.uid() = id_usuario);

-- 5. Asegurar que los usuarios puedan actualizar su propio rol
DROP POLICY IF EXISTS "Usuarios actualizan su propio perfil" ON public.usuarios;
CREATE POLICY "Usuarios actualizan su propio perfil" ON public.usuarios 
FOR UPDATE USING (auth.uid() = id_usuario);
