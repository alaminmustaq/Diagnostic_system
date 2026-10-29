import React from 'react';

export default function PageHeader({
    title,
    subtitle,
    actions,
    badge,
    className = '',
}) {
    return (
        <div className={`mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${className}`}>
            <div>
                <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
                    {badge}
                </div>
                {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>}
        </div>
    );
}

