import { useState, useEffect, useCallback } from 'react';
import { Vendedor } from '../types';
import { db } from '../lib/db';

interface AuthResponse {
    success: boolean;
    vendedor?: Vendedor;
    token?: string;
    error?: string;
}

const VENDEDOR_ESTANDAR: Vendedor = {
    id: 'vendedor-id-456',
    nombre: 'Vendedor Estándar',
    email: null,
    color_identificador: '#64748B',
    rol: 'vendedor',
    activo: true
};

export const useAuth = () => {
    const [vendedorActual, setVendedorActual] = useState<Vendedor | null>(VENDEDOR_ESTANDAR);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            const savedSession = localStorage.getItem('pos_session');
            if (savedSession) {
                try {
                    const parsed = JSON.parse(savedSession);
                    if (parsed.vendedor) {
                        // Verify if vendor still exists locally and is active
                        const dbVend = await db.vendedores.get(parsed.vendedor.id);
                        if (dbVend && dbVend.activo) {
                            setVendedorActual(dbVend);
                            setToken(parsed.token || 'local-token');
                        } else {
                            localStorage.removeItem('pos_session');
                            setVendedorActual(VENDEDOR_ESTANDAR);
                        }
                    } else {
                        setVendedorActual(VENDEDOR_ESTANDAR);
                    }
                } catch (e) {
                    localStorage.removeItem('pos_session');
                    setVendedorActual(VENDEDOR_ESTANDAR);
                }
            } else {
                setVendedorActual(VENDEDOR_ESTANDAR);
            }
            setLoading(false);
        };
        checkSession();
    }, []);

    const login = useCallback(async (vendedorId: string, pin: string): Promise<AuthResponse> => {
        try {
            setLoading(true);
            const vend = await db.vendedores.get(vendedorId);

            if (!vend || !vend.activo) {
                return { success: false, error: 'Usuario no encontrado o inactivo.' };
            }

            // Todos requieren NIP localmente
            if (vend.pin_auth !== pin) {
                return { success: false, error: 'NIP Incorrecto' };
            }

            const mockToken = 'local-auth-token';
            localStorage.setItem('pos_session', JSON.stringify({ vendedor: vend, token: mockToken }));
            setVendedorActual(vend);
            setToken(mockToken);
            return { success: true, vendedor: vend, token: mockToken };
        } catch (error: any) {
            return { success: false, error: error.message || 'Error de lectura de credenciales.' };
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('pos_session');
        setVendedorActual(VENDEDOR_ESTANDAR);
        setToken(null);
    }, []);

    const changePin = useCallback(async (pinActual: string, pinNuevo: string) => {
        if (!vendedorActual || vendedorActual.id === 'guest') {
            return { success: false, error: 'Acceso no permitido' };
        }

        try {
            setLoading(true);
            const vend = await db.vendedores.get(vendedorActual.id);
            if (!vend) return { success: false, error: 'Usuario no existe' };

            if (vend.pin_auth !== pinActual) {
                return { success: false, error: 'El PIN actual es incorrecto' };
            }

            await db.vendedores.update(vend.id, { pin_auth: pinNuevo });
            return { success: true, message: 'PIN actualizado exitosamente' };
        } catch (error: any) {
            return { success: false, error: error.message || 'Error al cambiar PIN' };
        } finally {
            setLoading(false);
        }
    }, [vendedorActual]);

    return {
        vendedorActual,
        token,
        isAdmin: vendedorActual?.rol === 'admin',
        loading,
        login,
        logout,
        changePin,
    };
};
