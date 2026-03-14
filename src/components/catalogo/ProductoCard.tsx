
import { Producto } from '../../types';
import { formatPrecio } from '../../utils/formatters';
import { Badge } from '../ui/Badge';
import { Plus } from 'lucide-react';

interface ProductoCardProps {
    producto: Producto;
    onAdd: (p: Producto) => void;
    onClick?: (p: Producto) => void;
}

export const ProductoCard = ({ producto, onAdd, onClick }: ProductoCardProps) => {
    const isLowStock = producto.stock > 0 && producto.stock <= 5;
    const isOutOfStock = producto.stock === 0;

    return (
        <div
            className="group relative flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
            onClick={() => onClick && onClick(producto)}
        >
            {/* Imagen */}
            <div className="relative aspect-square bg-slate-100 overflow-hidden">
                {producto.foto_url ? (
                    <img
                        src={producto.foto_url}
                        alt={producto.nombre}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <span className="text-sm font-medium">Sin Foto</span>
                    </div>
                )}

                {/* Badges Flotantes */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {isLowStock && <Badge variant="warning" className="shadow-sm">Últimos {producto.stock}</Badge>}
                    {isOutOfStock && <Badge variant="danger" className="shadow-sm">Agotado</Badge>}
                </div>
            </div>

            {/* Info */}
            <div className="p-3 flex flex-col flex-grow">
                <span className="text-xs font-mono text-slate-500 mb-1">{producto.codigo}</span>
                <h3 className="text-sm font-medium text-slate-900 line-clamp-2 leading-snug mb-2 flex-grow">
                    {producto.nombre}
                </h3>

                <div className="flex items-center justify-between mt-auto pt-2">
                    <span className="text-base font-bold text-emerald-600">
                        {formatPrecio(producto.precio)}
                    </span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!isOutOfStock) onAdd(producto);
                        }}
                        disabled={isOutOfStock}
                        className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-emerald-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Agregar al carrito"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
