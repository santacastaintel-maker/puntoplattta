/**
 * Formators Utility for POS Joyería
 */

export const formatPrecio = (numero: number): string => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
    }).format(numero);
};

export const formatFecha = (fechaInput: string | Date): string => {
    const fecha = typeof fechaInput === 'string' ? new Date(fechaInput) : fechaInput;
    return new Intl.DateTimeFormat('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(fecha);
};

export const colorToClass = (colorCode: string): string => {
    // Simple mapeo a clases seguras de Tailwind si se requiere usar custom colors de DB
    // Idealmente se maneja por hex style, pero si forzamos clases, este helper puede usarse.
    const map: Record<string, string> = {
        '#EF4444': 'bg-red-500',
        '#3B82F6': 'bg-blue-500',
        '#10B981': 'bg-emerald-500',
        '#F59E0B': 'bg-amber-500',
        '#8B5CF6': 'bg-purple-500',
    };
    return map[colorCode.toUpperCase()] || 'bg-slate-500';
};
