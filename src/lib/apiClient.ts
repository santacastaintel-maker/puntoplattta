/**
 * apiClient.ts — Cliente HTTP para comunicarse con las Vercel Functions (/api/*)
 * Reemplaza las llamadas directas a Dexie cuando hay conexión a internet.
 */

const BASE = '/api';

// ─── Helpers ────────────────────────────────────────────────────────────────

async function fetchJSON<T>(url: string, opts?: RequestInit): Promise<T> {
    const res = await fetch(url, {
        ...opts,
        headers: { 'Content-Type': 'application/json', ...(opts?.headers || {}) },
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error((err as any).error || `Error ${res.status}`);
    }
    return res.json();
}

const get = <T>(path: string) => fetchJSON<T>(`${BASE}${path}`);
const post = <T>(path: string, body: unknown) =>
    fetchJSON<T>(`${BASE}${path}`, { method: 'POST', body: JSON.stringify(body) });
const patch = <T>(path: string, body: unknown) =>
    fetchJSON<T>(`${BASE}${path}`, { method: 'PATCH', body: JSON.stringify(body) });
const del = <T>(path: string) =>
    fetchJSON<T>(`${BASE}${path}`, { method: 'DELETE' });

// ─── Conectividad ────────────────────────────────────────────────────────────

export const isOnline = () => navigator.onLine;

// ─── Productos ───────────────────────────────────────────────────────────────

export const api = {
    // ── Productos ──
    productos: {
        list: (q = '', filtros: { categoria_id?: string; marca?: string } = {}) => {
            const params = new URLSearchParams({ q });
            if (filtros.categoria_id) params.set('categoria_id', filtros.categoria_id);
            if (filtros.marca) params.set('marca', filtros.marca);
            return get<any[]>(`/productos?${params}`);
        },
        get: (id: string) => get<any>(`/productos?id=${id}`),
        create: (data: any) => post<{ success: boolean; id: string }>('/productos', data),
        update: (id: string, data: Partial<any>) =>
            patch<{ success: boolean }>(`/productos?id=${id}`, data),
        delete: (id: string) => del<{ success: boolean }>(`/productos?id=${id}`),
    },

    // ── Categorías ──
    categorias: {
        list: () => get<any[]>('/categorias'),
        create: (data: any) => post<{ success: boolean }>('/categorias', data),
        update: (id: string, data: any) => patch<{ success: boolean }>(`/categorias?id=${id}`, data),
        delete: (id: string) => del<{ success: boolean }>(`/categorias?id=${id}`),
    },

    // ── Ventas ──
    ventas: {
        list: (vendedor_id: string, filtros: { fecha_desde?: string; fecha_hasta?: string; sesion_id?: string } = {}) => {
            const params = new URLSearchParams({ vendedor_id });
            if (filtros.fecha_desde) params.set('fecha_desde', filtros.fecha_desde);
            if (filtros.fecha_hasta) params.set('fecha_hasta', filtros.fecha_hasta);
            if (filtros.sesion_id) params.set('sesion_id', filtros.sesion_id);
            return get<any[]>(`/ventas?${params}`);
        },
        create: (payload: any) => post<any>('/ventas', payload),
        cancelar: (id: string) => patch<{ success: boolean }>(`/ventas?id=${id}&action=cancelar`, {}),
    },

    // ── Clientes ──
    clientes: {
        list: (q = '') => get<any[]>(`/clientes?q=${encodeURIComponent(q)}`),
        get: (id: string) => get<any>(`/clientes?id=${id}`),
        historial: (id: string) => get<any[]>(`/clientes?id=${id}&historial=true`),
        create: (data: { nombre: string; telefono?: string; email?: string }) =>
            post<any>('/clientes', data),
        update: (id: string, data: any) => patch<{ success: boolean }>(`/clientes?id=${id}`, data),
    },

    // ── Vendedores ──
    vendedores: {
        list: () => get<any[]>('/vendedores'),
        create: (data: any) => post<{ success: boolean }>('/vendedores', data),
        update: (id: string, data: any) => patch<{ success: boolean }>(`/vendedores?id=${id}`, data),
    },

    // ── Config ──
    config: {
        get: () => get<Record<string, string>>('/config'),
        set: (data: Record<string, string>) => post<{ success: boolean }>('/config', data),
    },

    // ── Fotos ──
    photos: {
        /** Sube un File/Blob a R2. Devuelve la key del archivo. */
        upload: async (file: File): Promise<string> => {
            const form = new FormData();
            form.append('file', file);
            const res = await fetch(`${BASE}/upload`, { method: 'POST', body: form });
            if (!res.ok) throw new Error('Error al subir imagen');
            const data = await res.json();
            return data.key as string;
        },
        /** Convierte una key a una URL de imagen (proxy a R2) */
        url: (keyOrUrl: string | null | undefined): string | null => {
            if (!keyOrUrl) return null;
            // Si ya es base64, URL externa o proxy → devolver tal cual
            if (keyOrUrl.startsWith('data:') || keyOrUrl.startsWith('http') || keyOrUrl.startsWith('/api/image')) {
                return keyOrUrl;
            }
            // Si es solo una key (uuid.jpg)
            return `/api/image?key=${encodeURIComponent(keyOrUrl)}`;
        },
    },

    // ── Inicializar BD (admin) ──
    schema: {
        init: () => post<{ success: boolean; message: string }>('/schema', {}),
    },
};

export type ApiClient = typeof api;
