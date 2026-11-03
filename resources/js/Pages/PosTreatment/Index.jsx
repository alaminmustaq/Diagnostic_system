import React, { useState, useEffect, useRef } from 'react';
import { useForm, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/UI/PageHeader';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import TextInput from '../../Components/Form/TextInput';
import SelectInput from '../../Components/Form/SelectInput';
import InvoiceSlip from '../../Components/Print/InvoiceSlip';
import { Table, Thead, Tbody, Th, Td, Tr, EmptyState } from '../../Components/Table';
import {
    Sparkles,
    CreditCard,
    Phone,
    User as UserIcon,
    Plus,
    Trash2,
    CheckCircle2,
    Printer,
    DollarSign,
    Layers,
    Search,
} from 'lucide-react';

export default function PosTreatment({ categories = [], recentPayments = [], today, lastInvoice }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTreatments, setSelectedTreatments] = useState([]);
    const [activeInvoice, setActiveInvoice] = useState(lastInvoice || null);
    const [searchingPhone, setSearchingPhone] = useState(false);
    const [patientStatus, setPatientStatus] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchContainerRef = useRef(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        phone: '',
        name: '',
        treatment_ids: [],
        base_amount: '0.00',
        discount_type: '',
        discount_amount: '0.00',
        final_paid_amount: '0.00',
        payment_date: today,
    });

    useEffect(() => {
        if (lastInvoice) {
            setActiveInvoice(lastInvoice);
        }
    }, [lastInvoice]);

    // Click-outside listener to close suggestions dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Update form when treatments selection changes
    useEffect(() => {
        const subtotal = selectedTreatments.reduce((acc, item) => acc + parseFloat(item.price || 0), 0);
        const tIds = selectedTreatments.map((t) => t.id);

        let finalAmount = subtotal;
        const discValue = parseFloat(data.discount_amount) || 0;

        if (data.discount_type === 'percentage') {
            finalAmount = Math.max(0, subtotal - (subtotal * discValue) / 100);
        } else if (data.discount_type === 'fixed') {
            finalAmount = Math.max(0, subtotal - discValue);
        }

        setData((prev) => ({
            ...prev,
            treatment_ids: tIds,
            base_amount: subtotal.toFixed(2),
            final_paid_amount: finalAmount.toFixed(2),
        }));
    }, [selectedTreatments, data.discount_type, data.discount_amount]);

    // Live search as user types
    const handlePhoneInputChange = (phoneVal) => {
        setData('phone', phoneVal);
        const clean = phoneVal.trim();

        if (clean.length >= 2) {
            handleLiveSearch(clean);
        } else {
            setSuggestions([]);
            setShowDropdown(false);
            setPatientStatus(null);
        }
    };

    const handleLiveSearch = async (cleanPhone) => {
        setSearchingPhone(true);
        try {
            const res = await fetch(`/booking/search-patient?phone=${encodeURIComponent(cleanPhone)}`);
            const result = await res.json();
            const matches = result.matches || [];
            setSuggestions(matches);
            setShowDropdown(true);

            if (result.exists && result.patient) {
                setPatientStatus(result);
                setData((prev) => ({
                    ...prev,
                    phone: result.patient.phone || prev.phone,
                    name: result.patient.name,
                }));
            } else if (cleanPhone.length >= 11 && matches.length === 0) {
                setPatientStatus({ exists: false, has_prior_visits: false, pending_follow_up: null });
            }
        } catch (err) {
            console.error('Error searching patient:', err);
        } finally {
            setSearchingPhone(false);
        }
    };

    const selectPatient = (patient) => {
        setData((prev) => ({
            ...prev,
            phone: patient.phone,
            name: patient.name,
        }));
        setPatientStatus({
            exists: true,
            patient: { id: patient.id, user_code: patient.user_code, name: patient.name, phone: patient.phone },
            has_prior_visits: patient.has_prior_visits,
            pending_follow_up: patient.pending_follow_up,
        });
        setShowDropdown(false);
    };

    const clearPatientSelection = () => {
        setData((prev) => ({
            ...prev,
            phone: '',
            name: '',
        }));
        setPatientStatus(null);
        setSuggestions([]);
        setShowDropdown(false);
    };

    const addTreatmentToCart = (treatment) => {
        setSelectedTreatments((prev) => [...prev, treatment]);
    };

    const removeTreatmentFromCart = (index) => {
        setSelectedTreatments((prev) => prev.filter((_, idx) => idx !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (selectedTreatments.length === 0) {
            alert('Please select at least one treatment service.');
            return;
        }

        post('/pos/store', {
            onSuccess: () => {
                reset('phone', 'name', 'discount_type', 'discount_amount');
                setSelectedTreatments([]);
                setPatientStatus(null);
                setSuggestions([]);
                setShowDropdown(false);
            },
        });
    };

    return (
        <AppLayout title="Treatment POS & Hospital Billing">
            <PageHeader
                title="Point of Sale — Treatment Services"
                subtitle="Administer clinic procedures, laser therapies, and record treatment payments detached from the doctor consultation queue"
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Treatment Catalog & Selector (Left 7 Cols) */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Patient Information Card */}
                    <Card
                        title="Patient Details"
                        subtitle="Phone lookup auto-completes registered patients"
                        className="relative z-30"
                    >
                        <div className="space-y-4">
                            {/* Phone-First Search Input with Live Dropdown */}
                            <div ref={searchContainerRef} className="relative">
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                                        Patient Phone Number or Code (Live Auto-Search) <span className="text-red-500">*</span>
                                    </label>
                                    {patientStatus?.exists && (
                                        <button
                                            type="button"
                                            onClick={clearPatientSelection}
                                            className="text-xs text-teal-600 hover:text-teal-700 font-semibold underline cursor-pointer"
                                        >
                                            Clear / Search Again
                                        </button>
                                    )}
                                </div>
                                <TextInput
                                    placeholder="Type phone (e.g. 018...) or patient code (e.g. PT-0001)..."
                                    icon={Phone}
                                    value={data.phone}
                                    onChange={(e) => handlePhoneInputChange(e.target.value)}
                                    onFocus={() => {
                                        if (data.phone.trim().length >= 2 && suggestions.length > 0) {
                                            setShowDropdown(true);
                                        }
                                    }}
                                    error={errors.phone}
                                    required
                                    autoComplete="off"
                                    helperText="Search instantly by phone number or patient ID code (e.g. PT-0001)"
                                />

                                {searchingPhone && (
                                    <p className="text-xs text-teal-600 font-semibold mt-1 flex items-center gap-1 animate-pulse">
                                        <Search className="w-3.5 h-3.5" /> Searching matching patients...
                                    </p>
                                )}

                                {/* Live Autocomplete Suggestions Dropdown */}
                                {showDropdown && suggestions.length > 0 && (
                                    <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 max-h-64 overflow-y-auto z-50">
                                        <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                                            <span>Matching Registered Patients ({suggestions.length})</span>
                                            <span className="text-teal-600 font-normal">Click to select</span>
                                        </div>
                                        {suggestions.map((p) => (
                                            <div
                                                key={p.id}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    selectPatient(p);
                                                }}
                                                className="p-3 hover:bg-teal-50/70 transition cursor-pointer flex items-center justify-between gap-3 group"
                                            >
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        {p.user_code && (
                                                            <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 font-mono font-bold text-xs border border-teal-200 shrink-0">
                                                                {p.user_code}
                                                            </span>
                                                        )}
                                                        <span className="font-mono font-bold text-sm text-slate-900 group-hover:text-teal-700">
                                                            {p.phone}
                                                        </span>
                                                        <span className="font-semibold text-slate-700 text-xs truncate">
                                                            — {p.name}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="shrink-0 flex items-center gap-2">
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                                                        Registered
                                                    </span>
                                                    <span className="text-xs text-teal-600 font-bold opacity-0 group-hover:opacity-100 transition">
                                                        Select →
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {showDropdown && suggestions.length === 0 && data.phone.trim().length >= 3 && !searchingPhone && (
                                    <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 p-3 text-center text-xs text-slate-500 z-50">
                                        No registered patients found matching <strong className="text-slate-800 font-mono">"{data.phone}"</strong>. Enter patient name below to register as a <strong>New Patient</strong>.
                                    </div>
                                )}
                            </div>

                            {/* Patient Status Feedback Alert */}
                            {patientStatus && (
                                <div>
                                    {patientStatus.exists ? (
                                        <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs space-y-1">
                                            <div className="flex items-center gap-1.5 font-bold text-teal-800">
                                                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                                                <span>
                                                    Existing Patient Verified: {patientStatus.patient.name}{' '}
                                                    {patientStatus.patient.user_code && (
                                                        <span className="font-mono text-teal-700 font-normal">
                                                            [{patientStatus.patient.user_code}]
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                            <p className="text-teal-700">
                                                Registered patient verified. Phone: <span className="font-mono font-semibold">{patientStatus.patient.phone}</span>
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
                                            <span>
                                                New patient. Please enter their full name below.
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Patient Name */}
                            <div>
                                <TextInput
                                    label="Patient Full Name"
                                    placeholder="Enter patient full name"
                                    icon={UserIcon}
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    error={errors.name}
                                    required
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Available Categorized Treatments */}
                    <Card
                        title="Available Treatment Services"
                        subtitle="Click a procedure to add to the invoice ledger"
                        actions={
                            <div className="relative w-48">
                                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search treatments..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                        }
                    >
                        <div className="space-y-6">
                            {categories.map((cat) => {
                                const matchingTreatments = cat.treatments.filter((t) =>
                                    t.name.toLowerCase().includes(searchTerm.toLowerCase())
                                );

                                if (matchingTreatments.length === 0) return null;

                                return (
                                    <div key={cat.id} className="space-y-2.5">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                                {cat.name}
                                            </h4>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            {matchingTreatments.map((t) => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => addTreatmentToCart(t)}
                                                    className="p-3 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 text-left transition flex items-center justify-between group cursor-pointer"
                                                >
                                                    <div className="min-w-0 pr-2">
                                                        <p className="text-xs font-bold text-slate-900 group-hover:text-teal-900 truncate">
                                                            {t.name}
                                                        </p>
                                                        <p className="text-xs font-mono font-bold text-teal-700 mt-0.5">
                                                            {parseFloat(t.price).toFixed(2)} Tk
                                                        </p>
                                                    </div>
                                                    <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-teal-600 group-hover:text-white flex items-center justify-center text-slate-500 shrink-0 transition">
                                                        <Plus className="w-4 h-4" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>

                {/* Billing Summary & Cart Ledger (Right 5 Cols) */}
                <div className="lg:col-span-5 space-y-6">
                    <Card
                        title="Billing Summary & POS Ledger"
                        subtitle="Calculates subtotal, discounts, and payment entry"
                    >
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Selected Items List */}
                            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/60 min-h-[160px] max-h-[220px] overflow-y-auto">
                                {selectedTreatments.length === 0 ? (
                                    <div className="h-32 flex flex-col items-center justify-center text-slate-400 text-xs">
                                        <Sparkles className="w-6 h-6 mb-1 text-slate-300" />
                                        <span>No treatments selected</span>
                                        <span className="text-[11px] text-slate-400">Click treatments on the left to add</span>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedTreatments.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/80 text-xs shadow-2xs"
                                            >
                                                <div className="min-w-0 pr-2">
                                                    <span className="font-bold text-slate-900 block truncate">
                                                        {item.name}
                                                    </span>
                                                    <span className="font-mono text-teal-700 font-semibold">
                                                        {parseFloat(item.price).toFixed(2)} Tk
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeTreatmentFromCart(idx)}
                                                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Discount Controls */}
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <SelectInput
                                    label="Discount Type"
                                    value={data.discount_type}
                                    onChange={(e) => setData('discount_type', e.target.value)}
                                >
                                    <option value="">No Discount</option>
                                    <option value="fixed">Fixed Amount (Tk)</option>
                                    <option value="percentage">Percentage (%)</option>
                                </SelectInput>

                                <TextInput
                                    label="Discount Value"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={data.discount_amount}
                                    onChange={(e) => setData('discount_amount', e.target.value)}
                                    disabled={!data.discount_type}
                                />
                            </div>

                            {/* Totals Breakdown */}
                            <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-200 space-y-1.5 text-xs">
                                <div className="flex justify-between text-slate-600">
                                    <span>Subtotal:</span>
                                    <span className="font-mono font-semibold">{parseFloat(data.base_amount).toFixed(2)} Tk</span>
                                </div>
                                {parseFloat(data.discount_amount) > 0 && (
                                    <div className="flex justify-between text-rose-600">
                                        <span>Discount ({data.discount_type}):</span>
                                        <span className="font-mono font-semibold">
                                            -{parseFloat(data.base_amount - data.final_paid_amount).toFixed(2)} Tk
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                                    <span>Net Paid Amount:</span>
                                    <span className="text-xl font-black font-mono text-teal-700">
                                        {parseFloat(data.final_paid_amount).toFixed(2)} Tk
                                    </span>
                                </div>
                            </div>

                            {/* Submit & Generate Invoice */}
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                loading={processing}
                                disabled={selectedTreatments.length === 0}
                                className="w-full font-bold shadow-md shadow-teal-600/30"
                            >
                                <CreditCard className="w-5 h-5 mr-2" /> Collect Payment & Print Invoice
                            </Button>
                        </form>
                    </Card>

                    {/* Today's Recent Treatment Payments */}
                    <Card
                        title="Today's Treatment Invoices"
                        subtitle="Completed hospital service transactions"
                    >
                        {recentPayments.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-4">No treatments billed today</p>
                        ) : (
                            <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                                {recentPayments.map((p) => (
                                    <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                                        <div>
                                            <span className="font-bold text-slate-900 block">{p.patient?.name}</span>
                                            <span className="text-[11px] text-slate-400 font-mono">
                                                Paid: {parseFloat(p.final_paid_amount).toFixed(2)} Tk
                                            </span>
                                        </div>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => {
                                                setActiveInvoice({
                                                    id: p.id,
                                                    invoice_no: `INV-TRT-${String(p.id).padStart(5, '0')}`,
                                                    date: p.payment_date,
                                                    patient: {
                                                        name: p.patient?.name,
                                                        phone: p.patient?.phone,
                                                    },
                                                    base_amount: p.base_amount,
                                                    discount_type: p.discount_type,
                                                    discount_amount: p.discount_amount,
                                                    final_paid_amount: p.final_paid_amount,
                                                });
                                            }}
                                        >
                                            <Printer className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* Printable POS Invoice Modal */}
            {activeInvoice && (
                <InvoiceSlip
                    invoice={activeInvoice}
                    onClose={() => setActiveInvoice(null)}
                />
            )}
        </AppLayout>
    );
}

