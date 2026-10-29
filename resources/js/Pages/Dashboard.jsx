import React from 'react';
import { Link, router } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
import PageHeader from '../Components/UI/PageHeader';
import StatCard from '../Components/UI/StatCard';
import Card from '../Components/UI/Card';
import Badge from '../Components/UI/Badge';
import Button from '../Components/UI/Button';
import { Table, Thead, Tbody, Th, Td, Tr, EmptyState } from '../Components/Table';
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

export default function Dashboard({ stats, todayVisits = [], doctors = [], selectedDoctorId }) {
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

            {/* Today's Live Queue Table */}
            <Card
                title="Today's Live Consultation Queue"
                subtitle="Queue position, current state, and caller controls"
                actions={
                    <Link href="/consultation/queue">
                        <Button variant="outline" size="sm">
                            Full Queue Board →
                        </Button>
                    </Link>
                }
            >
                {todayVisits.length === 0 ? (
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
                                            {visit.status === 'waiting' && (
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => handleCallPatient(visit.id)}
                                                >
                                                    <PhoneCall className="w-3.5 h-3.5 mr-1" /> Call In
                                                </Button>
                                            )}
                                            {visit.status === 'in_consultation' && (
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
                                        </div>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                )}
            </Card>
        </AppLayout>
    );
}

