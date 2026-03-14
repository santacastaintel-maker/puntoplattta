import { useState, useCallback } from 'react';
import { db } from '../lib/db';
import { NuevaVentaPayload, Venta, FiltroVentas, VentaDetalle } from '../types';

export const useVentas = (token?: string | null) => {
    const [ventas, setVentas] = useState<Venta[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getMisVentas = useCallback(async (filtros: FiltroVentas, vendedorId: string) => {
        try {
            setLoading(true);
            setError(null);

            let query = db.ventas.where('vendedor_id').equals(vendedorId);
            let data = await query.toArray();

            if (filtros.sesion_id) {
                data = data.filter(v => v.sesion_id === filtros.sesion_id);
            }
            if (filtros.fecha_desde) {
                const desde = new Date(filtros.fecha_desde).getTime();
                data = data.filter(v => new Date(v.created_at).getTime() >= desde);
            }
            if (filtros.fecha_hasta) {
                const hasta = new Date(filtros.fecha_hasta).getTime() + 86400000; // Al final del día
                data = data.filter(v => new Date(v.created_at).getTime() < hasta);
            }

            data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setVentas(data);
            return data;
        } catch (err: any) {
            setError(err.message || 'Error al obtener ventas');
            return [];
        } finally {
            setLoading(false);
        }
    }, [token]);

    const crearVenta = useCallback(async (payload: NuevaVentaPayload) => {
        try {
            setLoading(true);
            setError(null);

            const nuevaVenta: Venta = await db.transaction('rw', db.ventas, db.venta_detalles, db.productos, db.clientes, async () => {
                const count = await db.ventas.count();
                const folio = `FOLIO-${String(count + 1).padStart(5, '0')}`;
                const ventaId = crypto.randomUUID();

                const esApartado = payload.metodo_pago === null && (payload as any).esApartado === true;

                const vData: Venta = {
                    id: ventaId,
                    folio,
                    sesion_id: payload.sesion_id,
                    vendedor_id: payload.vendedor_id,
                    cliente_id: payload.cliente_id,
                    subtotal: payload.subtotal,
                    descuento: payload.descuento,
                    total: payload.total,
                    monto_abonado: (payload as any).monto_abonado || (esApartado ? 0 : payload.total),
                    metodo_pago: payload.metodo_pago,
                    estado: esApartado ? 'apartado' : 'completada',
                    notas: payload.notas || null,
                    created_at: new Date().toISOString()
                };

                await db.ventas.add(vData);

                if (payload.detalles && payload.detalles.length > 0) {
                    for (const det of payload.detalles) {
                        const dData: VentaDetalle = {
                            id: crypto.randomUUID(),
                            venta_id: ventaId,
                            producto_id: det.producto_id!,
                            cantidad: det.cantidad!,
                            precio_unitario: det.precio_unitario!,
                            subtotal: det.subtotal!
                        };
                        await db.venta_detalles.add(dData);

                        const prod = await db.productos.get(det.producto_id!);
                        if (prod) {
                            await db.productos.update(prod.id, {
                                stock: Math.max(0, prod.stock - det.cantidad!)
                            });
                        }
                    }
                }

                // Update client stats
                if (payload.cliente_id) {
                    const cliente = await db.clientes.get(payload.cliente_id);
                    if (cliente) {
                        const updates: any = {};
                        if (esApartado) {
                            updates.apartados_pendientes = (cliente.apartados_pendientes || 0) + 1;
                        } else {
                            updates.total_compras = (cliente.total_compras || 0) + payload.total;
                            updates.numero_compras = (cliente.numero_compras || 0) + 1;
                        }
                        await db.clientes.update(payload.cliente_id, updates);
                    }
                }

                return vData;
            });

            return nuevaVenta;

        } catch (err: any) {
            setError(err.message || 'Error al completar la venta');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [token]);


    const cancelarVenta = useCallback(async (ventaId: string) => {
        try {
            setLoading(true);
            setError(null);

            const res = await db.transaction('rw', db.ventas, db.venta_detalles, db.productos, db.clientes, async () => {
                const venta = await db.ventas.get(ventaId);
                if (!venta || venta.estado === 'cancelada') return null;

                const wasApartado = venta.estado === 'apartado';
                await db.ventas.update(ventaId, { estado: 'cancelada' });

                // Restore stock
                const detalles = await db.venta_detalles.where('venta_id').equals(ventaId).toArray();
                for (const det of detalles) {
                    const prod = await db.productos.get(det.producto_id);
                    if (prod) {
                        await db.productos.update(prod.id, {
                            stock: prod.stock + det.cantidad
                        });
                    }
                }

                // Update client stats (semáforo)
                if (venta.cliente_id) {
                    const cliente = await db.clientes.get(venta.cliente_id);
                    if (cliente) {
                        const updates: any = {
                            cancelaciones: (cliente.cancelaciones || 0) + 1
                        };
                        if (wasApartado) {
                            updates.apartados_pendientes = Math.max(0, (cliente.apartados_pendientes || 0) - 1);
                        }
                        await db.clientes.update(venta.cliente_id, updates);
                    }
                }

                return venta;
            });

            if (!res) throw new Error("No se pudo cancelar la venta");

            setVentas(prev => prev.map(v => v.id === ventaId ? { ...v, estado: 'cancelada' } : v));
            return res;

        } catch (err: any) {
            setError(err.message || 'Error al cancelar la venta');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [token]);

    return {
        ventas,
        loading,
        error,
        getMisVentas,
        crearVenta,
        cancelarVenta
    };
};
