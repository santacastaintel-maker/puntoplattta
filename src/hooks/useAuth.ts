import { useState, useEffect, useCallback } from 'react';
import { Vendedor } from '../types';
import { db } from '../lib/db';
import { api } from '../lib/apiClient';

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

    // Sincronizar vendedores desde Turso al arrancar (si hay internet)
    useEffect(() => {
        const syncVendedores = async () => {
            if (navigator.onLine) {
                try {
                    const fromCloud = await api.vendedores.list();
                    // Guardar en Dexie para uso offline
                    await db.vendedores.bulkPut(fromCloud.map((v: any) => ({ ...v, activo: v.activo })));
                } catch {
                    // Si falla la sync, no bloqueamos — usamos los datos locales
                }
            }
        };
        syncVendedores();
    }, []);

    useEffect(() => {
        const checkSession = async () => {
            const savedSession = localStorage.getItem('pos_session');
            if (savedSession) {
                try {
                    const parsed = JSON.parse(savedSession);
                    if (parsed.vendedor) {
                        // Verificar si el vendedor sigue activo (primero en Dexie local)
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
                } catch {
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
            // Buscar en Dexie local (siempre funciona, online u offline)
            const vend = await db.vendedores.get(vendedorId);

            if (!vend || !vend.activo) {
                return { success: false, error: 'Usuario no encontrado o inactivo.' };
            }

            if (vend.pin_auth !== pin) {
                return { success: false, error: 'NIP Incorrecto' };
            }

            const mockToken = 'local-auth-token';
            localStorage.setItem('pos_session', JSON.stringify({ vendedor: vend, token: mockToken }));
            setVendedorActual(vend);
            setToken(mockToken);
            return { success: true, vendedor: vend, token: mockToken };
        } catch (error: any) {
            return { success: false, error: error.message || 'Error de credenciales.' };
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
        if (!vendedorActual) return { success: false, error: 'Sin sesión activa' };
        try {
            setLoading(true);
            const vend = await db.vendedores.get(vendedorActual.id);
            if (!vend) return { success: false, error: 'Usuario no existe' };
            if (vend.pin_auth !== pinActual) return { success: false, error: 'El PIN actual es incorrecto' };

            // Actualizar en Turso + Dexie
            if (navigator.onLine) {
                await api.vendedores.update(vendedorActual.id, { pin_auth: pinNuevo });
            }
            await db.vendedores.update(vendedorActual.id, { pin_auth: pinNuevo });
            return { success: true, message: 'PIN actualizado correctamente' };
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
