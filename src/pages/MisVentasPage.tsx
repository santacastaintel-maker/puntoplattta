import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Venta } from '../types';
import { Search, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const MisVentasPage = () => {
    const { isAdmin, vendedorActual } = useAuth();
    const [ventas, setVentas] = useState<(Venta & { vendedorNombre?: string; clienteNombre?: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtroMio, setFiltroMio] = useState(!isAdmin);
    const [query, setQuery] = useState('');

    useEffect(() => {
        cargarVentas();
    }, [filtroMio]);

    const cargarVentas = async () => {
        try {
            setLoading(true);
            let queryData = db.ventas.orderBy('created_at').reverse();

            if (filtroMio && vendedorActual?.id) {
                const results = await db.ventas.where('vendedor_id').equals(vendedorActual.id).reverse().toArray();
                queryData = db.ventas.where('id').anyOf(results.map(r => r.id)) as any;
            }

            const data = await queryData.toArray();

            // Populating vendor and client names manually since it's NoSQL
            const populadas = await Promise.all(
                data.map(async (v) => {
                    const vendedor = await db.vendedores.get(v.vendedor_id);
                    const cliente = v.cliente_id ? await db.clientes.get(v.cliente_id) : null;
                    return {
                        ...v,
                        vendedorNombre: vendedor?.nombre || 'Desconocido',
                        clienteNombre: cliente?.nombre || 'Público General'
                    };
                })
            );

            // local sort by date descending
            populadas.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setVentas(populadas);
        } catch (error) {
            console.error('Error cargando ventas:', error);
        } finally {
            setLoading(false);
        }
    };

    const filtradas = ventas.filter(v =>
        v.folio.toLowerCase().includes(query.toLowerCase()) ||
        (v.clienteNombre && v.clienteNombre.toLowerCase().includes(query.toLowerCase()))
    );

    const totalVendido = filtradas.reduce((sum, v) => v.estado === 'completada' ? sum + v.total : sum, 0);

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-10">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Registro de Ventas</h1>
                    <p className="text-slate-500 text-sm mt-1">Historial de tickets y transacciones locales</p>
                </div>
                {isAdmin && (
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => setFiltroMio(true)}
                            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${filtroMio ? 'bg-white shadow-sm text-olivo-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Mis Ventas
                        </button>
                        <button
                            onClick={() => setFiltroMio(false)}
                            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${!filtroMio ? 'bg-white shadow-sm text-olivo-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Todas las Ventas
                        </button>
                    </div>
                )}
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Header Controls */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por folio o cliente..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-700 outline-none focus:ring-2 focus:ring-olivo-500 transition-all font-mono text-sm"
                            />
                        </div>
                        <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Mostrado</p>
                                <p className="text-2xl font-black text-olivo-600">${totalVendido.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Table / List */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="text-center py-12 text-slate-400 font-medium">Cargando transacciones locales...</div>
                        ) : filtradas.length === 0 ? (
                            <div className="text-center py-20">
                                <FileText className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                                <h3 className="text-lg font-bold text-slate-700">No hay ventas registradas</h3>
                                <p className="text-slate-500 text-sm mt-1">Realiza tu primera venta en el catálogo para verla aquí.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            <th className="px-6 py-4">Folio / Fecha</th>
                                            <th className="px-6 py-4">Cliente</th>
                                            <th className="px-6 py-4 hidden sm:table-cell">Vendedor</th>
                                            <th className="px-6 py-4 text-center">Estado</th>
                                            <th className="px-6 py-4 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filtradas.map(venta => (
                                            <tr key={venta.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-mono font-bold text-slate-800 text-sm">{venta.folio}</div>
                                                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(venta.created_at).toLocaleDateString()} {new Date(venta.created_at).toLocaleTimeString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-slate-700 text-sm">{venta.clienteNombre}</div>
                                                </td>
                                                <td className="px-6 py-4 hidden sm:table-cell">
                                                    <div className="text-sm text-slate-500">{venta.vendedorNombre}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {venta.estado === 'completada' ? (
                                                        <span className="inline-flex flex-col items-center justify-center p-1.5 bg-olivo-50 text-olivo-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                                            <CheckCircle2 className="w-4 h-4 mb-0.5" />
                                                            Completada
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex flex-col items-center justify-center p-1.5 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                                            <XCircle className="w-4 h-4 mb-0.5" />
                                                            Cancelada
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="text-lg font-black text-slate-800">${venta.total.toFixed(2)}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{venta.metodo_pago}</div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
