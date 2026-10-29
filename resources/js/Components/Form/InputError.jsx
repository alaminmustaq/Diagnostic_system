import React from 'react';

export default function InputError({ message, className = '', ...props }) {
    return message ? (
        <p {...props} className={`text-xs text-rose-600 mt-1.5 font-medium ${className}`}>
            {message}
        </p>
    ) : null;
}

