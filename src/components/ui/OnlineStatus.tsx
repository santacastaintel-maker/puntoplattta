import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

type Status = 'online' | 'offline' | 'checking';

export const OnlineStatus = () => {
    const [status, setStatus] = useState<Status>('checking');

    useEffect(() => {
        const check = async () => {
            if (!navigator.onLine) { setStatus('offline'); return; }
            try {
                // Ping rápido a nuestra API para confirmar conectividad real
                const r = await fetch('/api/config', { method: 'GET', signal: AbortSignal.timeout(3000) });
                setStatus(r.ok ? 'online' : 'offline');
            } catch {
                setStatus('offline');
            }
        };

        check();
        const interval = setInterval(check, 30000); // revisar cada 30s
        window.addEventListener('online', check);
        window.addEventListener('offline', () => setStatus('offline'));

        return () => {
            clearInterval(interval);
            window.removeEventListener('online', check);
            window.removeEventListener('offline', () => setStatus('offline'));
        };
    }, []);

    if (status === 'checking') {
        return (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 px-2 py-1 rounded-full bg-slate-100">
                <Loader2 className="w-3 h-3 animate-spin" />
                Conectando...
            </span>
        );
    }

    if (status === 'offline') {
        return (
            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 px-2 py-1 rounded-full bg-amber-100 border border-amber-200">
                <WifiOff className="w-3 h-3" />
                Sin conexión
            </span>
        );
    }

    return (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200">
            <Wifi className="w-3 h-3" />
            Sincronizado
        </span>
    );
};
