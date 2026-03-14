import { useState, useCallback } from 'react';
import { db } from '../lib/db';
import { Producto, FiltrosProductos, Categoria } from '../types';

export const useProductos = () => {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const buscarProductos = useCallback(async (query: string, filtros?: FiltrosProductos) => {
        try {
            setLoading(true);
            setError(null);

            // Obtener productos activos
            let queryDexie = db.productos.filter(p => !!p.activo);

            // Aplicar filtros
            if (filtros?.categoria_id) {
                queryDexie = queryDexie.filter(p => p.categoria_id === filtros.categoria_id);
            }
            if (filtros?.stock_minimo !== undefined) {
                queryDexie = queryDexie.filter(p => p.stock >= filtros.stock_minimo!);
            }

            let data = await queryDexie.toArray();

            // Filtrado por texto (búsqueda)
            if (query) {
                const lowerQuery = query.toLowerCase();
                data = data.filter(p =>
                    p.codigo.toLowerCase().includes(lowerQuery) ||
                    p.nombre.toLowerCase().includes(lowerQuery)
                );
            }

            // Ordenar por nombre
            data.sort((a, b) => a.nombre.localeCompare(b.nombre));

            // Poblar categorías reales
            const categoriasData = await db.categorias.toArray();
            const catMap = categoriasData.reduce((acc, cat) => {
                acc[cat.id] = cat;
                return acc;
            }, {} as Record<string, Categoria>);

            const dataWithCategories = data.map(p => ({
                ...p,
                categorias: p.categoria_id ? catMap[p.categoria_id] : undefined
            }));

            setProductos(dataWithCategories);
            return dataWithCategories;
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

            if (!data) return null;

            if (data.categoria_id) {
                const categoria = await db.categorias.get(data.categoria_id);
                if (categoria) {
                    data.categorias = categoria;
                }
            }

            return data;
        } catch (err: any) {
            setError(err.message || 'Producto no encontrado');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const crearProducto = useCallback(async (producto: Producto) => {
        try {
            setLoading(true);
            await db.productos.add(producto);
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
        eliminarProducto
    };
};
