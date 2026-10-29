import React from 'react';

export default function Card({
    title,
    subtitle,
    actions,
    children,
    footer,
    className = '',
    headerClassName = '',
    bodyClassName = '',
}) {
    return (
        <div className={`bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden ${className}`}>
            {(title || actions) && (
                <div className={`px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4 ${headerClassName}`}>
                    <div>
                        {title && <h3 className="font-semibold text-slate-900 text-base">{title}</h3>}
                        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
                    </div>
                    {actions && <div className="flex items-center gap-2">{actions}</div>}
                </div>
            )}
            <div className={`p-5 ${bodyClassName}`}>{children}</div>
            {footer && (
                <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                    {footer}
                </div>
            )}
        </div>
    );
}

