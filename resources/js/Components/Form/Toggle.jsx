import React from 'react';

export default function Toggle({
    enabled,
    onChange,
    label,
    description,
    disabled = false,
    className = '',
}) {
    return (
        <div className={`flex items-center justify-between gap-3 ${className}`}>
            {(label || description) && (
                <div>
                    {label && <span className="text-sm font-medium text-slate-800">{label}</span>}
                    {description && <p className="text-xs text-slate-500">{description}</p>}
                </div>
            )}
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && onChange(!enabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
                    enabled ? 'bg-teal-600' : 'bg-slate-200'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
            </button>
        </div>
    );
}

