import { useState, useCallback } from 'react';
import { db } from '../lib/db';
import { Producto, FiltrosProductos } from '../types';

export const useProductos = () => {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const buscarProductos = useCallback(async (query: string, filtros?: FiltrosProductos) => {
        try {
            setLoading(true);
            setError(null);

            let data: Producto[];
            let q = db.productos.filter(p => !!p.activo);
            if (filtros?.categoria_id) q = q.filter(p => p.categoria_id === filtros.categoria_id);
            data = await q.toArray();
            if (query) {
                const lq = query.toLowerCase();
                data = data.filter(p =>
                    p.codigo.toLowerCase().includes(lq) ||
                    p.nombre.toLowerCase().includes(lq)
                );
            }
            // Enriquecer con categorías locales
            const cats = await db.categorias.toArray();
            const catMap = Object.fromEntries(cats.map(c => [c.id, c]));
            data = data.map(p => ({ ...p, categorias: p.categoria_id ? catMap[p.categoria_id] : undefined }));
            data.sort((a, b) => a.nombre.localeCompare(b.nombre));

            setProductos(data);
            return data;
        } catch (err: any) {
            setError(err.message || 'Error buscando productos');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const getProductoByCodigo = useCallback(async (codigo: string) => {
        try {
            setLoading(true);
            const data = await db.productos.where('codigo').equals(codigo).filter(p => !!p.activo).first();
            if (data?.categoria_id) {
                const cat = await db.categorias.get(data.categoria_id);
                if (cat) data.categorias = cat;
            }
            return data || null;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const crearProducto = useCallback(async (producto: Producto) => {
        try {
            setLoading(true);
            await db.productos.put(producto);
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const actualizarProducto = useCallback(async (id: string, cambios: Partial<Producto>) => {
        try {
            setLoading(true);
            await db.productos.update(id, cambios);
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const eliminarProducto = useCallback(async (id: string) => {
        try {
            setLoading(true);
            await db.productos.update(id, { activo: false });
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        productos,
        loading,
        error,
        buscarProductos,
        getProductoByCodigo,
        crearProducto,
        actualizarProducto,
        eliminarProducto,
    };
};
