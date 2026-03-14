import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit3, Trash2, Save, X, Image, Package, Tag, Upload } from 'lucide-react';
import { cn } from '../ui/Button';
import { Producto } from '../../types';
import { db } from '../../lib/db';
import { useCategorias } from '../../hooks/useCategorias';
import { resizeImage } from '../../utils/mediaUtils';
import { BulkPhotoUploader } from './BulkPhotoUploader';

interface ProductoForm {
    codigo: string;
    nombre: string;
    descripcion: string;
    categoria_id: string;
    precio: number;
    stock: number;
    foto_url: string;
}

const EMPTY_FORM: ProductoForm = {
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria_id: '',
    precio: 0,
    stock: 0,
    foto_url: ''
};

export const InventarioManager = () => {
    const { categorias, crearCategoria } = useCategorias();
    const [productos, setProductos] = useState<Producto[]>([]);
    const [filtro, setFiltro] = useState('');
    const [filtroCat, setFiltroCat] = useState('');
    const [loading, setLoading] = useState(false);

    // Modal/Form state
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<ProductoForm>(EMPTY_FORM);
    const [formError, setFormError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Category modal
    const [showCatModal, setShowCatModal] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [showBulkUploader, setShowBulkUploader] = useState(false);

    const fetchProductos = async () => {
        setLoading(true);
        let data = await db.productos.toArray();

        // One-time sync for missing default categories
        const catsExistentes = await db.categorias.toArray();
        if (catsExistentes.length <= 2) {
            const defaults = [
                { id: 'cat-3', nombre: 'Pulseras', orden_visual: 3 },
                { id: 'cat-4', nombre: 'Aretes', orden_visual: 4 },
                { id: 'cat-5', nombre: 'Sets', orden_visual: 5 },
                { id: 'cat-6', nombre: 'Charms', orden_visual: 6 },
                { id: 'cat-7', nombre: 'Esclavas', orden_visual: 7 },
                { id: 'cat-8', nombre: 'Cadenas', orden_visual: 8 },
                { id: 'cat-9', nombre: 'Dijes', orden_visual: 9 },
                { id: 'cat-10', nombre: 'Gargantillas', orden_visual: 10 },
            ];
            for (const d of defaults) {
                if (!catsExistentes.find(c => c.nombre === d.nombre)) {
                    await db.categorias.add({ ...d, descripcion: null });
                }
            }
            window.location.reload(); // Reload once to pick up new categories
            return;
        }

        if (filtroCat) {
            data = data.filter(p => p.categoria_id === filtroCat);
        }
        if (filtro) {
            const q = filtro.toLowerCase();
            data = data.filter(p =>
                p.nombre.toLowerCase().includes(q) ||
                p.codigo.toLowerCase().includes(q)
            );
        }

        data.sort((a, b) => a.nombre.localeCompare(b.nombre));
        setProductos(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchProductos();
    }, [filtro, filtroCat]);

    const handleOpenNew = () => {
        setEditingId(null);
        setForm({ ...EMPTY_FORM, codigo: `PP-${Date.now().toString(36).toUpperCase()}` });
        setFormError('');
        setShowForm(true);
    };

    const handleEdit = (p: Producto) => {
        setEditingId(p.id);
        setForm({
            codigo: p.codigo,
            nombre: p.nombre,
            descripcion: p.descripcion || '',
            categoria_id: p.categoria_id || '',
            precio: p.precio,
            stock: p.stock,
            foto_url: p.foto_url || ''
        });
        setFormError('');
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este producto? Se marcará como inactivo.')) return;
        await db.productos.update(id, { activo: false });
        fetchProductos();
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const resized = await resizeImage(file, 400, 400, 0.8);
            // Convert blob to base64 for local storage
            const reader = new FileReader();
            reader.onloadend = () => {
                setForm(prev => ({ ...prev, foto_url: reader.result as string }));
            };
            reader.readAsDataURL(resized);
        } catch (err) {
            // Fallback: read original
            const reader = new FileReader();
            reader.onloadend = () => {
                setForm(prev => ({ ...prev, foto_url: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!form.nombre.trim() || !form.codigo.trim()) {
            setFormError('Nombre y Código son obligatorios.');
            return;
        }
        if (form.precio <= 0) {
            setFormError('El precio debe ser mayor a 0.');
            return;
        }

        try {
            if (editingId) {
                await db.productos.update(editingId, {
                    codigo: form.codigo,
                    nombre: form.nombre,
                    descripcion: form.descripcion || null,
                    categoria_id: form.categoria_id || null,
                    precio: form.precio,
                    stock: form.stock,
                    foto_url: form.foto_url || null,
                });
            } else {
                await db.productos.add({
                    id: crypto.randomUUID(),
                    codigo: form.codigo,
                    nombre: form.nombre,
                    descripcion: form.descripcion || null,
                    categoria_id: form.categoria_id || null,
                    precio: form.precio,
                    stock: form.stock,
                    foto_url: form.foto_url || null,
                    palabras_clave: null,
                    activo: true,
                });
            }
            setShowForm(false);
            fetchProductos();
        } catch (err: any) {
            setFormError(err.message || 'Error al guardar.');
        }
    };

    const handleAddCategory = async () => {
        if (!newCatName.trim()) return;
        await crearCategoria({ nombre: newCatName.trim(), descripcion: null, orden_visual: categorias.length + 1 });
        setNewCatName('');
        setShowCatModal(false);
    };

    const getCategoryName = (catId: string | null) => {
        if (!catId) return 'Sin categoría';
        return categorias.find(c => c.id === catId)?.nombre || 'Sin categoría';
    };

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex gap-2 flex-1 w-full sm:w-auto">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o código..."
                            value={filtro}
                            onChange={e => setFiltro(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                    <select
                        value={filtroCat}
                        onChange={e => setFiltroCat(e.target.value)}
                        className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                        <option value="">Todas las categorías</option>
                        {categorias.map(c => (
                            <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setShowCatModal(true)}
                        className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                        <Tag className="w-4 h-4" /> Categorías
                    </button>
                    <button
                        onClick={() => setShowBulkUploader(true)}
                        className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <Upload className="w-4 h-4" /> 📸 Subida Masiva
                    </button>
                    <button
                        onClick={handleOpenNew}
                        className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Nuevo Producto
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                    <p className="text-2xl font-black text-slate-800">{productos.length}</p>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Productos visibles</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                    <p className="text-2xl font-black text-emerald-600">{categorias.length}</p>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Categorías</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                    <p className="text-2xl font-black text-blue-600">{productos.reduce((s, p) => s + p.stock, 0)}</p>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Piezas en Stock</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                    <p className="text-2xl font-black text-amber-600">${productos.reduce((s, p) => s + (p.precio * p.stock), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Valor inventario</p>
                </div>
            </div>

            {/* Product Grid */}
            {loading ? (
                <div className="text-center py-12 text-slate-400">Cargando...</div>
            ) : productos.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-700">Sin productos todavía</h3>
                    <p className="text-slate-500 text-sm mt-1 mb-4">Haz clic en "Nuevo Producto" para añadir tu primera joya.</p>
                    <button onClick={handleOpenNew} className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-colors">
                        <Plus className="w-4 h-4 inline mr-1" /> Agregar
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {productos.filter(p => p.activo).map(p => (
                        <div key={p.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden group hover:shadow-lg transition-shadow">
                            {/* Image */}
                            <div className="aspect-square bg-slate-100 relative overflow-hidden">
                                {p.foto_url ? (
                                    <img src={p.foto_url} alt={p.nombre} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Package className="w-12 h-12 text-slate-300" />
                                    </div>
                                )}
                                {/* Actions overlay */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <button onClick={() => handleEdit(p)} className="p-2.5 bg-white rounded-full text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors shadow-lg">
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(p.id)} className="p-2.5 bg-white rounded-full text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition-colors shadow-lg">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                {/* Stock badge */}
                                <div className={cn(
                                    "absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold",
                                    p.stock > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                )}>
                                    {p.stock > 0 ? `${p.stock} pzas` : 'Agotado'}
                                </div>
                            </div>
                            {/* Info */}
                            <div className="p-4">
                                <p className="text-xs font-mono text-slate-400 mb-1">{p.codigo}</p>
                                <h4 className="font-bold text-slate-800 truncate">{p.nombre}</h4>
                                <p className="text-xs text-slate-500 mt-0.5">{getCategoryName(p.categoria_id)}</p>
                                <p className="text-lg font-black text-emerald-600 mt-2">${p.precio.toFixed(2)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ===== MODAL: Producto Form ===== */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800">{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Image preview + upload */}
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-emerald-400 transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {form.foto_url ? (
                                        <img src={form.foto_url} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <Image className="w-8 h-8 text-slate-400" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                                    >
                                        {form.foto_url ? 'Cambiar Imagen' : 'Subir Imagen'}
                                    </button>
                                    <p className="text-xs text-slate-400 mt-1">JPG, PNG. Se redimensiona a 400px automáticamente.</p>
                                </div>
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            </div>

                            {/* Código */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Código (SKU)</label>
                                <input
                                    type="text"
                                    value={form.codigo}
                                    onChange={e => setForm({ ...form, codigo: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-mono"
                                    placeholder="PP-001"
                                />
                            </div>

                            {/* Nombre */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre del Producto</label>
                                <input
                                    type="text"
                                    value={form.nombre}
                                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                                    placeholder="Anillo de Plata 925 con Zirconia"
                                />
                            </div>

                            {/* Descripción */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Descripción (opcional)</label>
                                <textarea
                                    value={form.descripcion}
                                    onChange={e => setForm({ ...form, descripcion: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm resize-none"
                                    placeholder="Descripción breve..."
                                />
                            </div>

                            {/* Categoría */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Categoría</label>
                                <select
                                    value={form.categoria_id}
                                    onChange={e => setForm({ ...form, categoria_id: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                                >
                                    <option value="">Seleccionar...</option>
                                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                </select>
                            </div>

                            {/* Precio + Stock */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Precio ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={form.precio === 0 ? '' : form.precio}
                                        onFocus={e => e.target.select()}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setForm({ ...form, precio: parseFloat(val) || 0 });
                                        }}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold text-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Stock (piezas)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.stock === 0 ? '' : form.stock}
                                        onFocus={e => e.target.select()}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setForm({ ...form, stock: parseInt(val) || 0 });
                                        }}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold text-slate-800"
                                    />
                                </div>
                            </div>

                            {formError && (
                                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium">{formError}</div>
                            )}
                        </div>

                        <div className="p-6 border-t border-slate-100 flex gap-3">
                            <button
                                onClick={() => setShowForm(false)}
                                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {editingId ? 'Guardar Cambios' : 'Crear Producto'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== MODAL: Categorías ===== */}
            {showCatModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCatModal(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800">Categorías</h2>
                            <button onClick={() => setShowCatModal(false)} className="p-1 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
                        </div>
                        <div className="p-6">
                            <ul className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                                {categorias.map(c => (
                                    <li key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                        <span className="text-sm font-medium text-slate-700">{c.nombre}</span>
                                        <button onClick={async () => {
                                            if (confirm(`¿Eliminar la categoría "${c.nombre}"?`)) {
                                                await db.categorias.delete(c.id);
                                                window.location.reload();
                                            }
                                        }} className="text-rose-400 hover:text-rose-600 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                                {categorias.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No hay categorías aún.</p>}
                            </ul>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newCatName}
                                    onChange={e => setNewCatName(e.target.value)}
                                    placeholder="Nueva categoría..."
                                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                    onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                                />
                                <button onClick={handleAddCategory} className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-colors">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== MODAL: Subida Masiva ===== */}
            <BulkPhotoUploader
                open={showBulkUploader}
                onClose={() => setShowBulkUploader(false)}
                categorias={categorias}
                onComplete={fetchProductos}
            />
        </div>
    );
};
