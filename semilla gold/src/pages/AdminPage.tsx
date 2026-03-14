import React, { useState } from 'react';
import { PackageSearch, KeyRound, BarChart3, Copy, CheckCircle2, ShieldCheck, Lock, AlertCircle, Wrench, Download, Upload } from 'lucide-react';
import { cn } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { generateLicenseKey, LicenseType } from '../utils/security';
import { db } from '../lib/db';
import { InventarioManager } from '../components/admin/InventarioManager';
import { EstadisticasViewer } from '../components/admin/EstadisticasViewer';

type Tab = 'inventario' | 'licencias' | 'estadisticas' | 'seguridad' | 'herramientas';

export const AdminPage = () => {
    const [activeTab, setActiveTab] = useState<Tab>('inventario');
    const { changePin, loading, isAdmin } = useAuth();

    // Estado del Generador
    const [businessName, setBusinessName] = useState('');
    const [licenseType, setLicenseType] = useState<LicenseType>('mensual');
    const [generatedKey, setGeneratedKey] = useState('');
    const [keyDetails, setKeyDetails] = useState('');
    const [copied, setCopied] = useState(false);


    const [pinActual, setPinActual] = useState('');
    const [pinNuevo, setPinNuevo] = useState('');
    const [pinConfirma, setPinConfirma] = useState('');
    const [changeError, setChangeError] = useState('');
    const [changeSuccess, setChangeSuccess] = useState('');

    const [multiplierParams, setMultiplierParams] = useState<number>(1.00);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleGenerateKey = (e: React.FormEvent) => {
        e.preventDefault();
        if (!businessName.trim()) return;

        const licenseConfig = generateLicenseKey(businessName, licenseType);
        setGeneratedKey(licenseConfig.key);

        if (licenseConfig.expiresAt) {
            const date = new Date(licenseConfig.expiresAt);
            setKeyDetails(`Válida hasta: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`);
        } else {
            setKeyDetails('Licencia Vitalicia - Sin expiración');
        }
        setCopied(false);
    };

    const handleCopy = () => {
        if (!generatedKey) return;
        navigator.clipboard.writeText(generatedKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleApplyMultiplier = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirm(`¿Estás seguro de multiplicar TODO tu catálogo de productos activos e inactivos por x${multiplierParams}? Esta acción no se puede deshacer de forma sencilla.`)) return;

        try {
            setIsProcessing(true);
            const productos = await db.productos.toArray();
            await db.transaction('rw', db.productos, async () => {
                for (const p of productos) {
                    const nuevoPrecio = parseFloat((p.precio * multiplierParams).toFixed(2));
                    await db.productos.update(p.id, { precio: nuevoPrecio });
                }
            });
            alert('¡Precios actualizados masivamente con éxito!');
        } catch (err: any) {
            alert('Error al aplicar multiplicador: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBackup = async () => {
        try {
            setIsProcessing(true);
            const data = {
                vendedores: await db.vendedores.toArray(),
                categorias: await db.categorias.toArray(),
                productos: await db.productos.toArray(),
                clientes: await db.clientes.toArray(),
                sesiones_live: await db.sesiones_live.toArray(),
                ventas: await db.ventas.toArray(),
                venta_detalles: await db.venta_detalles.toArray(),
            };
            const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `PUNTOPLATA_Backup_${new Date().toISOString().split('T')[0]}.ppdata`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            alert('Error al crear copia de seguridad.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm('ATENCIÓN: Esto SOBRESCRIBIRÁ toda tu base de datos actual y no se podrá deshacer. ¿Deseas continuar?')) {
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                setIsProcessing(true);
                const data = JSON.parse(event.target?.result as string);

                await db.transaction('rw', [db.vendedores, db.categorias, db.productos, db.clientes, db.sesiones_live, db.ventas, db.venta_detalles], async () => {
                    await Promise.all([
                        db.vendedores.clear(),
                        db.categorias.clear(),
                        db.productos.clear(),
                        db.clientes.clear(),
                        db.sesiones_live.clear(),
                        db.ventas.clear(),
                        db.venta_detalles.clear()
                    ]);

                    if (data.vendedores?.length) await db.vendedores.bulkAdd(data.vendedores);
                    if (data.categorias?.length) await db.categorias.bulkAdd(data.categorias);
                    if (data.productos?.length) await db.productos.bulkAdd(data.productos);
                    if (data.clientes?.length) await db.clientes.bulkAdd(data.clientes);
                    if (data.sesiones_live?.length) await db.sesiones_live.bulkAdd(data.sesiones_live);
                    if (data.ventas?.length) await db.ventas.bulkAdd(data.ventas);
                    if (data.venta_detalles?.length) await db.venta_detalles.bulkAdd(data.venta_detalles);
                });

                alert('¡Base de datos restaurada correctamente! La aplicación se reiniciará.');
                window.location.reload();
            } catch (err) {
                alert('Error al restaurar: El archivo PPData parece inválido o corrupto.');
            } finally {
                setIsProcessing(false);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header del Admin */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <h1 className="text-2xl font-bold text-slate-800">Panel de Administración</h1>
                <p className="text-slate-500 text-sm mt-1">Gestión central de PUNTOPLATA</p>

                {/* Tabs */}
                <div className="flex gap-6 mt-6 border-b border-slate-100">
                    <button
                        onClick={() => setActiveTab('inventario')}
                        className={cn(
                            "pb-3 text-sm font-semibold transition-colors flex items-center gap-2 relative",
                            activeTab === 'inventario' ? "text-emerald-600" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <PackageSearch className="w-4 h-4" />
                        Inventario
                        {activeTab === 'inventario' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-t-full"></div>}
                    </button>
                    {isAdmin && (
                        <button
                            onClick={() => setActiveTab('licencias')}
                            className={cn(
                                "pb-3 text-sm font-semibold transition-colors flex items-center gap-2 relative",
                                activeTab === 'licencias' ? "text-emerald-600" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <KeyRound className="w-4 h-4" />
                            Licencias
                            {activeTab === 'licencias' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-t-full"></div>}
                        </button>
                    )}
                    {isAdmin && (
                        <button
                            onClick={() => setActiveTab('estadisticas')}
                            className={cn(
                                "pb-3 text-sm font-semibold transition-colors flex items-center gap-2 relative",
                                activeTab === 'estadisticas' ? "text-emerald-600" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <BarChart3 className="w-4 h-4" />
                            Estadísticas
                            {activeTab === 'estadisticas' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-t-full"></div>}
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('seguridad')}
                        className={cn(
                            "pb-3 text-sm font-semibold transition-colors flex items-center gap-2 relative",
                            activeTab === 'seguridad' ? "text-emerald-600" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <ShieldCheck className="w-4 h-4" />
                        Seguridad
                        {activeTab === 'seguridad' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-t-full"></div>}
                    </button>
                    {isAdmin && (
                        <button
                            onClick={() => setActiveTab('herramientas')}
                            className={cn(
                                "pb-3 text-sm font-semibold transition-colors flex items-center gap-2 relative",
                                activeTab === 'herramientas' ? "text-emerald-600" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <Wrench className="w-4 h-4" />
                            Herramientas (Élite)
                            {activeTab === 'herramientas' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-t-full"></div>}
                        </button>
                    )}
                </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-6">

                {activeTab === 'inventario' && (
                    <InventarioManager />
                )}

                {activeTab === 'estadisticas' && (
                    <EstadisticasViewer />
                )}

                {activeTab === 'licencias' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        {/* Formulalio Generador */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                                    <KeyRound className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800">Generar Nueva Llave</h2>
                                    <p className="text-xs text-slate-500">Master Key Interna Activada.</p>
                                </div>
                            </div>

                            <form onSubmit={handleGenerateKey} className="space-y-4 text-left">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre Exacto del Negocio</label>
                                    <input
                                        type="text"
                                        value={businessName}
                                        onChange={(e) => setBusinessName(e.target.value)}
                                        placeholder="Ej: Joyería Doña Paty"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                                        autoComplete="off"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de Ciclo</label>
                                    <select
                                        value={licenseType}
                                        onChange={(e) => setLicenseType(e.target.value as LicenseType)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                                    >
                                        <option value="mensual">Mensual (30 días)</option>
                                        <option value="vitalicia">Vitalicia (Pago único)</option>
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors mt-2"
                                >
                                    Generar Llave
                                </button>
                            </form>
                        </div>

                        {/* Resultado */}
                        {generatedKey && (
                            <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6 animate-in slide-in-from-bottom-2 fade-in">
                                <h3 className="text-emerald-800 font-bold mb-4">¡Llave Lista para Entrega!</h3>

                                <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm relative group">
                                    <p className="font-mono text-lg font-bold text-emerald-900 break-all pr-12">
                                        {generatedKey}
                                    </p>

                                    <button
                                        onClick={handleCopy}
                                        className="absolute right-3 top-3 p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                                        title="Copiar llave"
                                    >
                                        {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                                    </button>
                                </div>
                                <p className="text-sm font-medium text-emerald-700 mt-3 pl-1">
                                    {keyDetails}
                                </p>

                                <div className="mt-6 pt-6 border-t border-emerald-200/50">
                                    <p className="text-sm text-emerald-800">
                                        📲 <strong>Instrucción para el cliente:</strong><br />
                                        "Abre la aplicación PUNTOPLATA en tu dispositivo, ingresa exactamente como nombre del negocio <span className="font-bold underline">{businessName.trim().toUpperCase()}</span> y pega esta llave de activación."
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'seguridad' && (
                    <div className="max-w-md mx-auto">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800">Cambiar PIN de Acceso</h2>
                                    <p className="text-xs text-slate-500">Actualiza tu código de 4 dígitos.</p>
                                </div>
                            </div>

                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    setChangeError('');
                                    setChangeSuccess('');

                                    if (pinNuevo !== pinConfirma) {
                                        setChangeError('Los nuevos PINs no coinciden.');
                                        return;
                                    }

                                    if (pinNuevo.length !== 4) {
                                        setChangeError('El PIN debe ser de 4 dígitos.');
                                        return;
                                    }

                                    const res = await changePin(pinActual, pinNuevo);
                                    if (res.success) {
                                        setChangeSuccess('PIN actualizado correctamente.');
                                        setPinActual('');
                                        setPinNuevo('');
                                        setPinConfirma('');
                                    } else {
                                        setChangeError(res.error || 'Error al actualizar PIN');
                                    }
                                }}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">PIN Actual</label>
                                    <input
                                        type="password"
                                        maxLength={4}
                                        value={pinActual}
                                        onChange={(e) => setPinActual(e.target.value.replace(/\D/g, ''))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-center text-xl tracking-[0.5em]"
                                        placeholder="****"
                                        required
                                    />
                                </div>

                                <div className="pt-2 border-t border-slate-100">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nuevo PIN (4 dígitos)</label>
                                    <input
                                        type="password"
                                        maxLength={4}
                                        value={pinNuevo}
                                        onChange={(e) => setPinNuevo(e.target.value.replace(/\D/g, ''))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-center text-xl tracking-[0.5em]"
                                        placeholder="****"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Confirmar Nuevo PIN</label>
                                    <input
                                        type="password"
                                        maxLength={4}
                                        value={pinConfirma}
                                        onChange={(e) => setPinConfirma(e.target.value.replace(/\D/g, ''))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-center text-xl tracking-[0.5em]"
                                        placeholder="****"
                                        required
                                    />
                                </div>

                                {changeError && (
                                    <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium">
                                        <AlertCircle className="w-4 h-4" />
                                        {changeError}
                                    </div>
                                )}

                                {changeSuccess && (
                                    <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-medium">
                                        <CheckCircle2 className="w-4 h-4" />
                                        {changeSuccess}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold rounded-xl transition-colors mt-2"
                                >
                                    {loading ? 'Procesando...' : 'Actualizar PIN'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'herramientas' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        {/* Multiplicador de Precio */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                    <Wrench className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800">Multiplicar Precios Gral.</h2>
                                    <p className="text-xs text-slate-500">Ej: Por subida de precio de plata, multiplicar x1.10 (10% más)</p>
                                </div>
                            </div>

                            <form className="space-y-4 text-left" onSubmit={handleApplyMultiplier}>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Factor (Multiplicador)</label>
                                    <input
                                        type="number" step="0.01" min="0.1" value={multiplierParams} onChange={(e) => setMultiplierParams(parseFloat(e.target.value))} required
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <button type="submit" disabled={isProcessing} className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl transition-colors">
                                    {isProcessing ? 'Procesando...' : 'Aplicar Multiplicador Masivo'}
                                </button>
                            </form>
                        </div>

                        {/* Backup y Restauración Local */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800">Copia de Seguridad (Offline)</h2>
                                    <p className="text-xs text-slate-500">Descarga tu información a tu computadora y restáurala si lo necesitas.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={handleBackup}
                                    disabled={isProcessing}
                                    className="w-full py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:bg-slate-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <Download className="w-5 h-5" />
                                    Descargar Copia de Seguridad
                                </button>

                                <div className="relative pt-2">
                                    <div className="absolute inset-x-0 top-1/2 h-px bg-slate-200"></div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-white px-2 text-xs text-slate-400 font-medium">O si cambiaste de equipo</span>
                                    </div>
                                </div>

                                <label className="w-full py-3 bg-white border-2 border-dashed border-emerald-500 hover:bg-emerald-50 text-emerald-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer">
                                    <Upload className="w-5 h-5" />
                                    {isProcessing ? 'Procesando...' : 'Restaurar desde archivo'}
                                    <input type="file" className="hidden" accept=".ppdata,.json" onChange={handleRestore} disabled={isProcessing} />
                                </label>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};
