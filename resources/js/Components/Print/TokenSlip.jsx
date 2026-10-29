import React from 'react';
import { usePage } from '@inertiajs/react';
import Button from '../UI/Button';
import { Printer, X, Building2, Phone, MapPin, Scissors } from 'lucide-react';

export default function TokenSlip({ visit, onClose }) {
    const { company_setting } = usePage().props;

    if (!visit) return null;

    const printSize = company_setting?.token_print_size || '80mm';
    const isSeparate = company_setting?.print_separate_slips ?? true;
    const companyName = company_setting?.company_name || 'Aesthetic & Dermatology Clinic';
    const companyPhone = company_setting?.company_phone || '+880 1700-000000';
    const companyEmail = company_setting?.company_email || 'info@clinicdiagnostic.com';
    const companyAddress = company_setting?.company_address || 'House #12, Road #5, Dhanmondi, Dhaka';
    const companyLogo = company_setting?.logo_url || null;
    const headerNote = company_setting?.token_header_note || 'Patient Serial Consultation Token';
    const footerNote = company_setting?.token_footer_note || 'Please wait in the reception lounge until your serial is announced.';

    const sizeStyles = {
        '58mm': 'w-[230px] print:w-[48mm]',
        '80mm': 'w-[310px] print:w-[72mm]',
        'a5': 'w-[440px] print:w-[130mm]',
        'a4': 'w-[560px] print:w-[180mm]',
    };

    const targetWidthClass = sizeStyles[printSize] || sizeStyles['80mm'];

    const handlePrint = () => {
        window.print();
    };

    const renderSlip = (copyType, isFirst = false) => (
        <div
            className={`token-slip-item bg-white p-4 font-sans text-slate-800 rounded-xl border border-slate-300 shadow-sm print:shadow-none print:border-none print:p-1 print:m-0 ${targetWidthClass} ${
                isFirst && isSeparate ? 'print:break-after-page' : ''
            }`}
            style={{
                pageBreakAfter: isFirst && isSeparate ? 'always' : 'auto',
                breakAfter: isFirst && isSeparate ? 'page' : 'auto',
            }}
        >
            {/* Header branding */}
            <div className="text-center pb-2.5 border-b border-slate-200">
                <div className="inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white mb-1.5 print:bg-black">
                    {copyType}
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
            <div className="my-3 text-center py-2 bg-teal-50 border border-teal-200 rounded-lg print:border-slate-400 print:bg-slate-50">
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
                        <span className="text-slate-500">Room:</span>
                        <span className="font-bold text-slate-900">{visit.room_number}</span>
                    </div>
                )}
                <div className="flex justify-between pt-1 border-t border-dashed border-slate-200 font-medium">
                    <span className="text-slate-500">Fee:</span>
                    <span className="font-bold text-slate-900 font-mono">
                        {parseFloat(visit.fee) > 0 ? `${parseFloat(visit.fee).toFixed(2)} Tk` : 'Free (Follow-up)'}
                    </span>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-2.5 text-center text-[10px] text-slate-400 leading-snug">
                {footerNote}
            </div>
        </div>
    );

    return (
        <div className="print-container fixed inset-0 z-50 overflow-y-auto px-4 py-6 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs print:static print:p-0 print:bg-transparent print:overflow-visible">
            <div className="print-container relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-auto">
                {/* Modal Toolbar (hidden on print) */}
                <div className="no-print flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900">Print Serial Token</h4>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-mono">
                                Size: {printSize}
                            </span>
                            {isSeparate && (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                    2 Separate Slips
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {isSeparate
                                ? 'Prints Slip 1 (Desk) and Slip 2 (Patient) on 2 separate pages/thermal cuts'
                                : 'Prints both slips on current page'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="primary" onClick={handlePrint} size="sm">
                            <Printer className="w-4 h-4 mr-1.5" /> Print {isSeparate ? '2 Separate Slips' : 'Slips'}
                        </Button>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Printable Slips View */}
                <div className="print-container flex flex-col items-center justify-center gap-6 max-h-[70vh] overflow-y-auto p-2 bg-slate-50/50 rounded-xl print:p-0 print:m-0 print:bg-transparent print:max-h-none print:overflow-visible">
                    {/* Slip 1: Desk Copy */}
                    <div>
                        {renderSlip('Desk Copy', true)}
                    </div>

                    {/* Visual Separator in preview */}
                    {isSeparate && (
                        <div className="no-print flex items-center gap-2 text-xs text-slate-400 font-mono my-1">
                            <Scissors className="w-4 h-4 text-teal-600" />
                            <span>----- Automatic Page Break / Printer Cut Point -----</span>
                        </div>
                    )}

                    {/* Slip 2: Patient Copy */}
                    <div>
                        {renderSlip('Patient Copy', false)}
                    </div>
                </div>
            </div>
        </div>
    );
}
