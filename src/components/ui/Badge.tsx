import React from 'react';
import { cn } from './Button';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline';
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
    const variants = {
        default: "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200/80",
        success: "border-transparent bg-emerald-100 text-emerald-800 hover:bg-emerald-200/80",
        warning: "border-transparent bg-amber-100 text-amber-800 hover:bg-amber-200/80",
        danger: "border-transparent bg-rose-100 text-rose-800 hover:bg-rose-200/80",
        outline: "text-slate-950",
    };

    return (
        <div
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-tight transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
                variants[variant],
                className
            )}
            {...props}
        />
    );
}
