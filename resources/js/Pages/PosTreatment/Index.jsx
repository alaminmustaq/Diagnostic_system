import React, { useState, useEffect, useRef } from 'react';
import { useForm, router, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/UI/PageHeader';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import TextInput from '../../Components/Form/TextInput';
import SelectInput from '../../Components/Form/SelectInput';
import InvoiceSlip from '../../Components/Print/InvoiceSlip';
import { usePermissions } from '../../Utils/permissions';
import {
    Sparkles,
    CreditCard,
    Phone,
    User as UserIcon,
    Plus,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Check,
    Printer,
    DollarSign,
    Layers,
    Search,
    Landmark,
    Smartphone,
    Banknote,
    Activity,
} from 'lucide-react';

export default function PosTreatment({
    categories = [],
    recentPayments = [],
    bankAccounts = [],
    mobileBankingAccounts = [],
    today,
    lastInvoice,
}) {
    const { can } = usePermissions();
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
        payment_method: 'cash',
        bank_account_id: '',
        payment_splits: [
            { payment_method: 'cash', bank_account_id: '', amount: '0.00' },
        ],
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

    // Split payment helpers
    const splitTotal = (data.payment_splits || []).reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
    const netPayable = parseFloat(data.final_paid_amount) || 0;
    const splitDiff = Math.round((netPayable - splitTotal) * 100) / 100;
    const isSplitValid = netPayable === 0 || Math.abs(splitDiff) < 0.01;

    const updateSplit = (index, field, value) => {
        setData((prev) => {
            const nextSplits = [...prev.payment_splits];
            nextSplits[index] = { ...nextSplits[index], [field]: value };
            if (field === 'payment_method' && value === 'cash') {
                nextSplits[index].bank_account_id = '';
            } else if (field === 'payment_method' && value === 'bank' && !nextSplits[index].bank_account_id) {
                nextSplits[index].bank_account_id = bankAccounts[0]?.id || '';
            } else if (field === 'payment_method' && value === 'mobile_banking' && !nextSplits[index].bank_account_id) {
                nextSplits[index].bank_account_id = mobileBankingAccounts[0]?.id || '';
            }
            return { ...prev, payment_splits: nextSplits };
        });
    };

    const addSplitRow = () => {
        setData((prev) => {
            const currentSum = (prev.payment_splits || []).reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
            const remaining = Math.max(0, (parseFloat(prev.final_paid_amount) || 0) - currentSum);
            const defaultMethod = bankAccounts.length > 0 ? 'bank' : (mobileBankingAccounts.length > 0 ? 'mobile_banking' : 'cash');
            const defaultBankId = defaultMethod === 'bank' ? (bankAccounts[0]?.id || '') : (defaultMethod === 'mobile_banking' ? (mobileBankingAccounts[0]?.id || '') : '');

            return {
                ...prev,
                payment_splits: [
                    ...prev.payment_splits,
                    {
                        payment_method: defaultMethod,
                        bank_account_id: defaultBankId,
                        amount: remaining > 0 ? remaining.toFixed(2) : '0.00',
                    },
                ],
            };
        });
    };

    const removeSplitRow = (index) => {
        setData((prev) => {
            if (prev.payment_splits.length <= 1) return prev;
            const nextSplits = prev.payment_splits.filter((_, idx) => idx !== index);
            return { ...prev, payment_splits: nextSplits };
        });
    };

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

        const formattedFinal = finalAmount.toFixed(2);

        setData((prev) => {
            let nextSplits = [...(prev.payment_splits || [])];
            if (nextSplits.length <= 1) {
                nextSplits = [
                    {
                        payment_method: nextSplits[0]?.payment_method || 'cash',
                        bank_account_id: nextSplits[0]?.bank_account_id || '',
                        amount: formattedFinal,
                    },
                ];
            }
            return {
                ...prev,
                treatment_ids: tIds,
                base_amount: subtotal.toFixed(2),
                final_paid_amount: formattedFinal,
                payment_splits: nextSplits,
            };
        });
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

        if (!isSplitValid) {
            alert('Payment split amounts must equal the net paid amount.');
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
                actions={
                    <div className="flex items-center gap-3">
                        <Link href="/patient-treatments">
                            <Button variant="secondary" size="sm">
                                <Activity className="w-4 h-4 mr-1.5" /> View Patient Treatments List
                            </Button>
                        </Link>
                    </div>
                }
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

                            {/* Payment Method & Split Allocation */}
                            <div className="pt-3 border-t border-slate-200 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                            Payment Method & Split Allocation
                                        </span>
                                        <p className="text-[11px] text-slate-500">
                                            Pay in single method or split across multiple Cash, Bank & Mobile accounts
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addSplitRow}
                                        className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 rounded-lg border border-teal-200 transition cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Add Split</span>
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {data.payment_splits.map((split, idx) => (
                                        <div key={idx} className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center">
                                                        #{idx + 1}
                                                    </span>
                                                    <div className="flex items-center gap-1">
                                                        {[
                                                            { id: 'cash', label: 'Cash', icon: Banknote },
                                                            { id: 'bank', label: 'Bank', icon: Landmark },
                                                            { id: 'mobile_banking', label: 'Mobile', icon: Smartphone },
                                                        ].map((pm) => {
                                                            const Icon = pm.icon;
                                                            const isSelected = split.payment_method === pm.id;
                                                            return (
                                                                <button
                                                                    key={pm.id}
                                                                    type="button"
                                                                    onClick={() => updateSplit(idx, 'payment_method', pm.id)}
                                                                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                                                                        isSelected
                                                                            ? 'bg-teal-600 text-white shadow-2xs'
                                                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                                    }`}
                                                                >
                                                                    <Icon className="w-3 h-3" />
                                                                    <span>{pm.label}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {data.payment_splits.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSplitRow(idx)}
                                                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                                        title="Remove split"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {split.payment_method === 'bank' ? (
                                                    <SelectInput
                                                        value={split.bank_account_id}
                                                        onChange={(e) => updateSplit(idx, 'bank_account_id', e.target.value)}
                                                        required
                                                    >
                                                        <option value="">-- Choose Bank Account --</option>
                                                        {bankAccounts.map((b) => (
                                                            <option key={b.id} value={b.id}>
                                                                {b.bank_name} - {b.account_number} ({b.account_name})
                                                            </option>
                                                        ))}
                                                    </SelectInput>
                                                ) : split.payment_method === 'mobile_banking' ? (
                                                    <SelectInput
                                                        value={split.bank_account_id}
                                                        onChange={(e) => updateSplit(idx, 'bank_account_id', e.target.value)}
                                                        required
                                                    >
                                                        <option value="">-- Choose Mobile Banking --</option>
                                                        {mobileBankingAccounts.map((m) => (
                                                            <option key={m.id} value={m.id}>
                                                                {m.bank_name ? `${m.bank_name} - ` : ''}{m.account_number} ({m.account_type || 'Personal'}: {m.account_name})
                                                            </option>
                                                        ))}
                                                    </SelectInput>
                                                ) : (
                                                    <div className="flex items-center px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                                                        <Banknote className="w-4 h-4 text-emerald-600 mr-2" />
                                                        Cash Counter Receipt
                                                    </div>
                                                )}

                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0.01"
                                                        placeholder="Amount (Tk)"
                                                        value={split.amount}
                                                        onChange={(e) => updateSplit(idx, 'amount', e.target.value)}
                                                        className="w-full pl-3 pr-8 py-2 text-sm font-mono font-bold rounded-lg border border-slate-300 text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                                        required
                                                    />
                                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                                                        Tk
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Split Validation Banner */}
                                <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                                    isSplitValid
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                        : 'bg-amber-50 border-amber-200 text-amber-800'
                                }`}>
                                    <div className="flex items-center gap-1.5 font-medium">
                                        {isSplitValid ? (
                                            <>
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                <span>Total Allocated: {splitTotal.toFixed(2)} Tk (Matched)</span>
                                            </>
                                        ) : splitDiff > 0 ? (
                                            <>
                                                <AlertCircle className="w-4 h-4 text-amber-600" />
                                                <span>Remaining to allocate: {splitDiff.toFixed(2)} Tk</span>
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle className="w-4 h-4 text-rose-600" />
                                                <span>Over-allocated by {Math.abs(splitDiff).toFixed(2)} Tk</span>
                                            </>
                                        )}
                                    </div>
                                    {!isSplitValid && splitDiff > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const lastIdx = data.payment_splits.length - 1;
                                                const currentAmt = parseFloat(data.payment_splits[lastIdx].amount) || 0;
                                                updateSplit(lastIdx, 'amount', (currentAmt + splitDiff).toFixed(2));
                                            }}
                                            className="text-[11px] underline font-bold hover:text-amber-900 cursor-pointer"
                                        >
                                            Auto-fill Remaining
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Submit & Generate Invoice */}
                            {can('create-pos-treatment') ? (
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    loading={processing}
                                    disabled={selectedTreatments.length === 0 || !isSplitValid}
                                    className="w-full font-bold shadow-md shadow-teal-600/30"
                                >
                                    <CreditCard className="w-5 h-5 mr-2" /> Collect Payment & Print Invoice
                                </Button>
                            ) : (
                                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-center text-xs text-slate-500 font-semibold">
                                    View-only mode. "create-pos-treatment" permission required to bill procedures.
                                </div>
                            )}
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
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] border border-slate-200">
                                                    {p.invoice_number || `INV-TRT-${String(p.id).padStart(5, '0')}`}
                                                </span>
                                                {p.splits && p.splits.length > 1 ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                                        Split ({p.splits.length})
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-50 text-slate-700 capitalize border border-slate-200">
                                                        {p.payment_method === 'bank'
                                                            ? `Bank: ${p.bank_account?.bank_name || 'Bank'}`
                                                            : p.payment_method === 'mobile_banking'
                                                            ? `Mobile: ${p.bank_account?.bank_name || p.bank_account?.account_name || 'Mobile'}`
                                                            : 'Cash'}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="font-bold text-slate-900 block mt-1">{p.patient?.name}</span>
                                            <span className="text-[11px] text-teal-800 font-bold font-mono">
                                                Paid: {parseFloat(p.final_paid_amount).toFixed(2)} Tk
                                            </span>
                                        </div>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => {
                                                const firstPt = p.patient_treatments?.[0];
                                                setActiveInvoice({
                                                    id: p.id,
                                                    invoice_no: p.invoice_number || `INV-TRT-${String(p.id).padStart(5, '0')}`,
                                                    token_number: firstPt?.token_number,
                                                    payment_method: p.payment_method || 'cash',
                                                    bank_account_name: p.bank_account ? (p.bank_account.bank_name || p.bank_account.account_name) : null,
                                                    bank_account_number: p.bank_account?.account_number,
                                                    payment_splits: p.splits?.map((s) => ({
                                                        payment_method: s.payment_method,
                                                        amount: s.amount,
                                                        bank_name: s.bank_account?.bank_name || s.bank_account?.account_name,
                                                        account_number: s.bank_account?.account_number,
                                                    })) || [],
                                                    date: p.payment_date,
                                                    patient: {
                                                        user_code: p.patient?.user_code,
                                                        name: p.patient?.name,
                                                        phone: p.patient?.phone,
                                                    },
                                                    items: p.patient_treatments?.map((pt) => ({
                                                        name: pt.treatment?.name,
                                                        price: pt.treatment?.price,
                                                        room_number: pt.treatment?.room?.room_number,
                                                    })) || [],
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

