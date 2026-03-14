import { useState, useCallback, useEffect } from 'react';
import { db } from '../lib/db';
import { Categoria } from '../types';

export const useCategorias = () => {
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCategorias = useCallback(async () => {
        try {
            setLoading(true);
            const data = await db.categorias.orderBy('orden_visual').toArray();
            setCategorias(data);
            return data;
        } catch (err: any) {
            setError(err.message || 'Error al cargar categorías');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Cargar inicialmente
    useEffect(() => {
        fetchCategorias();
    }, [fetchCategorias]);

    const crearCategoria = useCallback(async (categoria: Omit<Categoria, 'id'>) => {
        try {
            setLoading(true);
            const newId = crypto.randomUUID();
            const newCat = { ...categoria, id: newId };
            await db.categorias.add(newCat);
            await fetchCategorias();
            return { success: true, data: newCat };
        } catch (err: any) {
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [fetchCategorias]);

    const actualizarCategoria = useCallback(async (id: string, cambios: Partial<Categoria>) => {
        try {
            setLoading(true);
            await db.categorias.update(id, cambios);
            await fetchCategorias();
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [fetchCategorias]);

    const eliminarCategoria = useCallback(async (id: string) => {
        try {
            setLoading(true);
            await db.categorias.delete(id);
            // También habría que desenlazar productos... 
            // Para simplificar, lo dejamos así por ahora o actualizamos en cascada
            await fetchCategorias();
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [fetchCategorias]);

    return {
        categorias,
        loading,
        error,
        fetchCategorias,
        crearCategoria,
        actualizarCategoria,
        eliminarCategoria
    };
};
