import { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { BarChart3, TrendingUp, Package, Users, DollarSign, Calendar } from 'lucide-react';

export const EstadisticasViewer = () => {
    const [stats, setStats] = useState({
        ventasHoy: 0,
        ingresosHoy: 0,
        productosTotales: 0,
        clientesTotales: 0,
        topProductos: [] as { nombre: string; cantidad: number; total: number }[]
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarEstadisticas();
    }, []);

    const cargarEstadisticas = async () => {
        try {
            setLoading(true);

            // Obtener datos básicos
            const productos = await db.productos.count();
            const clientes = await db.clientes.count();

            // Ventas de hoy
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            const ventasTotales = await db.ventas.toArray();
            const ventasHoy = ventasTotales.filter(v =>
                v.estado === 'completada' && new Date(v.created_at) >= hoy
            );

            const ingresosHoy = ventasHoy.reduce((sum, v) => sum + v.total, 0);

            // Analizar Top Productos (considerando todas las ventas completadas)
            const detalles = await db.venta_detalles.toArray();
            const ventasCompletadasIds = new Set(ventasTotales.filter(v => v.estado === 'completada').map(v => v.id));

            const productosVendidos = new Map<string, { cantidad: number; total: number }>();

            for (const detalle of detalles) {
                if (detalle.venta_id && ventasCompletadasIds.has(detalle.venta_id)) {
                    const actual = productosVendidos.get(detalle.producto_id) || { cantidad: 0, total: 0 };
                    productosVendidos.set(detalle.producto_id, {
                        cantidad: actual.cantidad + detalle.cantidad,
                        total: actual.total + (detalle.precio_unitario * detalle.cantidad)
                    });
                }
            }

            // Mapear IDs a Nombres
            const topList = await Promise.all(
                Array.from(productosVendidos.entries())
                    .sort((a, b) => b[1].cantidad - a[1].cantidad)
                    .slice(0, 5)
                    .map(async ([id, datos]) => {
                        const prod = id ? await db.productos.get(id as string) : null;
                        return {
                            nombre: prod?.nombre || 'Producto Eliminado',
                            cantidad: datos.cantidad,
                            total: datos.total
                        };
                    })
            );

            setStats({
                ventasHoy: ventasHoy.length,
                ingresosHoy,
                productosTotales: productos,
                clientesTotales: clientes,
                topProductos: topList
            });

        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-12 text-center text-slate-500 font-medium animate-pulse">Calculando métricas...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Ingresos Hoy */}
                <div className="bg-olivo-50 rounded-2xl p-6 border border-olivo-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-olivo-100 text-olivo-600 rounded-full flex items-center justify-center shrink-0">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-olivo-800 mb-1">Ingresos Hoy</p>
                        <p className="text-2xl font-black text-olivo-700">${stats.ingresosHoy.toFixed(2)}</p>
                    </div>
                </div>

                {/* Ventas Hoy */}
                <div className="bg-olivo-50 rounded-2xl p-6 border border-olivo-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-olivo-100 text-olivo-600 rounded-full flex items-center justify-center shrink-0">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-olivo-800 mb-1">Tickets Hoy</p>
                        <p className="text-2xl font-black text-olivo-700">{stats.ventasHoy}</p>
                    </div>
                </div>

                {/* Productos */}
                <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-amber-800 mb-1">Catálogo</p>
                        <p className="text-2xl font-black text-amber-700">{stats.productosTotales} Items</p>
                    </div>
                </div>

                {/* Clientes */}
                <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center shrink-0">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-purple-800 mb-1">Clientes</p>
                        <p className="text-2xl font-black text-purple-700">{stats.clientesTotales} Registros</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <BarChart3 className="w-5 h-5 text-slate-400" />
                        <h3 className="text-lg font-bold text-slate-800">Top 5 Productos Más Vendidos</h3>
                    </div>

                    {stats.topProductos.length === 0 ? (
                        <p className="text-center text-slate-400 py-8 text-sm">No hay suficientes datos de ventas completadas.</p>
                    ) : (
                        <div className="space-y-4">
                            {stats.topProductos.map((prod, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs">
                                            #{idx + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-700 text-sm">{prod.nombre}</p>
                                            <p className="text-xs text-slate-500">{prod.cantidad} unidades vendidas</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-olivo-600">${prod.total.toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-olivo-50 rounded-2xl border border-olivo-200 p-6 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-4">
                        <Calendar className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Próximamente</h3>
                    <p className="text-slate-500 text-sm mt-2 max-w-sm">
                        En futuras actualizaciones se añadirán gráficas de ingresos mensuales y corte de caja avanzado.
                    </p>
                </div>
            </div>
        </div>
    );
};
