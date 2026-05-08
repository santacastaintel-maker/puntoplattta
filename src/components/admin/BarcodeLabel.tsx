import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface BarcodeLabelProps {
    codigo: string;
    nombre: string;
    precio: number;
    ancho?: string; // "15mm" (mosaico) o "60mm" (rollo)
}

export const BarcodeLabel = ({ codigo, precio, ancho = '15mm' }: BarcodeLabelProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current && ancho !== '15mm') {
            // Solo renderizamos el QR en el preview si es modo rollo
            QRCode.toCanvas(canvasRef.current, codigo.toUpperCase(), {
                width: 40,
                margin: 0,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
        }
    }, [codigo, ancho]);

    const isRollo = ancho !== '15mm';

    // Layout para Rollo (62mm x 10.8mm)
    if (isRollo) {
        return (
            <div className="label-container bg-white flex items-center border border-slate-200 shadow-sm overflow-hidden"
                 style={{ width: '62mm', height: '10.8mm', padding: 0 }}>
                
                {/* SECCIÓN 1 (0-14.2mm): PRECIO */}
                <div className="flex items-center justify-center border-r border-slate-100 border-dashed" 
                     style={{ width: '14.2mm', height: '100%' }}>
                    <p className="font-black text-slate-900 leading-none" style={{ fontSize: '10pt' }}>
                        ${precio % 1 === 0 ? precio.toFixed(0) : precio.toFixed(2)}
                    </p>
                </div>

                {/* SECCIÓN 2 (14.2-28.4mm): QR + SKU */}
                <div className="flex flex-col items-center justify-center border-r border-slate-100 border-dashed bg-slate-50/30" 
                     style={{ width: '14.2mm', height: '100%', gap: '1px' }}>
                    <canvas ref={canvasRef} style={{ width: '6mm', height: '6mm' }}></canvas>
                    <p className="font-bold text-slate-800 leading-none uppercase" style={{ fontSize: '4.5pt' }}>
                        {codigo}
                    </p>
                </div>

                {/* SECCIÓN 3 (28.4-62mm): VACÍO */}
                <div className="flex-1 h-full bg-white"></div>
            </div>
        );
    }

    // Layout para Hoja (Mosaico pequeño 15mm - Simplificado)
    return (
        <div className="label-container border border-slate-200 bg-white flex flex-col items-center justify-center"
             style={{ width: '15mm', height: '11mm', padding: '1px' }}>
            <p className="font-black text-slate-900 leading-none mb-1" style={{ fontSize: '6pt' }}>
                ${precio.toFixed(0)}
            </p>
            <p className="font-bold text-slate-400 leading-none uppercase truncate w-full text-center" style={{ fontSize: '4pt' }}>
                {codigo}
            </p>
        </div>
    );
};

