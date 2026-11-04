import React, { useState } from 'react';
import { router, Link, useForm } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/UI/PageHeader';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import { Table, Thead, Tbody, Th, Td, Tr, EmptyState } from '../../Components/Table';
import Modal from '../../Components/Modal/Modal';
import TextInput from '../../Components/Form/TextInput';
import SelectInput from '../../Components/Form/SelectInput';
import InvoiceSlip from '../../Components/Print/InvoiceSlip';
import { usePermissions } from '../../Utils/permissions';
import {
    Activity,
    CreditCard,
    Search,
    Printer,
    Pencil,
    Trash2,
    Clock,
    CheckCircle2,
    DoorOpen,
    Calendar,
    Filter,
    X,
    Sparkles,
} from 'lucide-react';

export default function Index({
    patientTreatments = [],
    allTreatments = [],
    filters = {},
    stats = {},
    today,
}) {
    const { can } = usePermissions();

    // Client search and filter states
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [dateFilter, setDateFilter] = useState(filters.date || '');
    const [activeInvoice, setActiveInvoice] = useState(null);

    // Edit modal form state
    const [editingTreatment, setEditingTreatment] = useState(null);
    const editForm = useForm({
        treatment_id: '',
        status: 'waiting',
        date_administered: '',
    });

    const openEditModal = (record) => {
        setEditingTreatment(record);
        editForm.setData({
            treatment_id: record.treatment_id || record.treatment?.id || '',
            status: record.status || 'waiting',
            date_administered: record.date_administered || today || new Date().toISOString().split('T')[0],
        });
    };

    const handleUpdateRecord = (e) => {
        e.preventDefault();
        if (!editingTreatment) return;

        editForm.put(`/patient-treatments/${editingTreatment.id}`, {
            preserveScroll: true,
            onSuccess: () => setEditingTreatment(null),
        });
    };

    const handleDeleteRecord = (id, token) => {
        const identifier = token || `#${id}`;
        if (confirm(`Are you sure you want to delete patient treatment record ${identifier}? This action will safely remove it from the system.`)) {
            router.delete(`/patient-treatments/${id}`, { preserveScroll: true });
        }
    };

    // Filter patient treatments based on search, status tab, and date
    const filteredRecords = patientTreatments.filter((record) => {
        // Status filter
        if (statusFilter !== 'all' && record.status !== statusFilter) {
            return false;
        }

        // Date filter
        if (dateFilter && record.date_administered !== dateFilter) {
            return false;
        }

        // Search query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            const tokenMatch = (record.token_number || '').toLowerCase().includes(q);
            const patientNameMatch = (record.patient?.name || '').toLowerCase().includes(q);
            const patientCodeMatch = (record.patient?.user_code || '').toLowerCase().includes(q);
            const phoneMatch = (record.patient?.phone || '').toLowerCase().includes(q);
            const treatmentMatch = (record.treatment?.name || '').toLowerCase().includes(q);
            const invoiceMatch = (record.invoice_number || record.payment?.invoice_number || '').toLowerCase().includes(q);

            return tokenMatch || patientNameMatch || patientCodeMatch || phoneMatch || treatmentMatch || invoiceMatch;
        }

        return true;
    });

    return (
        <AppLayout title="Patient Treatments Record Log">
            <PageHeader
                title="Patient Treatments Taking Records"
                subtitle="Dedicated procedure log of all clinical treatments taken by patients with status tracking, edit, delete, and invoice slip printing"
                actions={
                    <div className="flex items-center gap-3">
                        <Link href="/pos">
                            <Button variant="primary" size="sm">
                                <CreditCard className="w-4 h-4 mr-1.5" /> Open Treatment POS
                            </Button>
                        </Link>
                    </div>
                }
            />

            {/* Top Stat Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider">Total Records</span>
                        <Activity className="w-4 h-4 text-teal-600" />
                    </div>
                    <span className="text-2xl font-black text-slate-900 font-mono">
                        {stats.total ?? patientTreatments.length}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">Administered entries</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs">
                    <div className="flex items-center justify-between text-amber-700 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider">Waiting</span>
                        <Clock className="w-4 h-4 text-amber-500" />
                    </div>
                    <span className="text-2xl font-black text-amber-900 font-mono">
                        {stats.waiting ?? patientTreatments.filter((t) => t.status === 'waiting').length}
                    </span>
                    <span className="text-[11px] text-amber-600/80 block mt-0.5">Queued in lounge</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-2xs">
                    <div className="flex items-center justify-between text-indigo-700 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider">In Collection</span>
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                    </div>
                    <span className="text-2xl font-black text-indigo-900 font-mono">
                        {stats.in_collection ?? patientTreatments.filter((t) => t.status === 'in_collection').length}
                    </span>
                    <span className="text-[11px] text-indigo-600/80 block mt-0.5">Procedure ongoing</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs">
                    <div className="flex items-center justify-between text-emerald-700 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider">Sample / Done</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <span className="text-2xl font-black text-emerald-900 font-mono">
                        {stats.sample ?? patientTreatments.filter((t) => t.status === 'sample').length}
                    </span>
                    <span className="text-[11px] text-emerald-600/80 block mt-0.5">Completed today</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-teal-200 shadow-2xs col-span-2 md:col-span-1">
                    <div className="flex items-center justify-between text-teal-700 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider">Today's Total</span>
                        <Calendar className="w-4 h-4 text-teal-600" />
                    </div>
                    <span className="text-2xl font-black text-teal-900 font-mono">
                        {stats.today_total ?? patientTreatments.filter((t) => t.date_administered === today).length}
                    </span>
                    <span className="text-[11px] text-teal-600/80 block mt-0.5">Date: {today}</span>
                </div>
            </div>

            {/* Filter and Search Controls */}
            <Card
                className="mb-6"
                bodyClassName="p-4"
            >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Status Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                        {[
                            { key: 'all', label: 'All Records', count: patientTreatments.length },
                            { key: 'waiting', label: 'Waiting', count: patientTreatments.filter((t) => t.status === 'waiting').length },
                            { key: 'in_collection', label: 'In Collection', count: patientTreatments.filter((t) => t.status === 'in_collection').length },
                            { key: 'sample', label: 'Sample (Done)', count: patientTreatments.filter((t) => t.status === 'sample').length },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setStatusFilter(tab.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                                    statusFilter === tab.key
                                        ? 'bg-slate-900 text-white shadow-2xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                                }`}
                            >
                                {tab.label} <span className="opacity-75 font-mono text-[11px]">({tab.count})</span>
                            </button>
                        ))}
                    </div>

                    {/* Search & Date Filter Inputs */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="relative flex-1 sm:w-72">
                            <input
                                type="text"
                                placeholder="Search token, patient, phone, procedure..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-8 py-2 text-xs rounded-lg border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-2xs"
                            />
                            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="p-1 text-slate-400 hover:text-slate-600 absolute right-2 top-1/2 -translate-y-1/2"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="py-1.5 px-3 text-xs rounded-lg border border-slate-300 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                                title="Filter by administered date"
                            />
                            {dateFilter && (
                                <Button
                                    variant="ghost"
                                    size="xs"
                                    onClick={() => setDateFilter('')}
                                    title="Clear date filter"
                                    className="text-slate-500 hover:text-rose-600"
                                >
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Patient Treatments Data Table & Mobile Cards */}
            <Card bodyClassName="p-0 sm:p-0">
                {filteredRecords.length === 0 ? (
                    <div className="p-6">
                        <EmptyState
                            icon={Activity}
                            title="No patient treatment records match your filters"
                            description={
                                searchQuery || statusFilter !== 'all' || dateFilter
                                    ? 'Try adjusting your search query, status tab, or date filter.'
                                    : 'No procedures have been administered to patients yet. Create a bill from the Treatment POS to log records.'
                            }
                        />
                    </div>
                ) : (
                    <>
                        {/* 1. Desktop & Tablet Streamlined Responsive Table (md:block) */}
                        <div className="hidden md:block">
                            <Table className="w-full">
                                <Thead>
                                    <Tr>
                                        <Th className="w-24">Token #</Th>
                                        <Th className="w-48">Patient</Th>
                                        <Th>Procedure & Room</Th>
                                        <Th className="w-36">Status & Date</Th>
                                        <Th className="w-40">Billing & Invoice</Th>
                                        <Th align="right" className="w-32">Actions</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {filteredRecords.map((item) => {
                                        const rowColor = item.treatment?.color;
                                        return (
                                            <Tr
                                                key={item.id}
                                                style={rowColor ? { backgroundColor: `${rowColor}06`, borderLeft: `3px solid ${rowColor}` } : undefined}
                                            >
                                                <Td>
                                                    <span className="inline-block px-2.5 py-1 rounded bg-teal-50 text-teal-900 font-mono text-xs font-black border border-teal-200 shadow-2xs">
                                                        {item.token_number || `#${item.id}`}
                                                    </span>
                                                </Td>
                                                <Td className="whitespace-normal">
                                                    <span className="font-bold text-slate-900 block text-xs">
                                                        {item.patient?.name || 'Walk-in Patient'}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono mt-0.5">
                                                        {item.patient?.user_code && (
                                                            <span className="text-slate-400">ID: {item.patient.user_code}</span>
                                                        )}
                                                        {item.patient?.user_code && item.patient?.phone && <span>•</span>}
                                                        {item.patient?.phone && <span>{item.patient.phone}</span>}
                                                    </div>
                                                </Td>
                                                <Td className="whitespace-normal">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            {rowColor && (
                                                                <span
                                                                    className="w-3 h-3 rounded-full shrink-0 border border-slate-300 shadow-2xs"
                                                                    style={{ backgroundColor: rowColor }}
                                                                    title={`Color: ${rowColor}`}
                                                                />
                                                            )}
                                                            <span className="font-bold text-slate-800 text-xs">
                                                                {item.treatment?.name || 'Procedure'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[11px] flex-wrap">
                                                            <span className="text-slate-500 font-medium">
                                                                {item.treatment?.category?.name || 'General Procedure'}
                                                            </span>
                                                            {item.treatment?.room && (
                                                                <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">
                                                                    <DoorOpen className="w-3 h-3 text-slate-500" />
                                                                    {item.treatment.room.room_number}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Td>
                                                <Td className="whitespace-normal">
                                                    <Badge variant={item.status}>
                                                        {item.status === 'in_collection'
                                                            ? 'In Collection'
                                                            : item.status === 'sample'
                                                            ? 'Sample (Done)'
                                                            : 'Waiting'}
                                                    </Badge>
                                                    <span className="block text-[11px] font-medium text-slate-500 font-mono mt-1">
                                                        {item.date_administered}
                                                    </span>
                                                </Td>
                                                <Td className="whitespace-normal">
                                                    <span className="font-mono font-bold text-xs text-slate-900 block">
                                                        {parseFloat(item.treatment?.price || 0).toFixed(0)} Tk
                                                    </span>
                                                    <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                                                        <span>{item.invoice_number || item.payment?.invoice_number || '—'}</span>
                                                        {item.payment && (
                                                            <span className="ml-1 text-teal-700 font-bold uppercase text-[10px]">
                                                                ({item.payment.payment_method === 'multiple'
                                                                    ? `Split (${item.payment.splits?.length || 'Multi'})`
                                                                    : item.payment.payment_method})
                                                            </span>
                                                        )}
                                                    </div>
                                                </Td>
                                                <Td align="right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {/* Print Receipt / Slip */}
                                                        {item.payment && (
                                                            <Button
                                                                variant="secondary"
                                                                size="xs"
                                                                onClick={() => {
                                                                    setActiveInvoice({
                                                                        id: item.payment.id,
                                                                        invoice_no: item.invoice_number || item.payment.invoice_number,
                                                                        token_number: item.token_number,
                                                                        payment_method: item.payment.payment_method,
                                                                        bank_account_name: item.payment.bank_account
                                                                            ? (item.payment.bank_account.bank_name || item.payment.bank_account.account_name)
                                                                            : null,
                                                                        bank_account_number: item.payment.bank_account?.account_number,
                                                                        payment_splits: item.payment.splits?.map((s) => ({
                                                                            payment_method: s.payment_method,
                                                                            amount: s.amount,
                                                                            bank_name: s.bank_account?.bank_name || s.bank_account?.account_name,
                                                                            account_number: s.bank_account?.account_number,
                                                                        })) || [],
                                                                        date: item.date_administered,
                                                                        patient: {
                                                                            user_code: item.patient?.user_code,
                                                                            name: item.patient?.name,
                                                                            phone: item.patient?.phone,
                                                                        },
                                                                        items: [{
                                                                            name: item.treatment?.name,
                                                                            price: item.treatment?.price,
                                                                            room_number: item.treatment?.room?.room_number,
                                                                        }],
                                                                        base_amount: item.treatment?.price,
                                                                        discount_type: null,
                                                                        discount_amount: 0,
                                                                        final_paid_amount: item.treatment?.price,
                                                                    });
                                                                }}
                                                                title="Print Invoice Receipt"
                                                            >
                                                                <Printer className="w-3.5 h-3.5" />
                                                            </Button>
                                                        )}

                                                        {/* Edit Record */}
                                                        {(can('edit-patient-treatments') || can('update-patient-treatments') || can('edit-pos-treatment') || can('update-pos-treatment')) && (
                                                            <Button
                                                                variant="outline"
                                                                size="xs"
                                                                onClick={() => openEditModal(item)}
                                                                title="Edit Treatment Record"
                                                                className="text-teal-700 border-teal-300 hover:bg-teal-50"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                                                            </Button>
                                                        )}

                                                        {/* Delete Record */}
                                                        {(can('delete-patient-treatments') || can('delete-pos-treatment')) && (
                                                            <Button
                                                                variant="ghost"
                                                                size="xs"
                                                                onClick={() => handleDeleteRecord(item.id, item.token_number)}
                                                                title="Delete Treatment Record"
                                                                className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </Td>
                                            </Tr>
                                        );
                                    })}
                                </Tbody>
                            </Table>
                        </div>

                        {/* 2. Mobile Responsive Card List (md:hidden) */}
                        <div className="md:hidden divide-y divide-slate-100">
                            {filteredRecords.map((item) => {
                                const rowColor = item.treatment?.color;
                                return (
                                    <div
                                        key={item.id}
                                        className="p-4 space-y-3"
                                        style={rowColor ? { borderLeft: `4px solid ${rowColor}`, backgroundColor: `${rowColor}06` } : undefined}
                                    >
                                        {/* Top Line: Token and Status Badge */}
                                        <div className="flex items-center justify-between">
                                            <span className="inline-block px-2.5 py-1 rounded bg-teal-50 text-teal-900 font-mono text-xs font-black border border-teal-200 shadow-2xs">
                                                {item.token_number || `#${item.id}`}
                                            </span>
                                            <Badge variant={item.status}>
                                                {item.status === 'in_collection'
                                                    ? 'In Collection'
                                                    : item.status === 'sample'
                                                    ? 'Sample (Done)'
                                                    : 'Waiting'}
                                            </Badge>
                                        </div>

                                        {/* Middle: Patient and Price */}
                                        <div className="flex justify-between items-start gap-2">
                                            <div>
                                                <span className="font-bold text-slate-900 text-sm block">
                                                    {item.patient?.name || 'Walk-in Patient'}
                                                </span>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono mt-0.5">
                                                    {item.patient?.user_code && <span>ID: {item.patient.user_code}</span>}
                                                    {item.patient?.user_code && item.patient?.phone && <span>•</span>}
                                                    {item.patient?.phone && <span>{item.patient.phone}</span>}
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="font-mono font-bold text-sm text-slate-900 block">
                                                    {parseFloat(item.treatment?.price || 0).toFixed(0)} Tk
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                    {item.date_administered}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Procedure Details */}
                                        <div className="flex items-center gap-2 flex-wrap text-xs pt-2 border-t border-slate-100">
                                            {rowColor && (
                                                <span
                                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                                    style={{ backgroundColor: rowColor }}
                                                />
                                            )}
                                            <span className="font-semibold text-slate-800">
                                                {item.treatment?.name || 'Procedure'}
                                            </span>
                                            <span className="text-slate-400">•</span>
                                            <span className="text-slate-500 text-[11px]">
                                                {item.treatment?.category?.name || 'General'}
                                            </span>
                                            {item.treatment?.room && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                    <DoorOpen className="w-2.5 h-2.5 text-slate-400" />
                                                    {item.treatment.room.room_number}
                                                </span>
                                            )}
                                        </div>

                                        {/* Bottom: Invoice & Actions */}
                                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                            <div className="text-[11px] text-slate-500 font-mono">
                                                <span>{item.invoice_number || item.payment?.invoice_number || '—'}</span>
                                                {item.payment && (
                                                    <span className="ml-1 text-teal-700 font-bold uppercase text-[10px]">
                                                        ({item.payment.payment_method === 'multiple' ? 'Split' : item.payment.payment_method})
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                {/* Print Receipt / Slip */}
                                                {item.payment && (
                                                    <Button
                                                        variant="secondary"
                                                        size="xs"
                                                        onClick={() => {
                                                            setActiveInvoice({
                                                                id: item.payment.id,
                                                                invoice_no: item.invoice_number || item.payment.invoice_number,
                                                                token_number: item.token_number,
                                                                payment_method: item.payment.payment_method,
                                                                bank_account_name: item.payment.bank_account
                                                                    ? (item.payment.bank_account.bank_name || item.payment.bank_account.account_name)
                                                                    : null,
                                                                bank_account_number: item.payment.bank_account?.account_number,
                                                                payment_splits: item.payment.splits?.map((s) => ({
                                                                    payment_method: s.payment_method,
                                                                    amount: s.amount,
                                                                    bank_name: s.bank_account?.bank_name || s.bank_account?.account_name,
                                                                    account_number: s.bank_account?.account_number,
                                                                })) || [],
                                                                date: item.date_administered,
                                                                patient: {
                                                                    user_code: item.patient?.user_code,
                                                                    name: item.patient?.name,
                                                                    phone: item.patient?.phone,
                                                                },
                                                                items: [{
                                                                    name: item.treatment?.name,
                                                                    price: item.treatment?.price,
                                                                    room_number: item.treatment?.room?.room_number,
                                                                }],
                                                                base_amount: item.treatment?.price,
                                                                discount_type: null,
                                                                discount_amount: 0,
                                                                final_paid_amount: item.treatment?.price,
                                                            });
                                                        }}
                                                        title="Print Invoice Receipt"
                                                    >
                                                        <Printer className="w-3.5 h-3.5" />
                                                    </Button>
                                                )}

                                                {/* Edit Record */}
                                                {(can('edit-patient-treatments') || can('update-patient-treatments') || can('edit-pos-treatment') || can('update-pos-treatment')) && (
                                                    <Button
                                                        variant="outline"
                                                        size="xs"
                                                        onClick={() => openEditModal(item)}
                                                        title="Edit Treatment Record"
                                                        className="text-teal-700 border-teal-300 hover:bg-teal-50"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                                                    </Button>
                                                )}

                                                {/* Delete Record */}
                                                {(can('delete-patient-treatments') || can('delete-pos-treatment')) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="xs"
                                                        onClick={() => handleDeleteRecord(item.id, item.token_number)}
                                                        title="Delete Treatment Record"
                                                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </Card>

            {/* Modal: Edit Patient Treatment Record */}
            <Modal
                isOpen={!!editingTreatment}
                onClose={() => setEditingTreatment(null)}
                title="Edit Patient Treatment Record"
            >
                {editingTreatment && (
                    <form onSubmit={handleUpdateRecord} className="space-y-4">
                        {/* Patient & Token Info Summary */}
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800">
                                    Patient: {editingTreatment.patient?.name || 'Walk-in Patient'}
                                </span>
                                <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                    {editingTreatment.token_number || `#${editingTreatment.id}`}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                                <span>Phone: {editingTreatment.patient?.phone || '—'}</span>
                                {editingTreatment.patient?.user_code && (
                                    <span className="font-mono">ID: {editingTreatment.patient.user_code}</span>
                                )}
                            </div>
                        </div>

                        {/* Treatment Procedure Select */}
                        <SelectInput
                            label="Treatment Procedure"
                            value={editForm.data.treatment_id}
                            onChange={(e) => editForm.setData('treatment_id', e.target.value)}
                            error={editForm.errors.treatment_id}
                            required
                        >
                            <option value="">-- Choose Treatment --</option>
                            {allTreatments.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name} ({parseFloat(t.price).toFixed(0)} Tk) - {t.category?.name || 'General'}
                                </option>
                            ))}
                        </SelectInput>

                        {/* Status Select */}
                        <SelectInput
                            label="Procedure Progress Status"
                            value={editForm.data.status}
                            onChange={(e) => editForm.setData('status', e.target.value)}
                            error={editForm.errors.status}
                            required
                        >
                            <option value="waiting">Waiting</option>
                            <option value="in_collection">In Collection</option>
                            <option value="sample">Sample (Done)</option>
                        </SelectInput>

                        {/* Date Administered */}
                        <TextInput
                            label="Date Administered"
                            type="date"
                            value={editForm.data.date_administered}
                            onChange={(e) => editForm.setData('date_administered', e.target.value)}
                            error={editForm.errors.date_administered}
                            required
                        />

                        {/* Form Actions */}
                        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => setEditingTreatment(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                size="sm"
                                loading={editForm.processing}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Printable Invoice Slip Modal */}
            {activeInvoice && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center">
                        <div className="w-full flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800 text-sm">Treatment Receipt Ready</h3>
                            <button
                                onClick={() => setActiveInvoice(null)}
                                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="w-full border border-slate-200 rounded-lg p-3 bg-slate-50 mb-4 max-h-[70vh] overflow-y-auto">
                            <InvoiceSlip invoice={activeInvoice} />
                        </div>

                        <div className="flex gap-2 w-full">
                            <Button
                                variant="secondary"
                                className="flex-1"
                                onClick={() => setActiveInvoice(null)}
                            >
                                Close
                            </Button>
                            <Button
                                variant="primary"
                                className="flex-1"
                                onClick={() => window.print()}
                            >
                                <Printer className="w-4 h-4 mr-2" /> Print Slip
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

