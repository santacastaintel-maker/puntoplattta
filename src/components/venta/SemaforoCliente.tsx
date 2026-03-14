
import { TipoCliente } from '../../types';
import { TIPOS_CLIENTE } from '../../constants';

export const SemaforoCliente = ({ tipo, showLabel = true }: { tipo: TipoCliente; showLabel?: boolean }) => {
    const config = TIPOS_CLIENTE[tipo] || TIPOS_CLIENTE.normal;

    return (
        <div className="flex items-center gap-2">
            <div
                className={`w-3 h-3 rounded-full shadow-sm ring-2 ring-white ${config.colorClass}`}
                title={`Cliente ${config.label}`}
            />
            {showLabel && (
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    {config.label}
                </span>
            )}
        </div>
    );
};
