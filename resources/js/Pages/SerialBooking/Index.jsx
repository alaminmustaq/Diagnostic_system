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
} from 'lucide-react';

export default function SerialBooking({ doctors = [], recentVisits = [], today, lastBookedVisit }) {
    const [searchingPhone, setSearchingPhone] = useState(false);
    const [patientStatus, setPatientStatus] = useState(null); // { exists, has_prior_visits, pending_follow_up }
    const [activeSlip, setActiveSlip] = useState(lastBookedVisit || null);
    const [suggestions, setSuggestions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchContainerRef = useRef(null);

    const defaultDoctor = doctors.length > 0 ? doctors[0] : null;

    const { data, setData, post, processing, errors, reset } = useForm({
        phone: '',
        name: '',
        doctor_id: defaultDoctor ? defaultDoctor.id : '',
        visit_date: today,
        base_amount: defaultDoctor?.doctor_profile?.default_visit_rate || '1000.00',
        discount_type: '',
        discount_amount: '0.00',
        final_paid_amount: defaultDoctor?.doctor_profile?.default_visit_rate || '1000.00',
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

    // Recalculate billing when doctor, discount or patient status changes
    const recalculateFee = (selectedDocId, discountType, discountAmt, isExisting) => {
        if (isExisting) {
            // First Visit Only Policy: existing patient = 0 fee
            setData((prev) => ({
                ...prev,
                base_amount: '0.00',
                discount_type: '',
                discount_amount: '0.00',
                final_paid_amount: '0.00',
            }));
            return;
        }

        const doc = doctors.find((d) => d.id === parseInt(selectedDocId));
        const baseRate = doc?.doctor_profile?.default_visit_rate ? parseFloat(doc.doctor_profile.default_visit_rate) : 1000.00;

        let finalAmount = baseRate;
        const discValue = parseFloat(discountAmt) || 0;

        if (discountType === 'percentage') {
            finalAmount = Math.max(0, baseRate - (baseRate * discValue) / 100);
        } else if (discountType === 'fixed') {
            finalAmount = Math.max(0, baseRate - discValue);
        }

        setData((prev) => ({
            ...prev,
            base_amount: baseRate.toFixed(2),
            final_paid_amount: finalAmount.toFixed(2),
        }));
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
                recalculateFee(data.doctor_id, data.discount_type, data.discount_amount, result.has_prior_visits);
            } else if (cleanPhone.length >= 11 && matches.length === 0) {
                setPatientStatus({ exists: false, has_prior_visits: false, pending_follow_up: null });
                recalculateFee(data.doctor_id, data.discount_type, data.discount_amount, false);
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
            patient: { id: patient.id, name: patient.name, phone: patient.phone },
            has_prior_visits: patient.has_prior_visits,
            pending_follow_up: patient.pending_follow_up,
        });
        recalculateFee(data.doctor_id, data.discount_type, data.discount_amount, patient.has_prior_visits);
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
        recalculateFee(data.doctor_id, data.discount_type, data.discount_amount, false);
    };

    const handleDoctorChange = (docId) => {
        setData('doctor_id', docId);
        recalculateFee(docId, data.discount_type, data.discount_amount, patientStatus?.has_prior_visits);
    };

    const handleDiscountTypeChange = (type) => {
        setData('discount_type', type);
        recalculateFee(data.doctor_id, type, data.discount_amount, patientStatus?.has_prior_visits);
    };

    const handleDiscountAmountChange = (amt) => {
        setData('discount_amount', amt);
        recalculateFee(data.doctor_id, data.discount_type, amt, patientStatus?.has_prior_visits);
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
                subtitle="Phone-first search, automatic First-Visit-Only billing, and instant dual-copy token generation"
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Booking Form (Left Column) */}
                <div className="lg:col-span-7">
                    <Card
                        title="Book Patient Serial"
                        subtitle="Single transaction records user, queue serial, payment, and auto-resolves follow-ups"
                    >
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Phone-First Search Input with Live Dropdown */}
                            <div ref={searchContainerRef} className="relative">
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                                        Patient Phone Number (Live Auto-Search)
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
                                    placeholder="Type number (e.g. 018...) to search returning patients"
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
                                    helperText="Type 018... to instantly view matching numbers"
                                />

                                {searchingPhone && (
                                    <p className="text-xs text-teal-600 font-semibold mt-1 flex items-center gap-1 animate-pulse">
                                        <Search className="w-3.5 h-3.5" /> Searching matching numbers...
                                    </p>
                                )}

                                {/* Live Autocomplete Suggestions Dropdown */}
                                {showDropdown && suggestions.length > 0 && (
                                    <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 max-h-64 overflow-y-auto z-40">
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
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            Free Visit
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
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
                                    <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 p-3 text-center text-xs text-slate-500 z-40">
                                        No registered patients found starting with <strong className="text-slate-800 font-mono">"{data.phone}"</strong>. Enter patient name below to register as a <strong>New Patient</strong>.
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
                                                <span>Existing Patient Verified: {patientStatus.patient.name}</span>
                                            </div>
                                            {patientStatus.has_prior_visits ? (
                                                <p className="text-teal-700">
                                                    ✓ First Visit Policy Applied: Prior visits found on record. Visit consultation fee is set to <strong>0.00 Tk (Free Visit)</strong>.
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

                            {/* Billing & First-Visit-Only Discount Controls */}
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                        Consultation Fee Calculation
                                    </span>
                                    {patientStatus?.has_prior_visits && (
                                        <Badge variant="completed">Follow-up / Returning (0 Fee)</Badge>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <TextInput
                                        label="Base Fee"
                                        type="number"
                                        step="0.01"
                                        value={data.base_amount}
                                        onChange={(e) => {
                                            setData('base_amount', e.target.value);
                                            recalculateFee(data.doctor_id, data.discount_type, data.discount_amount, false);
                                        }}
                                        disabled={patientStatus?.has_prior_visits}
                                    />

                                    <SelectInput
                                        label="Discount Type"
                                        value={data.discount_type}
                                        onChange={(e) => handleDiscountTypeChange(e.target.value)}
                                        disabled={patientStatus?.has_prior_visits}
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
                                        disabled={!data.discount_type || patientStatus?.has_prior_visits}
                                    />
                                </div>

                                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-slate-700">Net Payable Amount:</span>
                                    <span className="text-xl font-extrabold font-mono text-teal-800">
                                        {parseFloat(data.final_paid_amount).toFixed(2)} Tk
                                    </span>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    loading={processing}
                                    className="w-full font-bold shadow-md shadow-teal-600/30"
                                >
                                    <Ticket className="w-5 h-5 mr-2" /> Book Serial & Issue Dual Token Slip
                                </Button>
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
                                        </div>

                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => {
                                                setActiveSlip({
                                                    id: visit.id,
                                                    serial_number: visit.serial_number,
                                                    token_number: visit.token_number,
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

