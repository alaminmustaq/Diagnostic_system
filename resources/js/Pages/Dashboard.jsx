import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
import PageHeader from '../Components/UI/PageHeader';
import StatCard from '../Components/UI/StatCard';
import Card from '../Components/UI/Card';
import Badge from '../Components/UI/Badge';
import Button from '../Components/UI/Button';
import { Table, Thead, Tbody, Th, Td, Tr, EmptyState } from '../Components/Table';
import { usePermissions } from '../Utils/permissions';
import {
    Users,
    Clock,
    CheckCircle2,
    XCircle,
    DollarSign,
    Ticket,
    CreditCard,
    Stethoscope,
    MessageCircle,
    UserCheck,
    PhoneCall,
    Sparkles,
} from 'lucide-react';

export default function Dashboard({ stats, todayVisits = [], treatmentQueue = [], doctors = [], selectedDoctorId }) {
    const { can } = usePermissions();
    const [queueTab, setQueueTab] = useState('visits'); // 'visits' or 'treatments'

    const handleDoctorFilter = (e) => {
        const docId = e.target.value;
        router.get('/dashboard', docId ? { doctor_id: docId } : {}, { preserveState: true });
    };

    const handleCallPatient = (visitId) => {
        router.patch(`/consultation/visits/${visitId}/status`, { status: 'in_consultation' });
    };

    const handleCompletePatient = (visitId) => {
        router.patch(`/consultation/visits/${visitId}/status`, { status: 'completed' });
    };

    const handleCancelPatient = (visitId) => {
        if (confirm('Are you sure you want to cancel this serial?')) {
            router.patch(`/consultation/visits/${visitId}/status`, { status: 'cancelled' });
        }
    };

    const handleTreatmentStatusUpdate = (id, newStatus) => {
        router.patch(`/consultation/treatments/${id}/status`, { status: newStatus });
    };

    return (
        <AppLayout title="Clinic Dashboard">
            <PageHeader
                title="Clinic Overview & Real-Time Queue"
                subtitle="Live serial tracking, consultation flow, and revenue metrics"
                actions={
                    <div className="flex items-center gap-3">
                        <select
                            value={selectedDoctorId || ''}
                            onChange={handleDoctorFilter}
                            className="bg-white border border-slate-300 rounded-lg text-xs font-semibold py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                        >
                            <option value="">All Doctors</option>
                            {doctors.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.name} ({d.doctor_profile?.room_number || 'Consultation'})
                                </option>
                            ))}
                        </select>
                        <Link href="/booking">
                            <Button variant="primary" size="sm">
                                <Ticket className="w-4 h-4 mr-1.5" /> Book Serial
                            </Button>
                        </Link>
                    </div>
                }
            />

            {/* Quick KPI Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                <StatCard
                    title="Total Visits"
                    value={stats.total_visits}
                    subtitle="Booked today"
                    icon={Users}
                    color="teal"
                />
                <StatCard
                    title="In Room"
                    value={stats.in_consultation}
                    subtitle="Currently consulting"
                    icon={Clock}
                    color="blue"
                />
                <StatCard
                    title="Waiting"
                    value={stats.waiting}
                    subtitle="In lounge queue"
                    icon={Ticket}
                    color="amber"
                />
                <StatCard
                    title="Completed"
                    value={stats.completed}
                    subtitle="Consultations done"
                    icon={CheckCircle2}
                    color="emerald"
                />
                <StatCard
                    title="Visit Revenue"
                    value={`${parseFloat(stats.today_visit_revenue).toFixed(0)} Tk`}
                    subtitle="Consultation fees"
                    icon={DollarSign}
                    color="teal"
                />
                <StatCard
                    title="Treatment Rev"
                    value={`${parseFloat(stats.today_treatment_revenue).toFixed(0)} Tk`}
                    subtitle="Hospital POS services"
                    icon={CreditCard}
                    color="purple"
                />
            </div>

            {/* Quick Action Navigation Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <Link
                    href="/booking"
                    className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md transition flex items-center gap-3.5 group"
                >
                    <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition">
                        <Ticket className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-900">Serial Booking</h4>
                        <p className="text-xs text-slate-500">Phone-first registration</p>
                    </div>
                </Link>

                <Link
                    href="/consultation/room"
                    className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md transition flex items-center gap-3.5 group"
                >
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
                        <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-900">Doctor Room</h4>
                        <p className="text-xs text-slate-500">Consultation workstation</p>
                    </div>
                </Link>

                <Link
                    href="/pos"
                    className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md transition flex items-center gap-3.5 group"
                >
                    <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-900">Treatment POS</h4>
                        <p className="text-xs text-slate-500">Hospital services billing</p>
                    </div>
                </Link>

                <Link
                    href="/follow-ups"
                    className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md transition flex items-center gap-3.5 group"
                >
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
                        <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-900">Follow-Up Engine</h4>
                        <p className="text-xs text-slate-500">WhatsApp notifications</p>
                    </div>
                </Link>
            </div>

            {/* Today's Live Queue Card with Tabs */}
            <Card
                title="Today's Live Queue Board"
                subtitle="Real-time patient tracking, serial caller, and treatment status management"
                actions={
                    <div className="flex items-center gap-2">
                        <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                            <button
                                type="button"
                                onClick={() => setQueueTab('visits')}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                                    queueTab === 'visits'
                                        ? 'bg-white text-teal-700 shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Doctor Visits ({todayVisits.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setQueueTab('treatments')}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                                    queueTab === 'treatments'
                                        ? 'bg-white text-teal-700 shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Treatment Queue ({treatmentQueue.length})
                            </button>
                        </div>
                        <Link href="/consultation/queue">
                            <Button variant="outline" size="sm">
                                Full Queue Board →
                            </Button>
                        </Link>
                    </div>
                }
            >
                {queueTab === 'visits' ? (
                    todayVisits.length === 0 ? (
                        <EmptyState
                            icon={Ticket}
                            title="No visits booked yet today"
                            description="Book the first patient serial to start today's queue."
                            action={
                                <Link href="/booking">
                                    <Button variant="primary" size="sm">
                                        <Ticket className="w-4 h-4 mr-1.5" /> Book Serial Now
                                    </Button>
                                </Link>
                            }
                        />
                    ) : (
                        <Table>
                            <Thead>
                                <Tr>
                                    <Th>Serial #</Th>
                                    <Th>Token</Th>
                                    <Th>Patient</Th>
                                    <Th>Phone</Th>
                                    <Th>Doctor & Room</Th>
                                    <Th>Status</Th>
                                    <Th align="right">Action</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {todayVisits.map((visit) => (
                                    <Tr key={visit.id}>
                                        <Td>
                                            <span className="font-extrabold text-slate-900 text-sm font-mono">
                                                #{visit.serial_number}
                                            </span>
                                        </Td>
                                        <Td>
                                            <span className="inline-block px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-mono text-xs font-bold border border-teal-200">
                                                {visit.token_number}
                                            </span>
                                        </Td>
                                        <Td>
                                            <span className="font-bold text-slate-900">{visit.patient?.name}</span>
                                        </Td>
                                        <Td>
                                            <span className="font-mono text-slate-600 text-xs">{visit.patient?.phone}</span>
                                        </Td>
                                        <Td>
                                            <div>
                                                <span className="font-semibold text-slate-800 text-xs block">
                                                    {visit.doctor?.name}
                                                </span>
                                                <span className="text-[11px] text-slate-500">
                                                    {visit.doctor?.doctor_profile?.room_number || 'Room'}
                                                </span>
                                            </div>
                                        </Td>
                                        <Td>
                                            <Badge variant={visit.status}>
                                                {visit.status === 'in_consultation' ? 'In Consultation' : visit.status.toUpperCase()}
                                            </Badge>
                                        </Td>
                                        <Td align="right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {visit.status === 'waiting' && can('call-patient') && (
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => handleCallPatient(visit.id)}
                                                    >
                                                        <PhoneCall className="w-3.5 h-3.5 mr-1" /> Call In
                                                    </Button>
                                                )}
                                                {visit.status === 'in_consultation' && (can('update-consultation-queue') || can('call-patient')) && (
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        onClick={() => handleCompletePatient(visit.id)}
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Complete
                                                    </Button>
                                                )}
                                                {visit.status === 'completed' && (
                                                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Done
                                                    </span>
                                                )}
                                                {visit.status !== 'cancelled' && visit.status !== 'completed' && can('cancel-serial') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleCancelPatient(visit.id)}
                                                        title="Cancel Serial"
                                                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {visit.status === 'waiting' && !can('call-patient') && !can('cancel-serial') && (
                                                    <span className="text-xs text-slate-400">View Only</span>
                                                )}
                                            </div>
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    )
                ) : (
                    treatmentQueue.length === 0 ? (
                        <EmptyState
                            icon={Sparkles}
                            title="No treatments queued today"
                            description="Issue treatment services from POS to view and advance clinic procedures."
                            action={
                                <Link href="/pos">
                                    <Button variant="primary" size="sm">
                                        <Sparkles className="w-4 h-4 mr-1.5" /> Open Treatment POS
                                    </Button>
                                </Link>
                            }
                        />
                    ) : (
                        <Table>
                            <Thead>
                                <Tr>
                                    <Th>Token</Th>
                                    <Th>Patient</Th>
                                    <Th>Phone</Th>
                                    <Th>Treatment Service</Th>
                                    <Th>Status</Th>
                                    <Th align="right">Action</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {treatmentQueue.map((item) => (
                                    <Tr key={item.id}>
                                        <Td>
                                            <span className="inline-block px-2 py-0.5 rounded bg-purple-50 text-purple-800 font-mono text-xs font-bold border border-purple-200">
                                                {item.token_number}
                                            </span>
                                        </Td>
                                        <Td>
                                            <span className="font-bold text-slate-900">{item.patient?.name}</span>
                                        </Td>
                                        <Td>
                                            <span className="font-mono text-slate-600 text-xs">{item.patient?.phone}</span>
                                        </Td>
                                        <Td>
                                            <div className="flex items-center gap-2">
                                                {item.treatment?.color && (
                                                    <span
                                                        className="w-3 h-3 rounded-full shrink-0 border border-black/10"
                                                        style={{ backgroundColor: item.treatment.color }}
                                                    />
                                                )}
                                                <div>
                                                    <span className="font-bold text-slate-800 text-xs block">
                                                        {item.treatment?.name}
                                                    </span>
                                                    <span className="text-[11px] text-slate-500">
                                                        {item.treatment?.category?.name || 'General'}
                                                    </span>
                                                </div>
                                            </div>
                                        </Td>
                                        <Td>
                                            <Badge variant={item.status}>
                                                {item.status === 'in_collection'
                                                    ? 'In Collection'
                                                    : item.status === 'sample'
                                                    ? 'Sample (Done)'
                                                    : 'Waiting'}
                                            </Badge>
                                        </Td>
                                        <Td align="right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {item.status === 'waiting' && can('in-collection') && (
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => handleTreatmentStatusUpdate(item.id, 'in_collection')}
                                                    >
                                                        <Clock className="w-3.5 h-3.5 mr-1" /> In Collection
                                                    </Button>
                                                )}
                                                {item.status === 'in_collection' && can('sample') && (
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        onClick={() => handleTreatmentStatusUpdate(item.id, 'sample')}
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Sample (Done)
                                                    </Button>
                                                )}
                                                {item.status === 'sample' && (
                                                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Treatment Done
                                                    </span>
                                                )}
                                                {item.status === 'waiting' && !can('in-collection') && (
                                                    <span className="text-xs text-slate-400">View Only</span>
                                                )}
                                                {item.status === 'in_collection' && !can('sample') && (
                                                    <span className="text-xs text-slate-400">In Progress</span>
                                                )}
                                            </div>
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    )
                )}
            </Card>
        </AppLayout>
    );
}

