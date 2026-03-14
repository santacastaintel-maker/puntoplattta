import { useState, useEffect } from 'react';
import { cn } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { Vendedor } from '../../types';
import { db } from '../../lib/db';

// Mock temporary data, this should come from context or DB list
const MOCK_VENDEDORES: Partial<Vendedor>[] = [
    { id: '1', nombre: 'Ana', color_identificador: '#EF4444' },
    { id: '2', nombre: 'Luis', color_identificador: '#3B82F6' },
    { id: '3', nombre: 'María', color_identificador: '#10B981' },
    { id: '4', nombre: 'Admin', color_identificador: '#64748B' },
];

interface LoginPINProps {
    onSuccess: () => void;
}

export const LoginPIN = ({ onSuccess }: LoginPINProps) => {
    const { login, loading } = useAuth();
    const [pin, setPin] = useState('');
    const [vendedores, setVendedores] = useState<Partial<Vendedor>[]>(MOCK_VENDEDORES);
    const [selectedVendedorId, setSelectedVendedorId] = useState<string>(MOCK_VENDEDORES[0].id!);
    const [errorMsg, setErrorMsg] = useState('');
    const [shake, setShake] = useState(false);

    useEffect(() => {
        const fetchVendedores = async () => {
            const data = await db.vendedores.where('activo').equals(1).toArray().catch(async () => {
                return await db.vendedores.toArray();
            });

            // Si db.vendedores es nuevo, cargará los mock.
            if (data && data.length > 0) {
                setVendedores(data);
                setSelectedVendedorId(data[0].id);
            }
        };
        fetchVendedores();
    }, []);

    const handleError = (msg: string) => {
        setErrorMsg(msg);
        setPin('');
        setShake(true);
        setTimeout(() => setShake(false), 500);
    };

    const handlePinSubmit = async (currentPin: string) => {
        if (currentPin.length !== 4) return;

        const res = await login(selectedVendedorId, currentPin);
        if (res.success) {
            onSuccess();
        } else {
            handleError(res.error || 'PIN Incorrecto');
        }
    };

    const pressNumber = (num: string) => {
        setErrorMsg('');
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);
            if (newPin.length === 4) {
                handlePinSubmit(newPin);
            }
        }
    };

    const deleteNumber = () => {
        setPin(prev => prev.slice(0, -1));
        setErrorMsg('');
    };

    return (
        <div className="w-full max-w-sm mx-auto p-6 bg-white rounded-3xl shadow-xl flex flex-col items-center">
            {/* Selector de Vendedor */}
            <div className="flex gap-4 mb-8 overflow-x-auto w-full pb-2 hide-scrollbar justify-center">
                {vendedores.map((v) => (
                    <button
                        key={v.id}
                        onClick={() => { setSelectedVendedorId(v.id!); setPin(''); setErrorMsg(''); }}
                        className={cn(
                            "flex flex-col items-center gap-2 transition-transform",
                            selectedVendedorId === v.id ? "scale-110 opacity-100" : "opacity-50 hover:opacity-100 scale-95"
                        )}
                    >
                        <div
                            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-sm"
                            style={{ backgroundColor: v.color_identificador }}
                        >
                            {v.nombre?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{v.nombre}</span>
                    </button>
                ))}
            </div>

            {/* PIN Display */}
            <div className={cn("flex gap-4 mb-8", shake && "animate-bounce")}>
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "w-4 h-4 rounded-full transition-all duration-200",
                            pin.length > i ? "bg-slate-800 scale-100" : "bg-slate-200 scale-75"
                        )}
                    />
                ))}
            </div>

            {/* Error Message */}
            <div className="h-6 mb-4">
                {errorMsg && <p className="text-rose-500 text-sm font-medium">{errorMsg}</p>}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-4 w-full px-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                        key={num}
                        onClick={() => pressNumber(num.toString())}
                        disabled={loading}
                        className="h-16 rounded-full bg-slate-50 border border-slate-100 text-2xl font-medium text-slate-800 hover:bg-slate-100 active:bg-slate-200 transition-colors focus:outline-none"
                    >
                        {num}
                    </button>
                ))}
                <div />
                <button
                    onClick={() => pressNumber('0')}
                    disabled={loading}
                    className="h-16 rounded-full bg-slate-50 border border-slate-100 text-2xl font-medium text-slate-800 hover:bg-slate-100 active:bg-slate-200 transition-colors focus:outline-none"
                >
                    0
                </button>
                <button
                    onClick={deleteNumber}
                    disabled={loading || pin.length === 0}
                    className="h-16 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors focus:outline-none"
                >
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
