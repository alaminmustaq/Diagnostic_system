import React, { forwardRef } from 'react';
import InputLabel from './InputLabel';
import InputError from './InputError';

const Textarea = forwardRef(function Textarea(
    {
        label,
        error,
        helperText,
        required = false,
        rows = 3,
        className = '',
        textareaClassName = '',
        id,
        disabled = false,
        ...props
    },
    ref
) {
    const inputId = id || props.name;

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <InputLabel htmlFor={inputId} required={required}>
                    {label}
                </InputLabel>
            )}
            <textarea
                {...props}
                id={inputId}
                ref={ref}
                rows={rows}
                disabled={disabled}
                className={`block w-full rounded-lg border text-sm transition-all duration-150 py-2.5 px-3.5 bg-white ${
                    error
                        ? 'border-rose-300 text-rose-900 placeholder-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                        : 'border-slate-300 text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:ring-teal-500/20'
                } ${
                    disabled
                        ? 'bg-slate-100 text-slate-500 cursor-not-allowed select-none'
                        : ''
                } focus:outline-none focus:ring-3 ${textareaClassName}`}
            />
            {helperText && !error && (
                <p className="mt-1 text-xs text-slate-500">{helperText}</p>
            )}
            <InputError message={error} />
        </div>
    );
});

export default Textarea;

