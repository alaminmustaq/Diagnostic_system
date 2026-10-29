import React from 'react';

export default function InputLabel({
    value,
    className = '',
    children,
    required = false,
    ...props
}) {
    return (
        <label
            {...props}
            className={`block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 ${className}`}
        >
            {value ? value : children}
            {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
    );
}

