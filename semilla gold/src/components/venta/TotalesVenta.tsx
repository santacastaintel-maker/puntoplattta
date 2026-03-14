
import { formatPrecio } from '../../utils/formatters';

interface TotalesVentaProps {
    subtotal: number;
    descuento: number;
    total: number;
}

export const TotalesVenta = ({ subtotal, descuento, total }: TotalesVentaProps) => {
    return (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
            <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                <span>Subtotal</span>
                <span>{formatPrecio(subtotal)}</span>
            </div>

            {descuento > 0 && (
                <div className="flex justify-between items-center text-sm font-medium text-rose-500">
                    <span>Descuento</span>
                    <span>-{formatPrecio(descuento)}</span>
                </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="text-base font-bold text-slate-900 tracking-tight">TOTAL</span>
                <span className="text-2xl font-black text-emerald-600 tracking-tighter">
                    {formatPrecio(total)}
                </span>
            </div>
        </div>
    );
};
