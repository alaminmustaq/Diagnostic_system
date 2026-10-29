import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({
    icon: Icon = Inbox,
    title = 'No records found',
    description = 'There are no items to display matching your criteria.',
    action,
    className = '',
}) {
    return (
        <div className={`p-12 text-center flex flex-col items-center justify-center ${className}`}>
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3.5">
                <Icon className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-slate-800">{title}</h4>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

