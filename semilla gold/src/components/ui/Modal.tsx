import React, { useEffect } from 'react';
import { cn } from './Button';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
}

export const Modal = ({ isOpen, onClose, title, children, className }: ModalProps) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className={cn(
                "relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl animate-in fade-in zoom-in-95 duration-200",
                className
            )}>
                {title && (
                    <div className="flex items-center justify-between border-b px-6 py-4">
                        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                        <button
                            onClick={onClose}
                            className="rounded-full p-1 hover:bg-slate-100 transition-colors"
                        >
                            <X className="h-5 w-5 text-slate-500" />
                        </button>
                    </div>
                )}
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};
