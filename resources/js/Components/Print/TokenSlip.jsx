import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePage } from '@inertiajs/react';
import Button from '../UI/Button';
import {
    Printer,
    X,
    Building2,
    Phone,
    MapPin,
    Scissors,
    Stethoscope,
    User,
    Layers,
    FileText,
    Receipt,
} from 'lucide-react';

export default function TokenSlip({ visit, onClose }) {
    const { company_setting } = usePage().props;
    const [selectedCopy, setSelectedCopy] = useState('both'); // 'both' | 'doctor' | 'patient'
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        document.body.classList.add('print-modal-active');

        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && onClose) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.classList.remove('print-modal-active');
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    if (!visit) return null;

    const printSize = company_setting?.token_print_size || '80mm';
    const customWidthMm = parseInt(company_setting?.custom_print_width) || 80;
    const isSeparate = company_setting?.print_separate_slips ?? true;
    const companyName = company_setting?.company_name || 'Aesthetic & Dermatology Clinic';
    const companyPhone = company_setting?.company_phone || '+880 1700-000000';
    const companyEmail = company_setting?.company_email || 'info@clinicdiagnostic.com';
    const companyAddress = company_setting?.company_address || 'House #12, Road #5, Dhanmondi, Dhaka';
    const companyLogo = company_setting?.logo_url || null;
    const headerNote = company_setting?.token_header_note || 'Patient Serial Consultation Token';
    const footerNote = company_setting?.token_footer_note || 'Please wait in the reception lounge until your serial is announced.';

    // Width computations for screen preview and thermal printing
    const getWidths = () => {
        switch (printSize) {
            case '58mm':
                return { previewPx: '230px', printMm: '48mm' };
            case '80mm':
                return { previewPx: '310px', printMm: '72mm' };
            case 'a5':
                return { previewPx: '440px', printMm: '130mm' };
            case 'a4':
                return { previewPx: '560px', printMm: '180mm' };
            case 'custom':
            default: {
                const printMmVal = Math.max(25, customWidthMm - 6);
                const previewPxVal = Math.min(Math.max(200, Math.round(customWidthMm * 3.78)), 620);
                return { previewPx: `${previewPxVal}px`, printMm: `${printMmVal}mm` };
            }
        }
    };

    const { previewPx, printMm } = getWidths();

    // Trigger Print with specific copy target
    const triggerPrint = (targetCopy) => {
        setSelectedCopy(targetCopy);
        setTimeout(() => {
            window.print();
        }, 60);
    };

    const feeAmount = parseFloat(visit.fee) || 0;
    const feeFormatted = feeAmount > 0 ? `${feeAmount.toFixed(2)} Tk (Paid)` : 'Free (Follow-up / Zero Fee)';

    // Render Doctor Copy (Chamber Slip)
    const renderDoctorCopy = () => (
        <div
            className={`token-slip-card bg-white p-4 font-sans text-slate-800 rounded-xl border border-slate-300 shadow-sm print:shadow-none print:border-none print:p-1.5 print:m-0 ${
                isSeparate && selectedCopy === 'both' ? 'print:break-after-page' : ''
            }`}
            style={{
                width: previewPx,
                maxWidth: '100%',
                pageBreakAfter: isSeparate && selectedCopy === 'both' ? 'always' : 'auto',
                breakAfter: isSeparate && selectedCopy === 'both' ? 'page' : 'auto',
            }}
        >
            {/* Header Badge */}
            <div className="text-center pb-2 border-b border-slate-300">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white mb-1 print:bg-black">
                    <Stethoscope className="w-3 h-3 text-teal-300 print:hidden" />
                    <span>Doctor Copy • Chamber Slip</span>
                </div>
                <h3 className="text-xs font-black uppercase tracking-tight text-slate-900 leading-tight">
                    {companyName}
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">Outpatient Serial Queue Record</p>
            </div>

            {/* Queue Token & Serial Box */}
            <div className="my-2.5 text-center py-2 bg-slate-100 border border-slate-300 rounded-lg print:border-slate-400 print:bg-slate-50">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600 print:text-black">
                    Queue Position
                </p>
                <div className="text-2xl font-black text-slate-950 font-mono tracking-tight print:text-black">
                    {visit.token_number}
                </div>
                <p className="text-xs font-black text-teal-800 print:text-black mt-0.5">
                    Serial Number: #{visit.serial_number}
                </p>
            </div>

            {/* Visit Details */}
            <div className="space-y-1.5 text-xs border-b border-slate-300 pb-2">
                <div className="flex justify-between">
                    <span className="text-slate-500">Date:</span>
                    <span className="font-semibold text-slate-900">{visit.visit_date}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500">Patient:</span>
                    <span className="font-bold text-slate-900">{visit.patient_name}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500">Phone:</span>
                    <span className="font-mono text-slate-700">{visit.patient_phone}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500">Doctor:</span>
                    <span className="font-semibold text-teal-900 print:text-black">{visit.doctor_name}</span>
                </div>
                {visit.room_number && (
                    <div className="flex justify-between">
                        <span className="text-slate-500">Chamber:</span>
                        <span className="font-bold text-slate-900">{visit.room_number}</span>
                    </div>
                )}
                <div className="flex justify-between pt-1 border-t border-dashed border-slate-300">
                    <span className="text-slate-500">Fee Status:</span>
                    <span className="font-bold text-slate-900 font-mono text-[11px]">{feeFormatted}</span>
                </div>
            </div>

            {/* Clinical Vitals & Notes Box for Doctor / Nurse */}
            <div className="mt-2 text-left text-[9px] text-slate-600 border border-dashed border-slate-300 p-1.5 rounded space-y-1">
                <div className="flex justify-between font-mono">
                    <span>BP: ________</span>
                    <span>Pulse: _____</span>
                    <span>Wt: _____ kg</span>
                </div>
                <div className="pt-0.5 text-slate-400">
                    <span>Chief Complaints: _______________________</span>
                </div>
            </div>

            {/* Chamber Footer */}
            <div className="mt-2 text-center text-[9px] text-slate-400">
                Reception Chamber Copy • Retain for patient record
            </div>
        </div>
    );

    // Render Patient Copy (Token & Payment Slip)
    const renderPatientCopy = () => (
        <div
            className="token-slip-card bg-white p-4 font-sans text-slate-800 rounded-xl border border-slate-300 shadow-sm print:shadow-none print:border-none print:p-1.5 print:m-0"
            style={{
                width: previewPx,
                maxWidth: '100%',
            }}
        >
            {/* Header branding */}
            <div className="text-center pb-2.5 border-b border-slate-200">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-teal-700 text-white mb-1.5 print:bg-black">
                    <User className="w-3 h-3 print:hidden" />
                    <span>Patient Copy • Token Slip</span>
                </div>

                {companyLogo && (
                    <div className="flex justify-center mb-1">
                        <img src={companyLogo} alt="Logo" className="max-h-10 max-w-[140px] object-contain" />
                    </div>
                )}

                <h3 className="text-sm font-extrabold uppercase tracking-tight text-teal-900 print:text-black">
                    {companyName}
                </h3>
                {companyAddress && (
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{companyAddress}</p>
                )}
                {companyPhone && (
                    <p className="text-[10px] font-mono font-medium text-slate-600 mt-0.5">Phone: {companyPhone}</p>
                )}
                {companyEmail && (
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">Email: {companyEmail}</p>
                )}
                <p className="text-[10px] font-medium text-slate-400 mt-1 italic">{headerNote}</p>
            </div>

            {/* Token & Serial Box */}
            <div className="my-2.5 text-center py-2 bg-teal-50 border border-teal-200 rounded-lg print:border-slate-400 print:bg-slate-50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-teal-800 print:text-black">
                    Queue Position
                </p>
                <div className="text-2xl font-black text-teal-950 font-mono tracking-tight print:text-black">
                    {visit.token_number}
                </div>
                <p className="text-xs font-black text-slate-800 mt-0.5">
                    Serial Number: #{visit.serial_number}
                </p>
            </div>

            {/* Visit Details */}
            <div className="space-y-1.5 text-xs border-b border-slate-200 pb-2">
                <div className="flex justify-between">
                    <span className="text-slate-500">Date:</span>
                    <span className="font-semibold text-slate-900">{visit.visit_date}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500">Patient:</span>
                    <span className="font-bold text-slate-900">{visit.patient_name}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500">Phone:</span>
                    <span className="font-mono text-slate-700">{visit.patient_phone}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500">Doctor:</span>
                    <span className="font-semibold text-teal-900 print:text-black">{visit.doctor_name}</span>
                </div>
                {visit.doctor_designation && (
                    <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Specialty:</span>
                        <span className="text-slate-700 text-right">{visit.doctor_designation}</span>
                    </div>
                )}
                {visit.room_number && (
                    <div className="flex justify-between">
                        <span className="text-slate-500">Room / Chamber:</span>
                        <span className="font-bold text-slate-900">{visit.room_number}</span>
                    </div>
                )}
                <div className="flex justify-between pt-1 border-t border-dashed border-slate-200 font-medium">
                    <span className="text-slate-500">Consultation Fee:</span>
                    <span className="font-bold text-slate-900 font-mono">
                        {feeAmount > 0 ? `${feeAmount.toFixed(2)} Tk` : 'Free (Follow-up)'}
                    </span>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-2 text-center text-[10px] text-slate-400 leading-snug">
                {footerNote}
            </div>
        </div>
    );

    const modalContent = (
        <div className="print-modal-container fixed inset-0 z-50 overflow-y-auto px-4 py-6 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs print:static print:p-0 print:m-0 print:bg-transparent print:overflow-visible print:block">
            {/* Scoped Dynamic Print Isolation and Width CSS */}
            <style>{`
                @media print {
                    #app {
                        display: none !important;
                    }
                    .token-slip-card {
                        width: ${printMm} !important;
                        max-width: ${printMm} !important;
                        margin: 0 !important;
                    }
                }
            `}</style>

            <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-auto print:bg-transparent">
                {/* Modal Toolbar (hidden on print) */}
                <div className="no-print pb-4 mb-4 border-b border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-900 text-base">Print Serial Invoice & Token</h4>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-mono">
                                    Size: {printSize === 'custom' ? `${customWidthMm}mm (Custom)` : printSize}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Select individual copies for Doctor or Patient, or print both separate slips
                            </p>
                        </div>

                        {onClose && (
                            <button
                                onClick={onClose}
                                className="self-end sm:self-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                                title="Close modal"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Copy Selection Tabs & Dedicated Print Buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        {/* Preview Tabs */}
                        <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
                            <button
                                type="button"
                                onClick={() => setSelectedCopy('both')}
                                className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                                    selectedCopy === 'both'
                                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Layers className="w-3.5 h-3.5 text-teal-600" />
                                <span>Both Slips</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedCopy('doctor')}
                                className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                                    selectedCopy === 'doctor'
                                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Stethoscope className="w-3.5 h-3.5 text-slate-700" />
                                <span>Doctor Copy</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedCopy('patient')}
                                className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                                    selectedCopy === 'patient'
                                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <User className="w-3.5 h-3.5 text-teal-600" />
                                <span>Patient Copy</span>
                            </button>
                        </div>

                        {/* Separate Action Buttons for Doctor, Patient, and Both */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Option 1: Print Doctor Copy */}
                            <Button
                                variant="indigo"
                                size="sm"
                                onClick={() => triggerPrint('doctor')}
                                className="font-bold shadow-xs"
                            >
                                <Stethoscope className="w-3.5 h-3.5 mr-1 text-indigo-200" />
                                Print Doctor Copy
                            </Button>

                            {/* Option 2: Print Patient Copy */}
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => triggerPrint('patient')}
                                className="font-bold shadow-xs"
                            >
                                <User className="w-3.5 h-3.5 mr-1 text-teal-200" />
                                Print Patient Copy
                            </Button>

                            {/* Option 3: Print Both Copies */}
                            <Button
                                variant="dark"
                                size="sm"
                                onClick={() => triggerPrint('both')}
                                className="font-bold shadow-xs border border-slate-800"
                            >
                                <Printer className="w-3.5 h-3.5 mr-1 text-amber-300" />
                                Print Both Copies
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Printable Slips View */}
                <div className="print-modal-container flex flex-col items-center justify-center gap-5 max-h-[65vh] overflow-y-auto p-4 bg-slate-50/70 rounded-xl print:p-0 print:m-0 print:bg-transparent print:max-h-none print:overflow-visible print:block">
                    {/* Render Doctor Copy when 'both' or 'doctor' is active */}
                    {(selectedCopy === 'both' || selectedCopy === 'doctor') && (
                        <div className="print:m-0 print:p-0">
                            {renderDoctorCopy()}
                        </div>
                    )}

                    {/* Visual Separator in preview when both are shown */}
                    {selectedCopy === 'both' && isSeparate && (
                        <div className="no-print flex items-center gap-2 text-xs text-slate-400 font-mono my-0.5">
                            <Scissors className="w-4 h-4 text-teal-600" />
                            <span>----- Automatic Page Break / Paper Cut Point -----</span>
                        </div>
                    )}

                    {/* Render Patient Copy when 'both' or 'patient' is active */}
                    {(selectedCopy === 'both' || selectedCopy === 'patient') && (
                        <div className="print:m-0 print:p-0">
                            {renderPatientCopy()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (typeof document !== 'undefined' && mounted) {
        return createPortal(modalContent, document.body);
    }

    return modalContent;
}
