-- ==========================================
-- POS JOYERÍA DE PLATA - ESQUEMA DE BASE DE DATOS
-- ==========================================

-- 1. EXTENSIONES Y SEGURIDAD
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. SUPRIMIR DATOS (Para evitar colisiones en pruebas locales)
DROP TABLE IF EXISTS movimientos_stock CASCADE;
DROP TABLE IF EXISTS venta_detalles CASCADE;
DROP TABLE IF EXISTS ventas CASCADE;
DROP TABLE IF EXISTS sesiones_live CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS vendedores CASCADE;

DROP TYPE IF EXISTS rol_vendedor CASCADE;
DROP TYPE IF EXISTS tipo_cliente CASCADE;
DROP TYPE IF EXISTS estado_venta CASCADE;
DROP TYPE IF EXISTS metodo_pago CASCADE;
DROP TYPE IF EXISTS tipo_movimiento CASCADE;

-- 3. TIPOS ENUM
CREATE TYPE rol_vendedor AS ENUM ('vendedor', 'admin');
CREATE TYPE tipo_cliente AS ENUM ('premium', 'normal', 'conflictivo');
CREATE TYPE estado_venta AS ENUM ('completada', 'cancelada', 'pendiente');
CREATE TYPE metodo_pago AS ENUM ('efectivo', 'transferencia', 'tarjeta', 'deposito');
CREATE TYPE tipo_movimiento AS ENUM ('entrada', 'salida', 'ajuste');

-- 4. TABLAS PRINCIPALES

-- 4.1 Vendedores
CREATE TABLE vendedores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  email TEXT UNIQUE,
  color_identificador TEXT DEFAULT '#3B82F6',
  pin_auth TEXT NOT NULL, -- 4 dígitos
  rol rol_vendedor DEFAULT 'vendedor',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.2 Categorías de Productos
CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  orden_visual INTEGER DEFAULT 0
);

-- 4.3 Productos de Joyería
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria_id UUID REFERENCES categorias(id),
  precio NUMERIC(10,2) NOT NULL,
  stock INTEGER DEFAULT 0 NOT NULL,
  foto_url TEXT,
  palabras_clave TEXT[], -- Array para búsquedas rápidas GIN
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4.4 Clientes
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  tipo_cliente tipo_cliente DEFAULT 'normal',
  notas TEXT,
  total_compras NUMERIC(10,2) DEFAULT 0,
  numero_compras INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.5 Sesiones Live (Streaming de Ventas)
CREATE TABLE sesiones_live (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendedor_id UUID REFERENCES vendedores(id) NOT NULL,
  nombre_sesion TEXT,
  color_sesion TEXT,
  fecha_inicio TIMESTAMPTZ DEFAULT now(),
  fecha_fin TIMESTAMPTZ,
  activa BOOLEAN DEFAULT true,
  total_ventas_sesion NUMERIC(10,2) DEFAULT 0
);

-- 4.6 Ventas (Tickets)
CREATE TABLE ventas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio TEXT UNIQUE, -- V-YYYYMMDD-NNN
  sesion_id UUID REFERENCES sesiones_live(id),
  vendedor_id UUID REFERENCES vendedores(id) NOT NULL,
  cliente_id UUID REFERENCES clientes(id),
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  descuento NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  metodo_pago metodo_pago,
  estado estado_venta DEFAULT 'completada',
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.7 Detalles de Venta (Productos por Ticket)
CREATE TABLE venta_detalles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venta_id UUID REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL
);

-- 4.8 Historial de Movimientos de Stock
CREATE TABLE movimientos_stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID REFERENCES productos(id),
  tipo_movimiento tipo_movimiento,
  cantidad INTEGER NOT NULL,
  motivo TEXT,
  venta_id UUID REFERENCES ventas(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. FUNCIONES Y TRIGGERS (Reglas de Negocio)

-- 5.1 Actualizar Updated_At en Productos
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_productos_timestamp
  BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 5.2 Generar Folio Automático para Venta
CREATE OR REPLACE FUNCTION generar_folio_venta() RETURNS TRIGGER AS $$
DECLARE
  prefijo TEXT;
  siguiente_secuencia INTEGER;
BEGIN
  IF NEW.folio IS NULL THEN
    -- Formato: V-YYYYMMDD-
    prefijo := 'V-' || to_char(now() AT TIME ZONE 'UTC', 'YYYYMMDD') || '-';
    
    -- Encontrar el número máximo del día de hoy
    SELECT COALESCE(MAX(NULLIF(regexp_replace(folio, '^.*-', ''), '')), '0')::INTEGER + 1
    INTO siguiente_secuencia
    FROM ventas
    WHERE folio LIKE prefijo || '%';
    
    -- Asignar el folio con 3 dígitos ej: V-20240302-001
    NEW.folio := prefijo || lpad(siguiente_secuencia::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generar_folio
  BEFORE INSERT ON ventas
  FOR EACH ROW EXECUTE FUNCTION generar_folio_venta();

-- 5.3 Actualizar Totales en Ventas (al modificar detalles)
CREATE OR REPLACE FUNCTION actualizar_totales_venta() RETURNS TRIGGER AS $$
DECLARE
  v_venta_id UUID;
BEGIN
  v_venta_id := COALESCE(NEW.venta_id, OLD.venta_id);
  
  UPDATE ventas 
  SET subtotal = (SELECT COALESCE(SUM(subtotal), 0) FROM venta_detalles WHERE venta_id = v_venta_id),
      total = (SELECT COALESCE(SUM(subtotal), 0) FROM venta_detalles WHERE venta_id = v_venta_id) - descuento
  WHERE id = v_venta_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_totales
  AFTER INSERT OR UPDATE OR DELETE ON venta_detalles
  FOR EACH ROW EXECUTE FUNCTION actualizar_totales_venta();

-- 5.4 Actualizar Stock y Registrar Movimientos al insertar un Detalle de Venta
CREATE OR REPLACE FUNCTION decrementar_stock_por_venta() RETURNS TRIGGER AS $$
BEGIN
  -- Decrementar en Productos
  UPDATE productos SET stock = stock - NEW.cantidad WHERE id = NEW.producto_id;
  
  -- Registrar Log en movimientos
  INSERT INTO movimientos_stock (producto_id, tipo_movimiento, cantidad, motivo, venta_id)
  VALUES (NEW.producto_id, 'salida', -NEW.cantidad, 'Automático por Venta', NEW.venta_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_decrementar_stock
  AFTER INSERT ON venta_detalles
  FOR EACH ROW EXECUTE FUNCTION decrementar_stock_por_venta();

-- 5.5 Revertir Stock al cancelar una Venta
CREATE OR REPLACE FUNCTION revertir_stock_cancelacion() RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.estado != 'cancelada' AND NEW.estado = 'cancelada') THEN
    -- Regresar stock a cada producto
    UPDATE productos p
    SET stock = stock + vd.cantidad
    FROM venta_detalles vd
    WHERE p.id = vd.producto_id AND vd.venta_id = NEW.id;
    
    -- Registrar Log de entrada
    INSERT INTO movimientos_stock (producto_id, tipo_movimiento, cantidad, motivo, venta_id)
    SELECT vd.producto_id, 'entrada', vd.cantidad, 'Venta Cancelada: ' || NEW.folio, NEW.id
    FROM venta_detalles vd WHERE vd.venta_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_revertir_stock
  AFTER UPDATE OF estado ON ventas
  FOR EACH ROW EXECUTE FUNCTION revertir_stock_cancelacion();

-- 5.6 Actualizar Estadísticas de Clientes
CREATE OR REPLACE FUNCTION actualizar_estadisticas_cliente() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.estado = 'completada' AND NEW.cliente_id IS NOT NULL THEN
    UPDATE clientes 
    SET total_compras = total_compras + NEW.total, numero_compras = numero_compras + 1
    WHERE id = NEW.cliente_id;
  
  ELSIF TG_OP = 'UPDATE' AND OLD.estado != 'completada' AND NEW.estado = 'completada' AND NEW.cliente_id IS NOT NULL THEN
    UPDATE clientes 
    SET total_compras = total_compras + NEW.total, numero_compras = numero_compras + 1
    WHERE id = NEW.cliente_id;
  
  ELSIF TG_OP = 'UPDATE' AND OLD.estado = 'completada' AND NEW.estado = 'cancelada' AND NEW.cliente_id IS NOT NULL THEN
    UPDATE clientes 
    SET total_compras = GREATEST(0, total_compras - NEW.total), numero_compras = GREATEST(0, numero_compras - 1)
    WHERE id = NEW.cliente_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_estadisticas_cliente
  AFTER INSERT OR UPDATE OF estado ON ventas
  FOR EACH ROW EXECUTE FUNCTION actualizar_estadisticas_cliente();

-- 5.7 Actualizar total de la sesión Live activa
CREATE OR REPLACE FUNCTION actualizar_sesion_live() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'completada' AND NEW.sesion_id IS NOT NULL THEN
    UPDATE sesiones_live SET total_ventas_sesion = total_ventas_sesion + NEW.total WHERE id = NEW.sesion_id;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.estado = 'completada' AND NEW.estado = 'cancelada' AND NEW.sesion_id IS NOT NULL THEN
    UPDATE sesiones_live SET total_ventas_sesion = GREATEST(0, total_ventas_sesion - NEW.total) WHERE id = NEW.sesion_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sesion_live
  AFTER INSERT OR UPDATE OF estado ON ventas
  FOR EACH ROW EXECUTE FUNCTION actualizar_sesion_live();

-- 6. ÍNDICES DE RENDIMIENTO BÚSQUEDA
CREATE INDEX idx_productos_codigo ON productos(codigo);
CREATE INDEX idx_productos_palabras_clave ON productos USING GIN (palabras_clave);
CREATE INDEX idx_clientes_telefono ON clientes(telefono);
CREATE INDEX idx_clientes_tipo ON clientes(tipo_cliente);
CREATE INDEX idx_ventas_vendedor_fecha ON ventas(vendedor_id, created_at);
CREATE INDEX idx_ventas_sesion ON ventas(sesion_id);

-- 7. POLÍTICAS ROW LEVEL SECURITY (RLS)
-- Como el grueso de la lógica fuerte sucederá en las Edge Functions y el frontend consumirá ciertas API directamente:
-- (Habilitamos RLS, pero permitimos acceso general sabiendo que Edge Functions usará 'service_role' de bypass,
--  o se podrá ajustar con custom JWT claims).

ALTER TABLE vendedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones_live ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE venta_detalles ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_stock ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo rápido Frontend (Asumiendo validación en aplicación o API).
CREATE POLICY "Public Read Access" ON vendedores FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON categorias FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON productos FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON clientes FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON sesiones_live FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON ventas FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON venta_detalles FOR SELECT USING (true);

-- Inserciones permitidas temporalmente de forma anónima para que Frontend funcione antes del JWT estricto
CREATE POLICY "Public Insert Access" ON clientes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Access" ON ventas FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Access" ON venta_detalles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Access" ON sesiones_live FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Access" ON sesiones_live FOR UPDATE USING (true);
CREATE POLICY "Public Update Access" ON ventas FOR UPDATE USING (true);


-- 8. DATOS DE PRUEBA (SEED)
INSERT INTO vendedores (id, nombre, email, color_identificador, pin_auth, rol, activo) VALUES
(uuid_generate_v4(), 'Ana', 'ana@joyeria.com', '#EF4444', '1111', 'vendedor', true),
(uuid_generate_v4(), 'Luis', 'luis@joyeria.com', '#3B82F6', '2222', 'vendedor', true),
(uuid_generate_v4(), 'María', 'maria@joyeria.com', '#10B981', '3333', 'vendedor', true),
(uuid_generate_v4(), 'Dueño', 'admin@joyeria.com', '#64748B', '9999', 'admin', true);

-- Bloque PL/pgSQL para poblar dinámicamente dependencias sin hardcodear UUIDs
DO $$
DECLARE
  cat_anillos UUID := uuid_generate_v4();
  cat_collares UUID := uuid_generate_v4();
  cat_pulseras UUID := uuid_generate_v4();
  cat_aretes UUID := uuid_generate_v4();
  cat_sets UUID := uuid_generate_v4();
BEGIN
  -- Insertar Categorías
  INSERT INTO categorias (id, nombre, descripcion, orden_visual) VALUES
  (cat_anillos, 'Anillos', 'Anillos de plata .925 y pedrería', 1),
  (cat_collares, 'Collares', 'Cadenas, dijes y gargantillas', 2),
  (cat_pulseras, 'Pulseras', 'Esclavas, pulseras y brazaletes', 3),
  (cat_aretes, 'Aretes', 'Arracadas y broqueles', 4),
  (cat_sets, 'Sets', 'Juegos completos de plata', 5);

  -- Insertar Productos
  INSERT INTO productos (codigo, nombre, descripcion, categoria_id, precio, stock, palabras_clave, foto_url) VALUES
  ('PLT-001', 'Anillo Compromiso Zirconia', 'Anillo plata con zirconia central', cat_anillos, 1250.00, 10, ARRAY['anillo', 'zirconia', 'compromiso'], 'https://via.placeholder.com/400?text=Anillo+Zirconia'),
  ('PLT-002', 'Dije Gota Plata', 'Dije elegante en forma de gota', cat_collares, 850.00, 5, ARRAY['dije', 'gota', 'collar'], 'https://via.placeholder.com/400?text=Dije+Gota'),
  ('PLT-003', 'Argolla Lisa 4mm', 'Argolla clásica de plata .925', cat_anillos, 450.00, 20, ARRAY['argolla', 'lisa', 'anillo'], 'https://via.placeholder.com/400?text=Argolla+Lisa'),
  ('PLT-004', 'Pulsera Tejido Bizantino', 'Pulsera de eslabones gruesos', cat_pulseras, 1800.00, 3, ARRAY['pulsera', 'bizantino', 'tejido'], 'https://via.placeholder.com/400?text=Pulsera+Bizantina'),
  ('PLT-005', 'Arracadas Huggies', 'Aretes tipo huggies con pedrería', cat_aretes, 650.00, 15, ARRAY['aretes', 'arracadas', 'huggies'], 'https://via.placeholder.com/400?text=Arracadas+Huggies');
END $$;

INSERT INTO clientes (nombre, telefono, email, tipo_cliente) VALUES
('Carlos Perez', '5551234567', 'carlos@demo.com', 'normal'),
('Elena Rivas', '5559876543', 'elena@demo.com', 'premium'),
('Sofia Gomez', '5554567890', 'sofia@demo.com', 'conflictivo');
