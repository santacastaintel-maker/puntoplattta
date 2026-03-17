import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeLabelProps {
    codigo: string;
    nombre: string;
    precio: number;
}

export const BarcodeLabel = ({ codigo, nombre, precio }: BarcodeLabelProps) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (svgRef.current) {
            JsBarcode(svgRef.current, codigo, {
                format: "CODE128",
                width: 1.2,
                height: 30,
                displayValue: true,
                fontSize: 10,
                margin: 0
            });
        }
    }, [codigo]);

    return (
        <div className="label-container p-2 border border-slate-200 rounded bg-white flex flex-col items-center justify-center w-[40mm] h-[25mm] overflow-hidden">
            <p className="text-[8px] font-bold text-slate-800 truncate w-full text-center uppercase">{nombre}</p>
            <svg ref={svgRef} className="max-w-full"></svg>
            <p className="text-[10px] font-black text-olivo-700 mt-1">${precio.toFixed(2)}</p>
        </div>
    );
};
