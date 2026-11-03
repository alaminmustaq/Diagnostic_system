import React, { forwardRef, useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
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
        name,
        value = '',
        onChange,
        disabled = false,
        ...props
    },
    ref
) {
    const inputId = id || name;
    const [isOpen, setIsOpen] = useState(false);
    const [menuStyle, setMenuStyle] = useState({});
    const triggerRef = useRef(null);
    const menuRef = useRef(null);

    // Normalize options from either `children` (<option>) or `options` prop
    const normalizedOptions = useMemo(() => {
        if (children) {
            const items = [];
            React.Children.forEach(children, (child) => {
                if (!React.isValidElement(child)) return;
                if (child.type === React.Fragment) {
                    React.Children.forEach(child.props.children, (nested) => {
                        if (React.isValidElement(nested) && nested.type === 'option') {
                            const rawText = React.Children.toArray(nested.props.children).join('');
                            items.push({
                                value: nested.props.value ?? rawText,
                                label: rawText,
                                description: nested.props['data-description'] || null,
                                disabled: nested.props.disabled,
                            });
                        }
                    });
                } else if (child.type === 'option') {
                    const rawText = React.Children.toArray(child.props.children).join('');
                    items.push({
                        value: child.props.value ?? rawText,
                        label: rawText,
                        description: child.props['data-description'] || null,
                        disabled: child.props.disabled,
                    });
                }
            });
            return items;
        }

        return options.map((opt) => ({
            value: opt.value,
            label: opt.label,
            description: opt.description || null,
            disabled: opt.disabled || false,
        }));
    }, [children, options]);

    const selectedOption = useMemo(
        () => normalizedOptions.find((opt) => String(opt.value) === String(value)),
        [normalizedOptions, value]
    );

    const updatePosition = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom;
        const estimatedHeight = Math.min(normalizedOptions.length * 48 + 16, 250);
        const openUpward = spaceBelow < estimatedHeight && rect.top > spaceBelow;

        setMenuStyle({
            position: 'fixed',
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            ...(openUpward
                ? { bottom: `${viewportHeight - rect.top + 4}px` }
                : { top: `${rect.bottom + 4}px` }),
            zIndex: 9999,
        });
    };

    useEffect(() => {
        if (!isOpen) return;
        updatePosition();

        const handleClickOutside = (e) => {
            if (
                triggerRef.current &&
                !triggerRef.current.contains(e.target) &&
                menuRef.current &&
                !menuRef.current.contains(e.target)
            ) {
                setIsOpen(false);
            }
        };

        const handleScrollOrResize = () => {
            updatePosition();
        };

        window.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);

        return () => {
            window.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [isOpen, normalizedOptions.length]);

    const handleSelect = (optValue) => {
        if (disabled) return;
        if (onChange) {
            onChange({
                target: {
                    name,
                    id: inputId,
                    value: optValue,
                },
            });
        }
        setIsOpen(false);
    };

    return (
        <div className={`w-full ${className}`} ref={ref}>
            {label && (
                <InputLabel htmlFor={inputId} required={required}>
                    {label}
                </InputLabel>
            )}
            <div className="relative w-full">
                <button
                    {...props}
                    id={inputId}
                    ref={triggerRef}
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && setIsOpen((prev) => !prev)}
                    className={`flex items-center justify-between gap-2 w-full rounded-lg border text-sm text-left transition-all duration-150 py-2.5 px-3.5 bg-white shadow-2xs cursor-pointer ${
                        error
                            ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500/20'
                            : isOpen
                            ? 'border-teal-500 ring-3 ring-teal-500/20 text-slate-900'
                            : 'border-slate-300 text-slate-900 hover:border-slate-400 focus:border-teal-500 focus:ring-teal-500/20'
                    } ${
                        disabled
                            ? 'bg-slate-100 text-slate-500 cursor-not-allowed select-none'
                            : ''
                    } focus:outline-none ${selectClassName}`}
                >
                    <span
                        className={`block truncate ${
                            selectedOption ? 'text-slate-900 font-medium' : 'text-slate-400'
                        }`}
                    >
                        {selectedOption
                            ? selectedOption.description
                                ? `${selectedOption.label} — ${selectedOption.description}`
                                : selectedOption.label
                            : placeholder || 'Select an option'}
                    </span>
                    <ChevronDown
                        className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-150 ${
                            isOpen ? 'rotate-180 text-teal-600' : ''
                        }`}
                    />
                </button>

                {isOpen &&
                    typeof document !== 'undefined' &&
                    createPortal(
                        <div
                            ref={menuRef}
                            style={menuStyle}
                            className="bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 max-h-60 overflow-y-auto overflow-x-hidden"
                        >
                            {placeholder && (
                                <button
                                    type="button"
                                    onClick={() => handleSelect('')}
                                    className="w-full px-3.5 py-2 text-left text-xs text-slate-400 hover:bg-slate-50 transition flex items-center justify-between cursor-pointer"
                                >
                                    <span className="whitespace-normal break-words">{placeholder}</span>
                                </button>
                            )}
                            {normalizedOptions.length === 0 ? (
                                <div className="px-3.5 py-3 text-xs text-slate-400 text-center">
                                    No options available
                                </div>
                            ) : (
                                normalizedOptions.map((opt) => {
                                    const isSelected = String(opt.value) === String(value);
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            disabled={opt.disabled}
                                            onClick={() => handleSelect(opt.value)}
                                            className={`w-full px-3.5 py-2.5 text-left text-sm transition flex items-start justify-between gap-2 cursor-pointer ${
                                                isSelected
                                                    ? 'bg-teal-50/80 text-teal-900 font-semibold'
                                                    : 'text-slate-700 hover:bg-slate-50'
                                            } ${opt.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <div className="min-w-0 flex-1 whitespace-normal break-words leading-snug">
                                                <span className="block">{opt.label}</span>
                                                {opt.description && (
                                                    <span className="block text-xs font-normal text-slate-500 mt-0.5 whitespace-normal break-words leading-relaxed">
                                                        {opt.description}
                                                    </span>
                                                )}
                                            </div>
                                            {isSelected && (
                                                <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>,
                        document.body
                    )}
            </div>
            {helperText && !error && (
                <p className="mt-1 text-xs text-slate-500">{helperText}</p>
            )}
            <InputError message={error} />
        </div>
    );
});

export default SelectInput;
