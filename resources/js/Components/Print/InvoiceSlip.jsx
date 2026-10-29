import React from 'react';
import { usePage } from '@inertiajs/react';
import Button from '../UI/Button';
import { Printer, X } from 'lucide-react';

export default function InvoiceSlip({ invoice, onClose }) {
    const { company_setting } = usePage().props;

    if (!invoice) return null;

    const printSize = company_setting?.token_print_size || '80mm';
    const companyName = company_setting?.company_name || 'Aesthetic & Dermatology Clinic';
    const companyPhone = company_setting?.company_phone || '+880 1700-000000';
    const companyEmail = company_setting?.company_email || 'info@clinicdiagnostic.com';
    const companyAddress = company_setting?.company_address || 'House #12, Road #5, Dhanmondi, Dhaka';
    const companyLogo = company_setting?.logo_url || null;

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

    return (
        <div className="print-container fixed inset-0 z-50 overflow-y-auto px-4 py-6 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs print:static print:p-0 print:bg-transparent print:overflow-visible">
            <div className="print-container relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-auto">
                {/* Modal Toolbar (hidden on print) */}
                <div className="no-print flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900">Treatment POS Invoice</h4>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-mono">
                                POS: {printSize}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">Formatted for POS thermal printer output</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="primary" onClick={handlePrint} size="sm">
                            <Printer className="w-4 h-4 mr-1.5" /> Print Receipt
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

                {/* Thermal Slip Container (centered in preview, full width on print) */}
                <div className="print-container flex justify-center p-2 bg-slate-50/50 rounded-xl print:p-0 print:m-0 print:bg-transparent">
                    <div
                        className={`bg-white p-4 font-sans text-slate-800 rounded-xl border border-slate-300 shadow-sm print:shadow-none print:border-none print:p-1 print:m-0 ${targetWidthClass}`}
                    >
                        {/* Header Branding */}
                        <div className="text-center pb-2.5 border-b border-dashed border-slate-300">
                            <div className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white mb-1.5 print:bg-black">
                                Money Receipt
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
                            <p className="text-[10px] font-mono font-bold text-slate-700 mt-1">
                                Inv: {invoice.invoice_no}
                            </p>
                        </div>

                        {/* Patient & Date Meta */}
                        <div className="py-2 text-[11px] border-b border-dashed border-slate-300 space-y-1">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Date:</span>
                                <span className="font-semibold text-slate-900">{invoice.date}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Patient:</span>
                                <span className="font-bold text-slate-900">{invoice.patient?.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Phone:</span>
                                <span className="font-mono text-slate-700">{invoice.patient?.phone}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Payment:</span>
                                <span className="font-medium text-slate-800">Cash / POS</span>
                            </div>
                        </div>

                        {/* Itemized Services Table */}
                        <div className="py-2 border-b border-dashed border-slate-300">
                            <table className="w-full text-[11px]">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                                        <th className="text-left pb-1">Item / Service</th>
                                        <th className="text-right pb-1">Tk</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {invoice.items && invoice.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="py-1 text-slate-800 font-medium">{item.name}</td>
                                            <td className="py-1 text-right font-mono font-semibold text-slate-900">
                                                {parseFloat(item.price).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Financial Totals */}
                        <div className="py-2 space-y-1 text-[11px] border-b border-dashed border-slate-300">
                            <div className="flex justify-between text-slate-600">
                                <span>Subtotal:</span>
                                <span className="font-mono">{parseFloat(invoice.base_amount).toFixed(2)} Tk</span>
                            </div>
                            {parseFloat(invoice.discount_amount) > 0 && (
                                <div className="flex justify-between text-rose-600">
                                    <span>Discount ({invoice.discount_type === 'percentage' ? `${invoice.discount_amount}%` : 'Fixed'}):</span>
                                    <span className="font-mono">
                                        -{parseFloat(invoice.base_amount - invoice.final_paid_amount).toFixed(2)} Tk
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between text-xs font-black text-slate-900 pt-1 border-t border-slate-200">
                                <span>Total Paid:</span>
                                <span className="font-mono text-teal-800 print:text-black font-extrabold text-sm">
                                    {parseFloat(invoice.final_paid_amount).toFixed(2)} Tk
                                </span>
                            </div>
                        </div>

                        {/* Thermal Receipt Footer */}
                        <div className="pt-2 text-center text-[10px] text-slate-400 space-y-1">
                            <p className="font-medium text-slate-600">Thank you for visiting!</p>
                            <p className="italic">Computer Generated Official POS Receipt</p>
                            <p className="font-mono text-[9px] text-slate-400">Keep this slip for follow-up reference</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
