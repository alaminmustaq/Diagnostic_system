import React from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/UI/PageHeader';
import Card from '../../Components/UI/Card';
import StatCard from '../../Components/UI/StatCard';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
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
} from 'lucide-react';

export default function Reports({
    activeTab = 'visits',
    reportData = {},
    doctors = [],
    treatmentsList = [],
    patients = [],
    filters = {},
}) {
    const handleTabChange = (tabName) => {
        router.get('/reports', { ...filters, tab: tabName }, { preserveState: true });
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const params = { tab: activeTab };
        for (let [key, val] of formData.entries()) {
            if (val) params[key] = val;
        }
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
                <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            From Date
                        </label>
                        <input
                            type="date"
                            name="start_date"
                            defaultValue={filters.start_date || ''}
                            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            To Date
                        </label>
                        <input
                            type="date"
                            name="end_date"
                            defaultValue={filters.end_date || ''}
                            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>

                    {/* Dynamic Filters depending on tab */}
                    {(activeTab === 'visits' || activeTab === 'followups') && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                Doctor
                            </label>
                            <select
                                name="doctor_id"
                                defaultValue={filters.doctor_id || ''}
                                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="">All Doctors</option>
                                {doctors.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {activeTab === 'treatments' && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                Specific Treatment
                            </label>
                            <select
                                name="treatment_id"
                                defaultValue={filters.treatment_id || ''}
                                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="">All Services</option>
                                {treatmentsList.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                Payment Category
                            </label>
                            <select
                                name="payment_type"
                                defaultValue={filters.payment_type || ''}
                                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="">All Revenue Streams</option>
                                <option value="visit">Visit Fees (Consultation)</option>
                                <option value="treatment">Treatment Fees (Hospital POS)</option>
                            </select>
                        </div>
                    )}

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
                                            <Td className="font-bold">{v.patient?.name}</Td>
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

                    {/* Popular Services Breakdown */}
                    <Card title="Top Clinical Services Rendered (Popularity & Volume)">
                        {reportData.breakdown?.length === 0 ? (
                            <EmptyState title="No treatments recorded in this period" />
                        ) : (
                            <Table>
                                <Thead>
                                    <Tr>
                                        <Th>Rank</Th>
                                        <Th>Procedure / Treatment</Th>
                                        <Th>Category</Th>
                                        <Th align="center">Times Administered</Th>
                                        <Th align="right">Estimated Volume (Tk)</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {reportData.breakdown.map((item, idx) => (
                                        <Tr key={idx}>
                                            <Td className="font-mono font-bold text-slate-400">#{idx + 1}</Td>
                                            <Td className="font-bold text-slate-900">{item.treatment_name}</Td>
                                            <Td>
                                                <Badge variant="treatment">{item.category}</Badge>
                                            </Td>
                                            <Td align="center">
                                                <span className="px-2.5 py-1 rounded-full bg-slate-100 font-bold text-xs text-slate-800">
                                                    {item.count} sessions
                                                </span>
                                            </Td>
                                            <Td align="right" className="font-mono font-bold text-teal-700">
                                                {parseFloat(item.estimated_revenue).toFixed(2)} Tk
                                            </Td>
                                        </Tr>
                                    ))}
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

