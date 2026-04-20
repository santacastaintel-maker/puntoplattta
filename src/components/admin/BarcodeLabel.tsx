import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeLabelProps {
    codigo: string;
    nombre: string;
    precio: number;
    ancho?: string; // e.g. "60mm"
}

export const BarcodeLabel = ({ codigo, nombre, precio, ancho = '15mm' }: BarcodeLabelProps) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (svgRef.current) {
            JsBarcode(svgRef.current, codigo.toUpperCase(), {
                format: "CODE128",
                width: ancho === '15mm' ? 0.8 : 1.2, // Más ancho si hay espacio
                height: 18,
                displayValue: true,
                fontSize: 6,
                margin: 0,
                textMargin: 0
            });
        }
    }, [codigo, ancho]);

    return (
        <div className="label-container border border-slate-300 bg-white flex flex-col items-center justify-center overflow-hidden"
             style={{ width: ancho, height: '11mm', padding: '0.5mm' }}>
            <p className="font-bold text-slate-800 uppercase leading-none text-center w-full truncate"
               style={{ fontSize: ancho === '15mm' ? '4.5px' : '7.5px', marginBottom: '0.5mm' }}>
                {nombre}
            </p>
            <svg ref={svgRef} style={{ width: '100%', maxHeight: '5.5mm' }}></svg>
            <p className="font-black text-olivo-700 leading-none"
               style={{ fontSize: ancho === '15mm' ? '5px' : '8px' }}>
                ${precio.toFixed(2)}
            </p>
        </div>
    );
};
