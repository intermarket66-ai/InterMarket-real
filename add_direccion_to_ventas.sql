-- Añadir columna de dirección a ventas
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS id_direccion UUID REFERENCES public.direcciones(id_direccion) ON DELETE SET NULL;
