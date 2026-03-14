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

            let data = await db.clientes.toArray();

            if (query) {
                const lowerQuery = query.toLowerCase();
                data = data.filter(c =>
                    c.nombre.toLowerCase().includes(lowerQuery) ||
                    (c.telefono && c.telefono.includes(query))
                );
            }

            data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            // Limit to 20
            const result = data.slice(0, 20);
            setClientes(result);
            return result;
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
            const cliente = await db.clientes.get(id);
            return cliente || null;
        } catch (err: any) {
            setError(err.message || 'Cliente no encontrado');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const crearCliente = useCallback(async (payload: { nombre: string; telefono?: string; email?: string }) => {
        try {
            setLoading(true);
            setError(null);

            // Buscar si ya existe por nombre exacto o teléfono
            const existentes = await db.clientes.toArray();
            const clienteExistente = existentes.find(c =>
                (c.telefono && payload.telefono && c.telefono === payload.telefono) ||
                c.nombre.toLowerCase() === payload.nombre.toLowerCase()
            );

            if (clienteExistente) {
                return clienteExistente;
            }

            const nuevoCliente: Cliente = {
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

            await db.clientes.add(nuevoCliente);
            return nuevoCliente;

        } catch (err: any) {
            setError(err.message || 'Error al crear cliente');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getHistorialCliente = useCallback(async (id: string) => {
        try {
            setLoading(true);

            const ventasCliente = await db.ventas.where('cliente_id').equals(id).toArray();
            ventasCliente.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            return ventasCliente;

        } catch (err: any) {
            setError(err.message || 'Error al obtener historial');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        clientes,
        loading,
        error,
        buscarClientes,
        getClienteById,
        crearCliente,
        getHistorialCliente
    };
};
