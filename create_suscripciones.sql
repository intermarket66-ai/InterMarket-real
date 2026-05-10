-- =============================================
-- CREACIÓN DE TABLA DE SUSCRIPCIONES
-- =============================================

CREATE TABLE IF NOT EXISTS public.suscripciones (
  id_suscripcion UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario UUID REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL,
  estado VARCHAR(20) DEFAULT 'activo',
  monto NUMERIC(12,2),
  fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_fin TIMESTAMP WITH TIME ZONE,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.suscripciones ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Usuarios ven sus propias suscripciones" ON public.suscripciones 
  FOR SELECT USING (auth.uid() = id_usuario);

CREATE POLICY "Usuarios pueden crear sus suscripciones" ON public.suscripciones 
  FOR INSERT WITH CHECK (auth.uid() = id_usuario);

-- Opcional: Permitir actualización (ej: para cancelar)
CREATE POLICY "Usuarios actualizan sus suscripciones" ON public.suscripciones 
  FOR UPDATE USING (auth.uid() = id_usuario);
