import React, { InputHTMLAttributes } from 'react';
import { cn } from './Button';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    error?: string;
    icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, error, icon, ...props }, ref) => {
        return (
            <div className="relative w-full">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        {icon}
                    </div>
                )}
                <input
                    ref={ref}
                    className={cn(
                        "flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-olivo-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-sm",
                        icon && "pl-10",
                        error && "border-rose-500 focus:ring-rose-500",
                        className
                    )}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-xs text-rose-500">{error}</p>
                )}
            </div>
        );
    }
);
Input.displayName = 'Input';
