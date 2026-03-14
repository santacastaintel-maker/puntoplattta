-- Configuración de Storage para Fotos de Productos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('productos', 'productos', true);

-- Políticas para el bucket de productos
-- Permitir que cualquier usuario autenticado vea las imágenes
CREATE POLICY "Cualquier persona puede ver fotos de productos"
ON storage.objects FOR SELECT
USING (bucket_id = 'productos');

-- Permitir que los administradores suban y editen imágenes
-- (Asumiendo que los vendedores admins tienen rol 'admin' en la tabla vendedores)
CREATE POLICY "Admins pueden subir fotos de productos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'productos' AND
  (SELECT rol FROM public.vendedores WHERE id::text = auth.uid()::text) = 'admin'
);

CREATE POLICY "Admins pueden actualizar fotos de productos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'productos' AND
  (SELECT rol FROM public.vendedores WHERE id::text = auth.uid()::text) = 'admin'
);

CREATE POLICY "Admins pueden borrar fotos de productos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'productos' AND
  (SELECT rol FROM public.vendedores WHERE id::text = auth.uid()::text) = 'admin'
);
