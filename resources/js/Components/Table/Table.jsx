import React from 'react';

export default function Table({ children, className = '' }) {
    return (
        <div className="w-full overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-xs">
            <table className={`min-w-full divide-y divide-slate-200 text-left text-sm ${className}`}>
                {children}
            </table>
        </div>
    );
}

