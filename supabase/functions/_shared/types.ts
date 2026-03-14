export type Vendedor = {
    id: string;
    nombre: string;
    email: string | null;
    color_identificador: string;
    pin_auth: string;
    rol: 'vendedor' | 'admin';
    activo: boolean;
    created_at: string;
};

export type Categoria = {
    id: string;
    nombre: string;
    descripcion: string | null;
    orden_visual: number;
};

export type Producto = {
    id: string;
    codigo: string;
    nombre: string;
    descripcion: string | null;
    categoria_id: string | null;
    precio: number;
    stock: number;
    foto_url: string | null;
    palabras_clave: string[] | null;
    activo: boolean;
    created_at: string;
    updated_at: string;
};

export type Cliente = {
    id: string;
    nombre: string;
    telefono: string | null;
    email: string | null;
    tipo_cliente: 'premium' | 'normal' | 'conflictivo';
    notas: string | null;
    total_compras: number;
    numero_compras: number;
    created_at: string;
};

export type SesionLive = {
    id: string;
    vendedor_id: string;
    nombre_sesion: string | null;
    color_sesion: string | null;
    fecha_inicio: string;
    fecha_fin: string | null;
    activa: boolean;
    total_ventas_sesion: number;
};

export type Venta = {
    id: string;
    folio: string;
    sesion_id: string | null;
    vendedor_id: string;
    cliente_id: string | null;
    subtotal: number;
    descuento: number;
    total: number;
    metodo_pago: 'efectivo' | 'transferencia' | 'tarjeta' | 'deposito' | null;
    estado: 'completada' | 'cancelada' | 'pendiente';
    notas: string | null;
    created_at: string;
};

export type VentaDetalle = {
    id: string;
    venta_id: string;
    producto_id: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
};

// Error Types
export type ApiError = {
    success: false;
    error: string;
    status: number;
};

// Return Types
export type ApiResponse<T> = {
    success: true;
    data: T;
} | ApiError;
