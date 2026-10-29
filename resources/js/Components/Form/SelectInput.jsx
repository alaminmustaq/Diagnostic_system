import React, { forwardRef } from 'react';
import InputLabel from './InputLabel';
import InputError from './InputError';

const SelectInput = forwardRef(function SelectInput(
    {
        label,
        error,
        helperText,
        required = false,
        options = [],
        placeholder = 'Select an option',
        children,
        className = '',
        selectClassName = '',
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
                <select
                    {...props}
                    id={inputId}
                    ref={ref}
                    disabled={disabled}
                    className={`block w-full rounded-lg border text-sm transition-all duration-150 py-2.5 px-3.5 bg-white ${
                        error
                            ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500/20'
                            : 'border-slate-300 text-slate-900 focus:border-teal-500 focus:ring-teal-500/20'
                    } ${
                        disabled
                            ? 'bg-slate-100 text-slate-500 cursor-not-allowed select-none'
                            : ''
                    } focus:outline-none focus:ring-3 ${selectClassName}`}
                >
                    {placeholder && <option value="">{placeholder}</option>}
                    {children
                        ? children
                        : options.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                  {opt.label}
                              </option>
                          ))}
                </select>
            </div>
            {helperText && !error && (
                <p className="mt-1 text-xs text-slate-500">{helperText}</p>
            )}
            <InputError message={error} />
        </div>
    );
});

export default SelectInput;

