import { useState, useCallback } from 'react';
import { api } from '../lib/apiClient';
import { db } from '../lib/db';
import { Cliente } from '../types';

export const useClientes = () => {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const buscarClientes = useCallback(async (query: string) => {
        try {
            setLoading(true);
            setError(null);
            let data: Cliente[];
            if (navigator.onLine) {
                data = await api.clientes.list(query) as Cliente[];
            } else {
                data = await db.clientes.toArray();
                if (query) {
                    const lq = query.toLowerCase();
                    data = data.filter(c =>
                        c.nombre.toLowerCase().includes(lq) ||
                        (c.telefono && c.telefono.includes(query))
                    );
                }
                data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                data = data.slice(0, 20);
            }
            setClientes(data);
            return data;
        } catch (err: any) {
            setError(err.message || 'Error al buscar clientes');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const getClienteById = useCallback(async (id: string) => {
        try {
            setLoading(true);
            if (navigator.onLine) {
                return await api.clientes.get(id) as Cliente;
            }
            return await db.clientes.get(id) || null;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const crearCliente = useCallback(async (payload: { nombre: string; telefono?: string; email?: string }) => {
        try {
            setLoading(true);
            setError(null);
            const cliente = await api.clientes.create(payload) as Cliente;
            await db.clientes.put(cliente);
            return cliente;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getHistorialCliente = useCallback(async (id: string) => {
        try {
            setLoading(true);
            if (navigator.onLine) {
                return await api.clientes.historial(id);
            }
            const ventas = await db.ventas.where('cliente_id').equals(id).toArray();
            return ventas.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    return { clientes, loading, error, buscarClientes, getClienteById, crearCliente, getHistorialCliente };
};
