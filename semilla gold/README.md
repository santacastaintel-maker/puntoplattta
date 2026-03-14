# POS Joyería de Plata 💍

Sistema de Punto de Venta (POS) diseñado específicamente para el mercado de joyería de plata, con enfoque en ventas durante transmisiones en vivo.

## 🚀 Tecnologías

- **Frontend**: React, Vite, TypeScript, Tailwind CSS, Lucide React, Framer Motion.
- **Backend**: Supabase (PostgreSQL, Edge Functions, Storage).
- **PWA**: Instalable en dispositivos móviles para uso rápido en live sales.

## 🛠️ Instalación y Configuración

### 1. Clonar e Instalar Dependencias
```bash
npm install
```

### 2. Configuración de Variables de Entorno
Crea un archivo `.env` en la raíz con tus credenciales de Supabase:
```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

### 3. Base de Datos
Ejecuta los scripts SQL de `supabase/migrations/` en tu SQL Editor de Supabase:
1. `00000_schema.sql` (Esquema base y Seed)
2. `00001_storage.sql` (Políticas de imágenes)

### 4. Edge Functions
Despliega las funciones usando Supabase CLI:
```bash
supabase functions deploy auth-pin
supabase functions deploy productos
supabase functions deploy ventas
supabase functions deploy clientes
supabase functions deploy sesiones-live
supabase functions deploy reportes
```

## 📱 Uso en Móvil (PWA)

El sistema está diseñado para ser usado como una App:
1. Abre la URL en Chrome (Android) o Safari (iOS).
2. Selecciona **"Añadir a pantalla de inicio"**.
3. Acceso rápido mediante **PIN** para cada vendedor.

## 📁 Estructura del Proyecto

- `/src/components`: UI components reutilizables.
- `/src/hooks`: Lógica de consumo de API y autenticación.
- `/src/context`: Estado global (Carrito).
- `/src/pages`: Pantallas principales del sistema.
- `/supabase`: Lógica de servidor y migraciones.

## 🤝 Contribuir
Por favor, asegúrate de correr `npm run lint` antes de enviar cambios.
