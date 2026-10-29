import React, { forwardRef } from 'react';
import InputLabel from './InputLabel';
import InputError from './InputError';

const TextInput = forwardRef(function TextInput(
    {
        type = 'text',
        label,
        error,
        helperText,
        required = false,
        icon: Icon,
        className = '',
        inputClassName = '',
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
            <div className="relative rounded-lg shadow-2xs">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Icon className="w-4 h-4" />
                    </div>
                )}
                <input
                    {...props}
                    type={type}
                    id={inputId}
                    ref={ref}
                    disabled={disabled}
                    className={`block w-full rounded-lg border text-sm transition-all duration-150 py-2.5 px-3.5 ${
                        Icon ? 'pl-9' : 'pl-3.5'
                    } ${
                        error
                            ? 'border-rose-300 text-rose-900 placeholder-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                            : 'border-slate-300 text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:ring-teal-500/20'
                    } ${
                        disabled
                            ? 'bg-slate-100 text-slate-500 cursor-not-allowed select-none'
                            : 'bg-white'
                    } focus:outline-none focus:ring-3 ${inputClassName}`}
                />
            </div>
            {helperText && !error && (
                <p className="mt-1 text-xs text-slate-500">{helperText}</p>
            )}
            <InputError message={error} />
        </div>
    );
});

export default TextInput;

