import React from 'react';

export function Thead({ children, className = '' }) {
    return <thead className={`bg-slate-50/90 text-xs font-semibold uppercase tracking-wider text-slate-500 ${className}`}>{children}</thead>;
}

export function Tbody({ children, className = '' }) {
    return <tbody className={`divide-y divide-slate-100 bg-white ${className}`}>{children}</tbody>;
}

export function Th({ children, className = '', align = 'left' }) {
    const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
    return (
        <th scope="col" className={`px-4 py-3.5 ${alignClass} ${className}`}>
            {children}
        </th>
    );
}

export function Td({ children, className = '', align = 'left' }) {
    const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
    return <td className={`px-4 py-3.5 text-slate-700 whitespace-nowrap ${alignClass} ${className}`}>{children}</td>;
}

export function Tr({ children, className = '', onClick }) {
    return (
        <tr
            onClick={onClick}
            className={`transition-colors hover:bg-slate-50/70 ${onClick ? 'cursor-pointer' : ''} ${className}`}
        >
            {children}
        </tr>
    );
}

