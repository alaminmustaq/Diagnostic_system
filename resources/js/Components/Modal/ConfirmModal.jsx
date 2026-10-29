import React from 'react';
import Modal from './Modal';
import Button from '../UI/Button';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed with this action? This cannot be undone.',
    confirmLabel = 'Delete',
    cancelLabel = 'Cancel',
    variant = 'danger',
    loading = false,
}) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        {cancelLabel}
                    </Button>
                    <Button variant={variant} onClick={onConfirm} loading={loading}>
                        {confirmLabel}
                    </Button>
                </>
            }
        >
            <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="text-sm text-slate-600 leading-relaxed mt-0.5">
                    {message}
                </div>
            </div>
        </Modal>
    );
}

