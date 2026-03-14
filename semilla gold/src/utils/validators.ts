/**
 * Validators for POS Joyería
 */
import { VentaDetalle } from '../types';

export const validarPIN = (pin: string): boolean => {
    return /^\d{4}$/.test(pin);
};

export const validarEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

export const validarStock = (cantidad: number, stockDisponible: number): boolean => {
    return cantidad > 0 && cantidad <= stockDisponible;
};

export const validarVenta = (detalles: VentaDetalle[]): string[] => {
    const errores: string[] = [];

    if (!detalles || detalles.length === 0) {
        errores.push('El carrito está vacío.');
        return errores;
    }

    detalles.forEach((det, index) => {
        if (det.cantidad <= 0) {
            errores.push(`El producto en la línea ${index + 1} tiene cantidad inválida.`);
        }
        // En un caso real aquí se buscaría el producto en contexto para cruzar stockDisponible
    });

    return errores;
};
