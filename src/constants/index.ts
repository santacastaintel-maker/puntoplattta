import { MetodoPago, TipoCliente } from '../types';

export const COLORES_VENDEDOR = [
    { id: 'rojo', hex: '#EF4444', label: 'Rojo' },
    { id: 'azul', hex: '#3B82F6', label: 'Azul' },
    { id: 'verde', hex: '#10B981', label: 'Verde' },
    { id: 'ambar', hex: '#F59E0B', label: 'Ámbar' },
    { id: 'morado', hex: '#8B5CF6', label: 'Morado' },
];

export const METODOS_PAGO: { id: MetodoPago; label: string; icon: string }[] = [
    { id: 'efectivo', label: 'Efectivo', icon: '💵' },
    { id: 'tarjeta', label: 'Tarjeta', icon: '💳' },
    { id: 'transferencia', label: 'Transferencia', icon: '🏦' },
    { id: 'deposito', label: 'Depósito', icon: '📄' },
];

export const TIPOS_CLIENTE: Record<TipoCliente, { colorClass: string; hex: string; label: string }> = {
    premium: { colorClass: 'bg-olivo-100 text-olivo-700', hex: '#80854b', label: 'Premium' },
    normal: { colorClass: 'bg-amber-500', hex: '#F59E0B', label: 'Normal' },
    conflictivo: { colorClass: 'bg-rose-500', hex: '#EF4444', label: 'Conflictivo' },
};

export const CATEGORIAS_DEFAULT = [
    { id: 'todas', label: 'Todas' },
    { id: 'anillos', label: 'Anillos' },
    { id: 'aretes', label: 'Aretes' },
    { id: 'cadenas', label: 'Cadenas' },
    { id: 'charms', label: 'Charms' },
    { id: 'collares', label: 'Collares' },
    { id: 'dijes', label: 'Dijes' },
    { id: 'esclavas', label: 'Esclavas' },
    { id: 'pulseras', label: 'Pulseras' },
    { id: 'sets', label: 'Sets' },
    { id: 'gargantillas', label: 'Gargantillas' },
    { id: 'otro', label: 'Otro...' },
];

export const CONFIG = {
    API_DEBOUNCE_MS: 300,
    ITEMS_PER_PAGE: 20,
};
