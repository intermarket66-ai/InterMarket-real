-- Habilitar edición de métodos de pago para el usuario dueño
DROP POLICY IF EXISTS "Usuarios actualizan sus propios metodos" ON public.metodos_pago;
CREATE POLICY "Usuarios actualizan sus propios metodos" ON public.metodos_pago 
FOR UPDATE USING (auth.uid() = id_usuario);
