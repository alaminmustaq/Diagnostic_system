import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Alert({
    type = 'success',
    message,
    onClose,
    className = '',
}) {
    if (!message) return null;

    const styles = {
        success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        error: 'bg-rose-50 border-rose-200 text-rose-800',
        warning: 'bg-amber-50 border-amber-200 text-amber-800',
        info: 'bg-sky-50 border-sky-200 text-sky-800',
    };

    const icons = {
        success: CheckCircle2,
        error: AlertCircle,
        warning: AlertCircle,
        info: Info,
    };

    const Icon = icons[type] || Info;

    return (
        <div className={`p-4 rounded-xl border flex items-start justify-between gap-3 shadow-xs ${styles[type]} ${className}`}>
            <div className="flex items-start gap-2.5">
                <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm font-medium leading-relaxed">{message}</div>
            </div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="p-1 rounded-md hover:bg-black/5 transition text-current"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}

