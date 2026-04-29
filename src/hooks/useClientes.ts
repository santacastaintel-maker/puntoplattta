import { useState, useCallback } from 'react';
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
            const cliente: Cliente = {
                id: crypto.randomUUID(),
                nombre: payload.nombre,
                telefono: payload.telefono || null,
                email: payload.email || null,
                tipo_cliente: 'normal',
                notas: null,
                total_compras: 0,
                numero_compras: 0,
                apartados_pendientes: 0,
                cancelaciones: 0,
                created_at: new Date().toISOString()
            };
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
