import React, { useState, useEffect, useRef } from 'react';
import { useForm, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/UI/PageHeader';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import TextInput from '../../Components/Form/TextInput';
import SelectInput from '../../Components/Form/SelectInput';
import { Table, Thead, Tbody, Th, Td, Tr, EmptyState } from '../../Components/Table';
import TokenSlip from '../../Components/Print/TokenSlip';
import { usePermissions } from '../../Utils/permissions';
import {
    Ticket,
    Phone,
    User as UserIcon,
    Stethoscope,
    CheckCircle2,
    AlertCircle,
    Printer,
    DollarSign,
    Sparkles,
    Calendar,
    Search,
    Clock,
    CreditCard,
    Landmark,
    Smartphone,
    Banknote,
    Plus,
    Trash2,
    Check,
} from 'lucide-react';

export default function SerialBooking({
    doctors = [],
    recentVisits = [],
    bankAccounts = [],
    mobileBankingAccounts = [],
    today,
    lastBookedVisit,
}) {
    const { can } = usePermissions();
    const [searchingPhone, setSearchingPhone] = useState(false);
    const [patientStatus, setPatientStatus] = useState(null); // { exists, has_prior_visits, pending_follow_up }
    const [activeSlip, setActiveSlip] = useState(lastBookedVisit || null);
    const [suggestions, setSuggestions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchContainerRef = useRef(null);

    const defaultDoctor = doctors.length > 0 ? doctors[0] : null;
    const initialRate = defaultDoctor?.doctor_profile?.default_visit_rate || '1000.00';

    const { data, setData, post, processing, errors, reset } = useForm({
        phone: '',
        name: '',
        doctor_id: defaultDoctor ? defaultDoctor.id : '',
        visit_date: today,
        base_amount: initialRate,
        discount_type: '',
        discount_amount: '0.00',
        final_paid_amount: initialRate,
        payment_method: 'cash',
        bank_account_id: '',
        payment_splits: [
            { payment_method: 'cash', bank_account_id: '', amount: initialRate },
        ],
    });

    // When lastBookedVisit changes from session flash, open slip
    useEffect(() => {
        if (lastBookedVisit) {
            setActiveSlip(lastBookedVisit);
        }
    }, [lastBookedVisit]);

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

    // Recalculate billing when doctor or discount changes
    const recalculateFee = (selectedDocId, discountType, discountAmt) => {
        const doc = doctors.find((d) => d.id === parseInt(selectedDocId));
        const baseRate = doc?.doctor_profile?.default_visit_rate ? parseFloat(doc.doctor_profile.default_visit_rate) : 1000.00;

        let finalAmount = baseRate;
        const discValue = parseFloat(discountAmt) || 0;

        if (discountType === 'percentage') {
            finalAmount = Math.max(0, baseRate - (baseRate * discValue) / 100);
        } else if (discountType === 'fixed') {
            finalAmount = Math.max(0, baseRate - discValue);
        }

        const formattedFinal = finalAmount.toFixed(2);

        setData((prev) => {
            const nextSplits = [...(prev.payment_splits || [])];
            if (nextSplits.length <= 1) {
                nextSplits[0] = {
                    payment_method: nextSplits[0]?.payment_method || 'cash',
                    bank_account_id: nextSplits[0]?.bank_account_id || '',
                    amount: formattedFinal,
                };
            }
            return {
                ...prev,
                base_amount: baseRate.toFixed(2),
                final_paid_amount: formattedFinal,
                payment_splits: nextSplits,
            };
        });
    };

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
                    name: result.patient.name,
                }));
                recalculateFee(data.doctor_id, data.discount_type, data.discount_amount);
            } else if (cleanPhone.length >= 11 && matches.length === 0) {
                setPatientStatus({ exists: false, has_prior_visits: false, pending_follow_up: null });
                recalculateFee(data.doctor_id, data.discount_type, data.discount_amount);
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
        recalculateFee(data.doctor_id, data.discount_type, data.discount_amount);
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
        recalculateFee(data.doctor_id, data.discount_type, data.discount_amount);
    };

    const handleDoctorChange = (docId) => {
        setData('doctor_id', docId);
        recalculateFee(docId, data.discount_type, data.discount_amount);
    };

    const handleDiscountTypeChange = (type) => {
        setData('discount_type', type);
        recalculateFee(data.doctor_id, type, data.discount_amount);
    };

    const handleDiscountAmountChange = (amt) => {
        setData('discount_amount', amt);
        recalculateFee(data.doctor_id, data.discount_type, amt);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/booking/store', {
            onSuccess: () => {
                reset('phone', 'name', 'discount_type', 'discount_amount');
                setPatientStatus(null);
            },
        });
    };

    return (
        <AppLayout title="Serial Booking">
            <PageHeader
                title="Patient Registration & Serial Booking"
                subtitle="Phone-first search, doctor consultation billing, and instant dual-copy token generation"
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Booking Form (Left Column) */}
                <div className="lg:col-span-7">
                    <Card
                        title="Book Patient Serial"
                        subtitle="Single transaction records user, queue serial, payment, and auto-resolves follow-ups"
                        className="relative z-30"
                    >
                        <form onSubmit={handleSubmit} className="space-y-5">
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
                                                    {p.pending_follow_up && (
                                                        <p className="text-[10px] text-amber-700 flex items-center gap-1 mt-0.5 font-medium">
                                                            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                                                            Scheduled Follow-up: {p.pending_follow_up.follow_up_date}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="shrink-0 flex items-center gap-2">
                                                    {p.has_prior_visits ? (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                                                            Returning
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-teal-50 text-teal-700 border border-teal-200">
                                                            Registered
                                                        </span>
                                                    )}
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
                                            {patientStatus.has_prior_visits ? (
                                                <p className="text-teal-700">
                                                    Returning patient verified. Doctor consultation fee loaded.
                                                </p>
                                            ) : (
                                                <p className="text-teal-700">
                                                    First doctor visit for this registered patient. Standard consultation fee loaded.
                                                </p>
                                            )}
                                            {patientStatus.pending_follow_up && (
                                                <div className="mt-2 pt-2 border-t border-teal-200/80 flex items-center gap-1.5 text-amber-800 font-medium">
                                                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                                    <span>
                                                        Active pending follow-up found ({patientStatus.pending_follow_up.follow_up_date}). Booking this serial will <strong>auto-resolve it to Completed</strong>!
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
                                            <span>
                                                New patient. Please enter their full name below. Baseline doctor visit fee will be loaded.
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Patient Name (Locked if existing, editable if new) */}
                            <div>
                                <TextInput
                                    label="Patient Full Name"
                                    placeholder="e.g. Tanvir Ahmed"
                                    icon={UserIcon}
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    error={errors.name}
                                    disabled={patientStatus?.exists}
                                    required
                                    helperText={patientStatus?.exists ? 'Name locked from existing medical record' : 'Enter patient name'}
                                />
                            </div>

                            {/* Doctor Selection & Consultation Date */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <SelectInput
                                    label="Consulting Doctor"
                                    value={data.doctor_id}
                                    onChange={(e) => handleDoctorChange(e.target.value)}
                                    error={errors.doctor_id}
                                    required
                                >
                                    {doctors.map((doc) => (
                                        <option key={doc.id} value={doc.id}>
                                            {doc.name} - {doc.doctor_profile?.room_number || 'Room'} (Base: {parseFloat(doc.doctor_profile?.default_visit_rate || 0).toFixed(0)} Tk)
                                        </option>
                                    ))}
                                </SelectInput>

                                <TextInput
                                    label="Visit Date"
                                    type="date"
                                    icon={Calendar}
                                    value={data.visit_date}
                                    onChange={(e) => setData('visit_date', e.target.value)}
                                    error={errors.visit_date}
                                    required
                                />
                            </div>

                            {/* Billing & Consultation Fee Controls */}
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                        Consultation Fee Calculation
                                    </span>
                                    {patientStatus?.has_prior_visits && (
                                        <Badge variant="info">Returning Patient</Badge>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <TextInput
                                        label="Base Fee"
                                        type="number"
                                        step="0.01"
                                        value={data.base_amount}
                                        onChange={(e) => {
                                            const newBase = e.target.value;
                                            setData((prev) => {
                                                const base = parseFloat(newBase) || 0;
                                                const disc = parseFloat(prev.discount_amount) || 0;
                                                let finalAmt = base;
                                                if (prev.discount_type === 'percentage') {
                                                    finalAmt = Math.max(0, base - (base * disc) / 100);
                                                } else if (prev.discount_type === 'fixed') {
                                                    finalAmt = Math.max(0, base - disc);
                                                }
                                                const formatted = finalAmt.toFixed(2);
                                                const nextSplits = [...(prev.payment_splits || [])];
                                                if (nextSplits.length <= 1) {
                                                    nextSplits[0] = {
                                                        payment_method: nextSplits[0]?.payment_method || 'cash',
                                                        bank_account_id: nextSplits[0]?.bank_account_id || '',
                                                        amount: formatted,
                                                    };
                                                }
                                                return {
                                                    ...prev,
                                                    base_amount: newBase,
                                                    final_paid_amount: formatted,
                                                    payment_splits: nextSplits,
                                                };
                                            });
                                        }}
                                    />

                                    <SelectInput
                                        label="Discount Type"
                                        value={data.discount_type}
                                        onChange={(e) => handleDiscountTypeChange(e.target.value)}
                                    >
                                        <option value="">No Discount</option>
                                        <option value="fixed">Fixed (Tk)</option>
                                        <option value="percentage">Percent (%)</option>
                                    </SelectInput>

                                    <TextInput
                                        label="Discount Value"
                                        type="number"
                                        step="0.01"
                                        value={data.discount_amount}
                                        onChange={(e) => handleDiscountAmountChange(e.target.value)}
                                        disabled={!data.discount_type}
                                    />
                                </div>

                                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-slate-700">Net Payable Amount:</span>
                                    <span className="text-xl font-extrabold font-mono text-teal-800">
                                        {parseFloat(data.final_paid_amount).toFixed(2)} Tk
                                    </span>
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
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2">
                                {can('create-booking') ? (
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        loading={processing}
                                        disabled={!isSplitValid}
                                        className="w-full font-bold shadow-md shadow-teal-600/30"
                                    >
                                        <Ticket className="w-5 h-5 mr-2" /> Book Serial & Issue Dual Token Slip
                                    </Button>
                                ) : (
                                    <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-center text-xs text-slate-500 font-semibold">
                                        View-only mode. "create-booking" permission required to issue tokens.
                                    </div>
                                )}
                            </div>
                        </form>
                    </Card>
                </div>

                {/* Today's Recent Serials (Right Column) */}
                <div className="lg:col-span-5">
                    <Card
                        title="Today's Issued Serials"
                        subtitle={`Recent queue tokens booked for ${today}`}
                    >
                        {recentVisits.length === 0 ? (
                            <EmptyState
                                icon={Ticket}
                                title="No serials issued today"
                                description="Serials booked today will appear here with dynamic token numbers."
                            />
                        ) : (
                            <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto">
                                {recentVisits.map((visit) => (
                                    <div key={visit.id} className="py-3 flex items-center justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-extrabold text-sm text-slate-900 font-mono">
                                                    #{visit.serial_number}
                                                </span>
                                                <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 text-[11px] font-mono font-bold border border-teal-200">
                                                    {visit.token_number}
                                                </span>
                                                <Badge variant={visit.status} size="xs">
                                                    {visit.status}
                                                </Badge>
                                            </div>
                                            <p className="text-xs font-bold text-slate-800 mt-1">
                                                {visit.patient?.name}
                                            </p>
                                            <p className="text-[11px] text-slate-500">
                                                {visit.doctor?.name} ({visit.doctor?.doctor_profile?.room_number})
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                    {visit.invoice_number || visit.payment?.invoice_number || 'No Inv'}
                                                </span>
                                                {visit.payment?.splits && visit.payment.splits.length > 1 ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                                        Split ({visit.payment.splits.length})
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-50 text-slate-700 capitalize border border-slate-200">
                                                        {visit.payment?.payment_method === 'bank'
                                                            ? `Bank: ${visit.payment?.bank_account?.bank_name || 'Bank'}`
                                                            : visit.payment?.payment_method === 'mobile_banking'
                                                            ? `Mobile: ${visit.payment?.bank_account?.bank_name || visit.payment?.bank_account?.account_name || 'Mobile'}`
                                                            : 'Cash'}
                                                    </span>
                                                )}
                                                <span className="text-[11px] font-mono font-bold text-teal-800">
                                                    {parseFloat(visit.fee || 0).toFixed(2)} Tk
                                                </span>
                                            </div>
                                        </div>

                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => {
                                                setActiveSlip({
                                                    id: visit.id,
                                                    serial_number: visit.serial_number,
                                                    token_number: visit.token_number,
                                                    invoice_number: visit.invoice_number || visit.payment?.invoice_number,
                                                    payment_method: visit.payment?.payment_method || 'cash',
                                                    bank_account_name: visit.payment?.bank_account ? (visit.payment.bank_account.bank_name || visit.payment.bank_account.account_name) : null,
                                                    bank_account_number: visit.payment?.bank_account?.account_number,
                                                    payment_splits: visit.payment?.splits?.map(s => ({
                                                        payment_method: s.payment_method,
                                                        amount: s.amount,
                                                        bank_name: s.bank_account?.bank_name || s.bank_account?.account_name,
                                                        account_number: s.bank_account?.account_number,
                                                    })) || [],
                                                    visit_date: visit.visit_date,
                                                    patient_name: visit.patient?.name,
                                                    patient_phone: visit.patient?.phone,
                                                    doctor_name: visit.doctor?.name,
                                                    doctor_designation: visit.doctor?.doctor_profile?.designation,
                                                    room_number: visit.doctor?.doctor_profile?.room_number,
                                                    fee: visit.fee || '0.00',
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

            {/* Instant Dual Copy Printable Slip Modal */}
            {activeSlip && (
                <TokenSlip
                    visit={activeSlip}
                    onClose={() => setActiveSlip(null)}
                />
            )}
        </AppLayout>
    );
}

