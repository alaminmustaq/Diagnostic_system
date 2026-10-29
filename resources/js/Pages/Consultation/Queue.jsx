import React, { useState } from 'react';
import { router, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/UI/PageHeader';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import { Table, Thead, Tbody, Th, Td, Tr, EmptyState } from '../../Components/Table';
import Modal from '../../Components/Modal/Modal';
import TextInput from '../../Components/Form/TextInput';
import Toggle from '../../Components/Form/Toggle';
import {
    Users,
    Clock,
    CheckCircle2,
    XCircle,
    PhoneCall,
    Calendar,
    Stethoscope,
    ChevronRight,
    Filter,
} from 'lucide-react';

export default function Queue({ visits = [], doctors = [], selectedDoctorId, today }) {
    const [statusFilter, setStatusFilter] = useState('all');
    const [prescribeModalVisit, setPrescribeModalVisit] = useState(null);
    const [followUpDate, setFollowUpDate] = useState('');
    const [completeVisitOnPrescribe, setCompleteVisitOnPrescribe] = useState(true);
    const [submittingFollowUp, setSubmittingFollowUp] = useState(false);

    const handleDoctorFilter = (e) => {
        const docId = e.target.value;
        router.get('/consultation/queue', docId ? { doctor_id: docId } : {}, { preserveState: true });
    };

    const handleStatusUpdate = (visitId, newStatus) => {
        router.patch(`/consultation/visits/${visitId}/status`, { status: newStatus });
    };

    const openPrescribeModal = (visit) => {
        // default 7 days from now
        const d = new Date();
        d.setDate(d.getDate() + 7);
        setFollowUpDate(d.toISOString().split('T')[0]);
        setPrescribeModalVisit(visit);
    };

    const handlePrescribeSubmit = (e) => {
        e.preventDefault();
        if (!prescribeModalVisit || !followUpDate) return;

        setSubmittingFollowUp(true);
        router.post(
            `/consultation/visits/${prescribeModalVisit.id}/prescribe-follow-up`,
            {
                follow_up_date: followUpDate,
                complete_visit: completeVisitOnPrescribe,
            },
            {
                onSuccess: () => {
                    setPrescribeModalVisit(null);
                    setSubmittingFollowUp(false);
                },
                onError: () => setSubmittingFollowUp(false),
            }
        );
    };

    const filteredVisits = visits.filter((v) => {
        if (statusFilter === 'all') return true;
        return v.status === statusFilter;
    });

    const waitingCount = visits.filter((v) => v.status === 'waiting').length;
    const inRoomCount = visits.filter((v) => v.status === 'in_consultation').length;
    const completedCount = visits.filter((v) => v.status === 'completed').length;

    return (
        <AppLayout title="Today's Consultation Queue">
            <PageHeader
                title="Today's Patient Queue Board"
                subtitle="Live status board shared between reception desk and consulting physicians"
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
                                    {d.name} ({d.doctor_profile?.room_number || 'Room'})
                                </option>
                            ))}
                        </select>

                        <Link href="/consultation/room">
                            <Button variant="primary" size="sm">
                                <Stethoscope className="w-4 h-4 mr-1.5" /> Doctor Consultation Room
                            </Button>
                        </Link>
                    </div>
                }
            />

            {/* Queue Status Filter Pills */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
                <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        statusFilter === 'all'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    All Serials ({visits.length})
                </button>
                <button
                    onClick={() => setStatusFilter('waiting')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        statusFilter === 'waiting'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
                    }`}
                >
                    <Clock className="w-3.5 h-3.5" /> Waiting in Lounge ({waitingCount})
                </button>
                <button
                    onClick={() => setStatusFilter('in_consultation')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        statusFilter === 'in_consultation'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50'
                    }`}
                >
                    <Stethoscope className="w-3.5 h-3.5" /> In Consultation ({inRoomCount})
                </button>
                <button
                    onClick={() => setStatusFilter('completed')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        statusFilter === 'completed'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                    }`}
                >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Completed Today ({completedCount})
                </button>
            </div>

            {/* Queue Table */}
            <Card>
                {filteredVisits.length === 0 ? (
                    <EmptyState
                        icon={Users}
                        title="No patients found in this queue state"
                        description="Select another filter or book new serials from reception."
                    />
                ) : (
                    <Table>
                        <Thead>
                            <Tr>
                                <Th>Serial #</Th>
                                <Th>Token</Th>
                                <Th>Patient Name</Th>
                                <Th>Contact</Th>
                                <Th>Doctor & Room</Th>
                                <Th>Status</Th>
                                <Th>Follow-Up</Th>
                                <Th align="right">Controls</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {filteredVisits.map((visit) => (
                                <Tr key={visit.id}>
                                    <Td>
                                        <span className="font-black text-slate-900 text-base font-mono">
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
                                        <span className="font-mono text-xs text-slate-600">{visit.patient?.phone}</span>
                                    </Td>
                                    <Td>
                                        <div>
                                            <span className="font-semibold text-slate-800 text-xs block">
                                                {visit.doctor?.name}
                                            </span>
                                            <span className="text-[11px] text-slate-500">
                                                {visit.doctor?.doctor_profile?.room_number || 'Consultation Room'}
                                            </span>
                                        </div>
                                    </Td>
                                    <Td>
                                        <Badge variant={visit.status}>
                                            {visit.status === 'in_consultation' ? 'In Consultation' : visit.status.toUpperCase()}
                                        </Badge>
                                    </Td>
                                    <Td>
                                        {visit.follow_ups && visit.follow_ups.length > 0 ? (
                                            <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                                Due: {visit.follow_ups[0].follow_up_date}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-400">None</span>
                                        )}
                                    </Td>
                                    <Td align="right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            {visit.status === 'waiting' && (
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => handleStatusUpdate(visit.id, 'in_consultation')}
                                                >
                                                    <PhoneCall className="w-3.5 h-3.5 mr-1" /> Call Patient
                                                </Button>
                                            )}

                                            {visit.status === 'in_consultation' && (
                                                <>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openPrescribeModal(visit)}
                                                    >
                                                        <Calendar className="w-3.5 h-3.5 mr-1" /> Prescribe Follow-Up
                                                    </Button>
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        onClick={() => handleStatusUpdate(visit.id, 'completed')}
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Done
                                                    </Button>
                                                </>
                                            )}

                                            {visit.status === 'completed' && (
                                                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                                                </span>
                                            )}

                                            {visit.status !== 'cancelled' && visit.status !== 'completed' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleStatusUpdate(visit.id, 'cancelled')}
                                                    title="Cancel Serial"
                                                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                )}
            </Card>

            {/* Prescribe Follow-Up Modal */}
            <Modal
                isOpen={!!prescribeModalVisit}
                onClose={() => setPrescribeModalVisit(null)}
                title="Prescribe Follow-Up & Complete Consultation"
                subtitle={`Patient: ${prescribeModalVisit?.patient?.name} (Token: ${prescribeModalVisit?.token_number})`}
                size="sm"
            >
                {prescribeModalVisit && (
                    <form onSubmit={handlePrescribeSubmit} className="space-y-4">
                        <TextInput
                            label="Next Visit Date (Follow-Up Date)"
                            type="date"
                            icon={Calendar}
                            value={followUpDate}
                            onChange={(e) => setFollowUpDate(e.target.value)}
                            required
                            helperText="Patient will be scheduled in the follow_ups table with pending status"
                        />

                        <Toggle
                            label="Mark Consultation Completed"
                            description="Automatically completes this visit serial"
                            enabled={completeVisitOnPrescribe}
                            onChange={(val) => setCompleteVisitOnPrescribe(val)}
                        />

                        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                            <Button
                                variant="secondary"
                                onClick={() => setPrescribeModalVisit(null)}
                                disabled={submittingFollowUp}
                            >
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" loading={submittingFollowUp}>
                                Save Follow-Up
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>
        </AppLayout>
    );
}

