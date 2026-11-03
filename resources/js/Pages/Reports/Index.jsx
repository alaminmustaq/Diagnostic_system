import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/UI/PageHeader';
import Card from '../../Components/UI/Card';
import StatCard from '../../Components/UI/StatCard';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import SelectInput from '../../Components/Form/SelectInput';
import InputLabel from '../../Components/Form/InputLabel';
import { Table, Thead, Tbody, Th, Td, Tr, EmptyState } from '../../Components/Table';
import {
    BarChart3,
    Printer,
    Filter,
    Calendar,
    Users,
    Stethoscope,
    Sparkles,
    CreditCard,
    DollarSign,
    CheckCircle2,
    TrendingUp,
    DoorOpen,
} from 'lucide-react';

export default function Reports({
    activeTab = 'visits',
    reportData = {},
    doctors = [],
    treatmentsList = [],
    patients = [],
    filters = {},
}) {
    const [filterValues, setFilterValues] = useState({
        start_date: filters.start_date || '',
        end_date: filters.end_date || '',
        doctor_id: filters.doctor_id ? String(filters.doctor_id) : '',
        treatment_id: filters.treatment_id ? String(filters.treatment_id) : '',
        payment_type: filters.payment_type || '',
        patient_id: filters.patient_id ? String(filters.patient_id) : '',
    });

    useEffect(() => {
        setFilterValues({
            start_date: filters.start_date || '',
            end_date: filters.end_date || '',
            doctor_id: filters.doctor_id ? String(filters.doctor_id) : '',
            treatment_id: filters.treatment_id ? String(filters.treatment_id) : '',
            payment_type: filters.payment_type || '',
            patient_id: filters.patient_id ? String(filters.patient_id) : '',
        });
    }, [filters]);

    const handleTabChange = (tabName) => {
        router.get('/reports', { ...filters, tab: tabName }, { preserveState: true });
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        const params = { tab: activeTab };
        if (filterValues.start_date) params.start_date = filterValues.start_date;
        if (filterValues.end_date) params.end_date = filterValues.end_date;
        if (filterValues.doctor_id) params.doctor_id = filterValues.doctor_id;
        if (filterValues.treatment_id) params.treatment_id = filterValues.treatment_id;
        if (filterValues.payment_type) params.payment_type = filterValues.payment_type;
        if (filterValues.patient_id) params.patient_id = filterValues.patient_id;

        router.get('/reports', params, { preserveState: true });
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <AppLayout title="Reports & Financial Analytics">
            <PageHeader
                title="Clinic Reports & Financial Analytics"
                subtitle="In-depth analytics on patient flow, return rates, service distribution, and revenue split"
                actions={
                    <Button variant="secondary" onClick={handlePrint} size="sm">
                        <Printer className="w-4 h-4 mr-1.5" /> Print Report
                    </Button>
                }
            />

            {/* Navigation Tabs (Hidden on print) */}
            <div className="no-print flex border-b border-slate-200 mb-6 overflow-x-auto">
                <button
                    onClick={() => handleTabChange('visits')}
                    className={`py-3 px-5 text-sm font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                        activeTab === 'visits'
                            ? 'border-teal-600 text-teal-700'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Users className="w-4 h-4" />
                    <span>Visit Report</span>
                </button>
                <button
                    onClick={() => handleTabChange('followups')}
                    className={`py-3 px-5 text-sm font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                        activeTab === 'followups'
                            ? 'border-teal-600 text-teal-700'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Calendar className="w-4 h-4" />
                    <span>Follow-Up & Return Report</span>
                </button>
                <button
                    onClick={() => handleTabChange('treatments')}
                    className={`py-3 px-5 text-sm font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                        activeTab === 'treatments'
                            ? 'border-teal-600 text-teal-700'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Sparkles className="w-4 h-4" />
                    <span>Treatment Services Report</span>
                </button>
                <button
                    onClick={() => handleTabChange('payments')}
                    className={`py-3 px-5 text-sm font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                        activeTab === 'payments'
                            ? 'border-teal-600 text-teal-700'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <CreditCard className="w-4 h-4" />
                    <span>Payment & Revenue Split Report</span>
                </button>
            </div>

            {/* Filter Controls Form (Hidden on print) */}
            <Card className="no-print mb-6">
                <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-end">
                    <div>
                        <InputLabel value="From Date" />
                        <input
                            type="date"
                            name="start_date"
                            value={filterValues.start_date}
                            onChange={(e) => setFilterValues((prev) => ({ ...prev, start_date: e.target.value }))}
                            className="mt-1 w-full text-sm bg-white border border-slate-300 rounded-lg py-2.5 px-3.5 focus:outline-none focus:border-teal-500 focus:ring-3 focus:ring-teal-500/20 text-slate-900 shadow-2xs"
                        />
                    </div>

                    <div>
                        <InputLabel value="To Date" />
                        <input
                            type="date"
                            name="end_date"
                            value={filterValues.end_date}
                            onChange={(e) => setFilterValues((prev) => ({ ...prev, end_date: e.target.value }))}
                            className="mt-1 w-full text-sm bg-white border border-slate-300 rounded-lg py-2.5 px-3.5 focus:outline-none focus:border-teal-500 focus:ring-3 focus:ring-teal-500/20 text-slate-900 shadow-2xs"
                        />
                    </div>

                    {/* Dynamic Filters depending on tab */}
                    {(activeTab === 'visits' || activeTab === 'followups') && (
                        <SelectInput
                            label="Doctor"
                            name="doctor_id"
                            placeholder="All Doctors"
                            value={filterValues.doctor_id}
                            onChange={(e) => setFilterValues((prev) => ({ ...prev, doctor_id: e.target.value }))}
                            searchable={true}
                        >
                            {doctors.map((d) => (
                                <option
                                    key={d.id}
                                    value={d.id}
                                    data-description={d.doctor_profile?.designation || ''}
                                >
                                    {d.name}
                                </option>
                            ))}
                        </SelectInput>
                    )}

                    {activeTab === 'treatments' && (
                        <SelectInput
                            label="Specific Treatment"
                            name="treatment_id"
                            placeholder="All Services"
                            value={filterValues.treatment_id}
                            onChange={(e) => setFilterValues((prev) => ({ ...prev, treatment_id: e.target.value }))}
                            searchable={true}
                        >
                            {treatmentsList.map((t) => (
                                <option
                                    key={t.id}
                                    value={t.id}
                                    data-description={t.price ? `${parseFloat(t.price).toFixed(2)} Tk` : ''}
                                >
                                    {t.name}
                                </option>
                            ))}
                        </SelectInput>
                    )}

                    {activeTab === 'payments' && (
                        <SelectInput
                            label="Payment Category"
                            name="payment_type"
                            placeholder="All Revenue Streams"
                            value={filterValues.payment_type}
                            onChange={(e) => setFilterValues((prev) => ({ ...prev, payment_type: e.target.value }))}
                            searchable={false}
                        >
                            <option value="visit">Doctor Consultation (Visits)</option>
                            <option value="treatment">Hospital Treatment (POS)</option>
                        </SelectInput>
                    )}

                    {/* Patient Filter with Search */}
                    <SelectInput
                        label="Patient"
                        name="patient_id"
                        placeholder="All Patients"
                        value={filterValues.patient_id}
                        onChange={(e) => setFilterValues((prev) => ({ ...prev, patient_id: e.target.value }))}
                        searchable={true}
                    >
                        {patients.map((p) => (
                            <option
                                key={p.id}
                                value={p.id}
                                data-description={p.phone || ''}
                            >
                                {p.name}
                            </option>
                        ))}
                    </SelectInput>

                    <div>
                        <Button type="submit" variant="primary" size="md" className="w-full font-bold">
                            <Filter className="w-4 h-4 mr-1.5" /> Filter Report
                        </Button>
                    </div>
                </form>
            </Card>

            {/* TAB 1: VISIT REPORT */}
            {activeTab === 'visits' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            title="Total Patient Flow"
                            value={reportData.summary?.total_visits || 0}
                            subtitle="Total registered visits"
                            icon={Users}
                            color="teal"
                        />
                        <StatCard
                            title="Completed Consultations"
                            value={reportData.summary?.completed || 0}
                            subtitle="Successfully attended"
                            icon={CheckCircle2}
                            color="emerald"
                        />
                        <StatCard
                            title="Waiting"
                            value={reportData.summary?.waiting || 0}
                            subtitle="In queue"
                            icon={Calendar}
                            color="amber"
                        />
                        <StatCard
                            title="Cancelled"
                            value={reportData.summary?.cancelled || 0}
                            subtitle="No-show or cancelled"
                            icon={BarChart3}
                            color="rose"
                        />
                    </div>

                    <Card title="Patient Visit Records">
                        {reportData.records?.length === 0 ? (
                            <EmptyState title="No visits found for this period" />
                        ) : (
                            <Table>
                                <Thead>
                                    <Tr>
                                        <Th>Date</Th>
                                        <Th>Token #</Th>
                                        <Th>Serial</Th>
                                        <Th>Patient Name</Th>
                                        <Th>Doctor</Th>
                                        <Th>Status</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {reportData.records.map((v) => (
                                        <Tr key={v.id}>
                                            <Td>{v.visit_date}</Td>
                                            <Td>
                                                <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                                    {v.token_number}
                                                </span>
                                            </Td>
                                            <Td>#{v.serial_number}</Td>
                                            <Td>
                                                <span className="font-bold text-slate-900 block">{v.patient?.name}</span>
                                                {v.patient?.phone && (
                                                    <span className="font-mono text-[11px] text-slate-400">{v.patient.phone}</span>
                                                )}
                                            </Td>
                                            <Td>{v.doctor?.name}</Td>
                                            <Td>
                                                <Badge variant={v.status}>{v.status.toUpperCase()}</Badge>
                                            </Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        )}
                    </Card>
                </div>
            )}

            {/* TAB 2: FOLLOW-UP REPORT */}
            {activeTab === 'followups' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            title="Scheduled Follow-Ups"
                            value={reportData.summary?.total_scheduled || 0}
                            subtitle="Total prescribed return visits"
                            icon={Calendar}
                            color="blue"
                        />
                        <StatCard
                            title="Patient Return Rate"
                            value={`${reportData.summary?.return_rate_percentage || 0}%`}
                            subtitle="Percentage who returned"
                            icon={TrendingUp}
                            color="emerald"
                        />
                        <StatCard
                            title="Returned / Completed"
                            value={reportData.summary?.returned_completed || 0}
                            subtitle="Walked in or auto-resolved"
                            icon={CheckCircle2}
                            color="teal"
                        />
                        <StatCard
                            title="Pending"
                            value={reportData.summary?.pending || 0}
                            subtitle="Yet to return"
                            icon={Calendar}
                            color="amber"
                        />
                    </div>

                    <Card title="Follow-Up Tracking Log">
                        {reportData.records?.length === 0 ? (
                            <EmptyState title="No follow-up records found" />
                        ) : (
                            <Table>
                                <Thead>
                                    <Tr>
                                        <Th>Follow-Up Date</Th>
                                        <Th>Patient Name</Th>
                                        <Th>Doctor</Th>
                                        <Th>Notified Via WhatsApp</Th>
                                        <Th>Status</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {reportData.records.map((f) => (
                                        <Tr key={f.id}>
                                            <Td className="font-mono font-bold">{f.follow_up_date}</Td>
                                            <Td className="font-bold">{f.patient?.name}</Td>
                                            <Td>{f.doctor?.name}</Td>
                                            <Td>
                                                {f.is_notified ? (
                                                    <span className="text-emerald-600 font-semibold text-xs flex items-center gap-1">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">No</span>
                                                )}
                                            </Td>
                                            <Td>
                                                <Badge variant={f.status}>{f.status.toUpperCase()}</Badge>
                                            </Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        )}
                    </Card>
                </div>
            )}

            {/* TAB 3: TREATMENT REPORT */}
            {activeTab === 'treatments' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard
                            title="Total Treatments Administered"
                            value={reportData.summary?.total_treatments_administered || 0}
                            subtitle="Procedures completed"
                            icon={Sparkles}
                            color="purple"
                        />
                        <StatCard
                            title="Unique Services Rendered"
                            value={reportData.summary?.unique_services_rendered || 0}
                            subtitle="Different treatment types"
                            icon={BarChart3}
                            color="teal"
                        />
                        <StatCard
                            title="Gross Estimated Volume"
                            value={`${parseFloat(reportData.summary?.estimated_gross_volume || 0).toFixed(2)} Tk`}
                            subtitle="Catalog value rendered"
                            icon={DollarSign}
                            color="emerald"
                        />
                    </div>

                    {/* Patient Treatments Ledger */}
                    <Card title="Patient Treatments Administered">
                        {reportData.records?.length === 0 ? (
                            <EmptyState title="No treatments recorded for this period" />
                        ) : (
                            <Table>
                                <Thead>
                                    <Tr>
                                        <Th>Date</Th>
                                        <Th>Patient Name</Th>
                                        <Th>Contact / Phone</Th>
                                        <Th>Treatment / Procedure</Th>
                                        <Th>Category</Th>
                                        <Th>Room</Th>
                                        <Th align="right">Charge / Price (Tk)</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {reportData.records.map((pt) => {
                                        const rowColor = pt.treatment?.color;
                                        return (
                                            <Tr
                                                key={pt.id}
                                                style={rowColor ? { backgroundColor: `${rowColor}10`, borderLeft: `4px solid ${rowColor}` } : undefined}
                                            >
                                                <Td
                                                    className="font-mono text-xs text-slate-600"
                                                    style={rowColor ? { borderLeft: `4px solid ${rowColor}` } : undefined}
                                                >
                                                    {pt.date_administered}
                                                </Td>
                                                <Td>
                                                    <span className="font-bold text-slate-900 block">{pt.patient?.name || 'Walk-in Patient'}</span>
                                                    <span className="text-[11px] text-slate-400">ID: {pt.patient?.user_code || `PT-${pt.patient_id}`}</span>
                                                </Td>
                                                <Td>
                                                    <span className="font-mono text-xs text-slate-700">{pt.patient?.phone || '—'}</span>
                                                </Td>
                                                <Td>
                                                    <div className="flex items-center gap-2">
                                                        {rowColor && (
                                                            <span
                                                                className="w-3.5 h-3.5 rounded-full shrink-0 border border-slate-300 shadow-2xs"
                                                                style={{ backgroundColor: rowColor }}
                                                                title={`Color: ${rowColor}`}
                                                            />
                                                        )}
                                                        <span className="font-semibold text-teal-800 text-sm block">
                                                            {pt.treatment?.name || 'Custom Procedure'}
                                                        </span>
                                                    </div>
                                                </Td>
                                                <Td>
                                                    <Badge variant="treatment">{pt.treatment?.category?.name || 'General'}</Badge>
                                                </Td>
                                                <Td>
                                                    {pt.treatment?.room ? (
                                                        <Badge variant="info">
                                                            <DoorOpen className="w-3 h-3 mr-1" />
                                                            {pt.treatment.room.room_number}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">—</span>
                                                    )}
                                                </Td>
                                                <Td align="right" className="font-mono font-bold text-teal-700">
                                                    {pt.treatment?.price ? `${parseFloat(pt.treatment.price).toFixed(2)} Tk` : '0.00 Tk'}
                                                </Td>
                                            </Tr>
                                        );
                                    })}
                                </Tbody>
                            </Table>
                        )}
                    </Card>
                </div>
            )}

            {/* TAB 4: PAYMENT REPORT */}
            {activeTab === 'payments' && (
                <div className="space-y-6">
                    {/* Revenue Split Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            title="Total Revenue Collected"
                            value={`${parseFloat(reportData.summary?.total_collected || 0).toFixed(2)} Tk`}
                            subtitle="Net clinic cash flow"
                            icon={DollarSign}
                            color="emerald"
                        />
                        <StatCard
                            title="Consultation Fees"
                            value={`${parseFloat(reportData.summary?.visit_revenue || 0).toFixed(2)} Tk`}
                            subtitle="One-time doctor visits"
                            icon={Stethoscope}
                            color="teal"
                        />
                        <StatCard
                            title="Treatment Fees (POS)"
                            value={`${parseFloat(reportData.summary?.treatment_revenue || 0).toFixed(2)} Tk`}
                            subtitle="Hospital procedures"
                            icon={Sparkles}
                            color="purple"
                        />
                        <StatCard
                            title="Discounts Conceded"
                            value={`${parseFloat(reportData.summary?.total_discount_given || 0).toFixed(2)} Tk`}
                            subtitle="Concessions given"
                            icon={CreditCard}
                            color="rose"
                        />
                    </div>

                    {/* Revenue Ledger Table */}
                    <Card title="Financial Transactions Ledger (Visit vs Treatment)">
                        {reportData.records?.length === 0 ? (
                            <EmptyState title="No transactions recorded" />
                        ) : (
                            <Table>
                                <Thead>
                                    <Tr>
                                        <Th>Date</Th>
                                        <Th>Patient Name</Th>
                                        <Th>Revenue Stream</Th>
                                        <Th>Base Amount</Th>
                                        <Th>Discount</Th>
                                        <Th align="right">Final Paid (Tk)</Th>
                                        <Th>Collected By</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {reportData.records.map((p) => (
                                        <Tr key={p.id}>
                                            <Td className="font-mono text-xs">{p.payment_date}</Td>
                                            <Td className="font-bold">{p.patient?.name}</Td>
                                            <Td>
                                                <Badge variant={p.payment_type}>
                                                    {p.payment_type === 'visit' ? 'Doctor Consultation' : 'Hospital Treatment'}
                                                </Badge>
                                            </Td>
                                            <Td className="font-mono">{parseFloat(p.base_amount).toFixed(2)}</Td>
                                            <Td className="text-rose-600 font-mono text-xs">
                                                {parseFloat(p.discount_amount) > 0 ? `-${parseFloat(p.discount_amount).toFixed(2)}` : '—'}
                                            </Td>
                                            <Td align="right" className="font-mono font-extrabold text-teal-800 text-sm">
                                                {parseFloat(p.final_paid_amount).toFixed(2)} Tk
                                            </Td>
                                            <Td className="text-xs text-slate-500">{p.collected_by?.name || 'Reception Desk'}</Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        )}
                    </Card>
                </div>
            )}
        </AppLayout>
    );
}

