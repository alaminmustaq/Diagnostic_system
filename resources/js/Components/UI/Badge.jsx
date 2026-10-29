import React from 'react';

export default function Badge({
    variant = 'neutral',
    children,
    size = 'sm',
    className = '',
}) {
    const sizeClasses = {
        xs: 'px-2 py-0.5 text-[11px]',
        sm: 'px-2.5 py-1 text-xs',
        md: 'px-3 py-1 text-sm',
    };

    const variantClasses = {
        waiting: 'bg-amber-100 text-amber-800 border-amber-200',
        in_consultation: 'bg-indigo-100 text-indigo-800 border-indigo-200 animate-pulse',
        completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
        pending: 'bg-amber-100 text-amber-800 border-amber-200',
        visit: 'bg-teal-100 text-teal-800 border-teal-200',
        treatment: 'bg-purple-100 text-purple-800 border-purple-200',
        primary: 'bg-teal-100 text-teal-800 border-teal-200',
        success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        danger: 'bg-rose-100 text-rose-800 border-rose-200',
        warning: 'bg-amber-100 text-amber-800 border-amber-200',
        info: 'bg-sky-100 text-sky-800 border-sky-200',
        neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    };

    const style = variantClasses[variant] || variantClasses.neutral;

    return (
        <span className={`inline-flex items-center font-medium rounded-full border ${style} ${sizeClasses[size]} ${className}`}>
            {children}
        </span>
    );
}

