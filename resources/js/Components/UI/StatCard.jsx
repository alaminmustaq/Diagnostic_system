import React from 'react';

export default function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    color = 'teal',
    trend,
    className = '',
}) {
    const colorStyles = {
        teal: 'bg-teal-50 text-teal-600 border-teal-100',
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100',
        rose: 'bg-rose-50 text-rose-600 border-rose-100',
    };

    const iconStyle = colorStyles[color] || colorStyles.teal;

    return (
        <div className={`bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs transition hover:shadow-md ${className}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
                    {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
                    {trend && (
                        <div className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600">
                            <span>{trend}</span>
                        </div>
                    )}
                </div>
                {Icon && (
                    <div className={`p-3 rounded-xl border ${iconStyle}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                )}
            </div>
        </div>
    );
}

