
import { CartItem } from '../../types';
import { formatPrecio } from '../../utils/formatters';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface CarritoItemProps {
    item: CartItem;
    onIncrement: (id: string) => void;
    onDecrement: (id: string) => void;
    onRemove: (id: string) => void;
}

export const CarritoItem = ({ item, onIncrement, onDecrement, onRemove }: CarritoItemProps) => {
    const { producto, cantidad } = item;

    return (
        <div className="flex items-center gap-4 py-4 border-b border-slate-100 last:border-0 bg-white">
            {/* Thumbnail */}
            <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 shadow-sm border border-slate-200">
                {producto.foto_url ? (
                    <img src={producto.foto_url} alt={producto.nombre} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">Sin Foto</div>
                )}
            </div>

            {/* Info */}
            <div className="flex-grow flex flex-col justify-between h-16">
                <div>
                    <h4 className="text-sm font-semibold text-slate-900 leading-tight line-clamp-1">{producto.nombre}</h4>
                    <span className="text-xs text-slate-500 font-mono">{producto.codigo}</span>
                </div>
                <div className="text-olivo-600 font-bold text-sm">
                    {formatPrecio(producto.precio)}
                </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-col items-end gap-2">
                <button
                    onClick={() => onRemove(producto.id)}
                    className="text-slate-400 hover:text-rose-500 p-1 -mr-1 transition-colors"
                    aria-label="Remove item"
                >
                    <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-center bg-slate-100 rounded-full border border-slate-200 p-0.5">
                    <button
                        onClick={() => onDecrement(producto.id)}
                        className="w-7 h-7 flex items-center justify-center bg-white rounded-full shadow-sm text-slate-600 hover:text-slate-900 active:scale-95 transition-all"
                    >
                        <Minus className="w-3.5 h-3.5" />
                    </button>

                    <span className="w-8 text-center text-sm font-semibold text-slate-900">{cantidad}</span>

                    <button
                        onClick={() => onIncrement(producto.id)}
                        disabled={cantidad >= producto.stock}
                        className="w-7 h-7 flex items-center justify-center bg-white rounded-full shadow-sm text-slate-600 hover:text-slate-900 focus:outline-none disabled:opacity-50 active:scale-95 transition-all"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
