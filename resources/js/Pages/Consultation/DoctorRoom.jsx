import React, { useState } from 'react';
import { router, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/UI/PageHeader';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import TextInput from '../../Components/Form/TextInput';
import Toggle from '../../Components/Form/Toggle';
import {
    Stethoscope,
    User as UserIcon,
    Calendar,
    Clock,
    CheckCircle2,
    Sparkles,
    PhoneCall,
    History,
    ArrowRight,
    DoorOpen,
} from 'lucide-react';

export default function DoctorRoom({ activeVisit, queue = [], currentDoctor, doctors = [], today }) {
    const [followUpDate, setFollowUpDate] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleDoctorSwitch = (docId) => {
        router.get('/consultation/room', { doctor_id: docId }, { preserveState: true });
    };

    const handleCallPatient = (visitId) => {
        router.patch(`/consultation/visits/${visitId}/status`, { status: 'in_consultation' });
    };

    const handleCompleteActive = () => {
        if (!activeVisit) return;
        router.patch(`/consultation/visits/${activeVisit.id}/status`, { status: 'completed' });
    };

    const handlePrescribeAndComplete = (e) => {
        e.preventDefault();
        if (!activeVisit || !followUpDate) return;

        setSubmitting(true);
        router.post(
            `/consultation/visits/${activeVisit.id}/prescribe-follow-up`,
            {
                follow_up_date: followUpDate,
                complete_visit: true,
            },
            {
                onSuccess: () => {
                    setFollowUpDate('');
                    setSubmitting(false);
                },
                onError: () => setSubmitting(false),
            }
        );
    };

    const setQuickDays = (days) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        setFollowUpDate(d.toISOString().split('T')[0]);
    };

    const nextWaiting = queue.find((v) => v.status === 'waiting');

    return (
        <AppLayout title="Doctor Consultation Room">
            <PageHeader
                title="Doctor Consultation Workstation"
                subtitle={`Doctor: ${currentDoctor?.name || 'Physician'} | Room: ${currentDoctor?.doctor_profile?.room_number || 'Room'}`}
                actions={
                    <div className="flex items-center gap-3">
                        <select
                            value={currentDoctor?.id || ''}
                            onChange={(e) => handleDoctorSwitch(e.target.value)}
                            className="bg-white border border-slate-300 rounded-lg text-xs font-semibold py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                        >
                            {doctors.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.name} ({d.doctor_profile?.room_number})
                                </option>
                            ))}
                        </select>
                        <Link href="/consultation/queue">
                            <Button variant="secondary" size="sm">
                                View Full Queue
                            </Button>
                        </Link>
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Active Patient Area (Left 8 cols) */}
                <div className="lg:col-span-8 space-y-6">
                    {activeVisit ? (
                        <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-md p-6 sm:p-7 relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                                <Clock className="w-3.5 h-3.5" /> Now In Consultation
                            </div>

                            {/* Patient Header */}
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-extrabold text-xl">
                                    #{activeVisit.serial_number}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                                        {activeVisit.patient?.name}
                                    </h2>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                        <span className="font-mono font-medium text-slate-700">{activeVisit.patient?.phone}</span>
                                        <span>•</span>
                                        <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                            Token: {activeVisit.token_number}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Medical Record History & Treatments */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                                        <History className="w-4 h-4 text-teal-600" />
                                        <span>Visit History</span>
                                    </div>
                                    <p className="text-xs text-slate-600">
                                        Total visits on record: <strong>{activeVisit.patient?.patient_visits?.length || 1}</strong>
                                    </p>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                                        <Sparkles className="w-4 h-4 text-purple-600" />
                                        <span>Administered Procedures</span>
                                    </div>
                                    <p className="text-xs text-slate-600">
                                        Hospital treatments: <strong>{activeVisit.patient?.patient_treatments?.length || 0} service(s)</strong>
                                    </p>
                                </div>
                            </div>

                            {/* Prescribe Next Visit Date Form */}
                            <div className="pt-6 border-t border-slate-200">
                                <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-teal-600" /> Prescribe Next Visit Date (Follow-Up)
                                </h4>
                                <p className="text-xs text-slate-500 mb-4">
                                    Schedules automated WhatsApp reminder in the follow_ups table
                                </p>

                                <form onSubmit={handlePrescribeAndComplete} className="space-y-4">
                                    <div>
                                        <TextInput
                                            type="date"
                                            value={followUpDate}
                                            onChange={(e) => setFollowUpDate(e.target.value)}
                                            required
                                            placeholder="Select next visit date"
                                        />

                                        {/* Quick Date Chips */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[11px] text-slate-400 font-medium">Quick Prescribe:</span>
                                            <button
                                                type="button"
                                                onClick={() => setQuickDays(3)}
                                                className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                                            >
                                                +3 Days
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setQuickDays(7)}
                                                className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                                            >
                                                +1 Week
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setQuickDays(14)}
                                                className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                                            >
                                                +2 Weeks
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setQuickDays(30)}
                                                className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                                            >
                                                +1 Month
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-3">
                                        <Button
                                            variant="secondary"
                                            size="md"
                                            onClick={handleCompleteActive}
                                            type="button"
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-1.5" /> Complete Without Follow-Up
                                        </Button>

                                        <Button
                                            variant="success"
                                            size="md"
                                            type="submit"
                                            loading={submitting}
                                            className="font-bold shadow-md shadow-emerald-600/25"
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-1.5" /> Prescribe Follow-Up & Finish
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    ) : (
                        <Card className="p-8 text-center flex flex-col items-center justify-center">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                                <DoorOpen className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Consultation Room is Currently Empty</h3>
                            <p className="text-sm text-slate-500 max-w-md mt-1 mb-5">
                                No patient is currently in the room. Call the next patient from the waiting queue to begin consultation.
                            </p>
                            {nextWaiting ? (
                                <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={() => handleCallPatient(nextWaiting.id)}
                                    className="font-bold"
                                >
                                    <PhoneCall className="w-5 h-5 mr-2" /> Call #{nextWaiting.serial_number}: {nextWaiting.patient?.name}
                                </Button>
                            ) : (
                                <span className="text-xs text-slate-400 font-medium">
                                    No patients currently waiting in queue.
                                </span>
                            )}
                        </Card>
                    )}
                </div>

                {/* Today's Queue Sidebar (Right 4 cols) */}
                <div className="lg:col-span-4">
                    <Card
                        title="Today's Patient Queue"
                        subtitle={`Total queue for ${currentDoctor?.name || 'Doctor'}`}
                    >
                        {queue.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-6">No queue booked today</p>
                        ) : (
                            <div className="space-y-2 max-h-[560px] overflow-y-auto">
                                {queue.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`p-3 rounded-xl border flex items-center justify-between transition ${
                                            item.status === 'in_consultation'
                                                ? 'bg-indigo-50/70 border-indigo-200'
                                                : item.status === 'completed'
                                                ? 'bg-slate-50 border-slate-200 opacity-60'
                                                : 'bg-white border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs font-mono text-slate-800">
                                                #{item.serial_number}
                                            </span>
                                            <div>
                                                <p className="text-xs font-bold text-slate-900">{item.patient?.name}</p>
                                                <Badge variant={item.status} size="xs">
                                                    {item.status}
                                                </Badge>
                                            </div>
                                        </div>

                                        {item.status === 'waiting' && (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => handleCallPatient(item.id)}
                                            >
                                                Call
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

