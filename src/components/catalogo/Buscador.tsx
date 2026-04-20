import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { CONFIG } from '../../constants';
import { cn } from '../ui/Button';
import { Categoria } from '../../types';

interface BuscadorProps {
    onSearch: (query: string, categoryId?: string) => void;
    categorias: Categoria[];
    className?: string;
}

export const Buscador = ({ onSearch, categorias, className }: BuscadorProps) => {
    const [query, setQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('todas');

    // Debounce effect
    useEffect(() => {
        const timer = setTimeout(() => {
            onSearch(query, activeCategory === 'todas' ? undefined : activeCategory);
        }, CONFIG.API_DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [query, activeCategory, onSearch]);

    return (
        <div className={cn("w-full flex flex-col gap-4", className)}>
            {/* Search Input */}
            <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-5 h-5" />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar por nombre, código o palabra clave..."
                    className="w-full h-14 pl-12 pr-12 rounded-2xl border-none bg-white shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-emerald-500 text-lg text-slate-900 placeholder:text-slate-400 transition-all font-medium"
                />
                {query && (
                    <button
                        onClick={() => setQuery('')}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Categories Chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 w-full touch-pan-x snap-x snap-mandatory scroll-p-4">
                <button
                    onClick={() => setActiveCategory('todas')}
                    className={cn(
                        "whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm ring-1 ring-inset",
                        activeCategory === 'todas'
                            ? "bg-slate-900 text-white ring-slate-900 shadow-md transform scale-105"
                            : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 hover:text-slate-900"
                    )}
                >
                    Todas
                </button>
                {categorias.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={cn(
                            "whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm ring-1 ring-inset",
                            activeCategory === cat.id
                                ? "bg-slate-900 text-white ring-slate-900 shadow-md transform scale-105"
                                : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 hover:text-slate-900"
                        )}
                    >
                        {cat.nombre}
                    </button>
                ))}
            </div>
        </div>
    );
};
