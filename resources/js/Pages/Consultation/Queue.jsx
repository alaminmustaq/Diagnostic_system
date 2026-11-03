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
    Sparkles,
    DoorOpen,
    CreditCard,
} from 'lucide-react';

export default function Queue({
    visits = [],
    doctors = [],
    selectedDoctorId,
    treatmentQueue = [],
    today,
    activeTab: initialActiveTab = 'visits',
}) {
    const [activeTab, setActiveTab] = useState(initialActiveTab || 'visits');

    // Visit queue filter state
    const [visitStatusFilter, setVisitStatusFilter] = useState('all');
    const [prescribeModalVisit, setPrescribeModalVisit] = useState(null);
    const [followUpDate, setFollowUpDate] = useState('');
    const [completeVisitOnPrescribe, setCompleteVisitOnPrescribe] = useState(true);
    const [submittingFollowUp, setSubmittingFollowUp] = useState(false);

    // Treatment queue filter state
    const [treatmentStatusFilter, setTreatmentStatusFilter] = useState('all');

    const handleDoctorFilter = (e) => {
        const docId = e.target.value;
        router.get('/consultation/queue', {
            ...(docId ? { doctor_id: docId } : {}),
            tab: activeTab,
        }, { preserveState: true });
    };

    const handleVisitStatusUpdate = (visitId, newStatus) => {
        router.patch(`/consultation/visits/${visitId}/status`, { status: newStatus }, { preserveScroll: true });
    };

    const handleTreatmentStatusUpdate = (treatmentId, newStatus) => {
        router.patch(`/consultation/treatments/${treatmentId}/status`, { status: newStatus }, { preserveScroll: true });
    };

    const openPrescribeModal = (visit) => {
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

    // Filtered lists and counts for Visits
    const filteredVisits = visits.filter((v) => {
        if (visitStatusFilter === 'all') return true;
        return v.status === visitStatusFilter;
    });

    const visitWaitingCount = visits.filter((v) => v.status === 'waiting').length;
    const visitInRoomCount = visits.filter((v) => v.status === 'in_consultation').length;
    const visitCompletedCount = visits.filter((v) => v.status === 'completed').length;

    // Filtered lists and counts for Treatments
    const filteredTreatments = treatmentQueue.filter((t) => {
        if (treatmentStatusFilter === 'all') return true;
        return t.status === treatmentStatusFilter;
    });

    const treatmentWaitingCount = treatmentQueue.filter((t) => t.status === 'waiting').length;
    const treatmentInCollectionCount = treatmentQueue.filter((t) => t.status === 'in_collection').length;
    const treatmentSampleCount = treatmentQueue.filter((t) => t.status === 'sample').length;

    return (
        <AppLayout title="Today's Patient Queue Board">
            <PageHeader
                title="Today's Patient Queue Board"
                subtitle="Live status board for doctor visits, consultations, and treatment collections"
                actions={
                    <div className="flex items-center gap-3">
                        {activeTab === 'visits' ? (
                            <>
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
                                        <Stethoscope className="w-4 h-4 mr-1.5" /> Doctor Room
                                    </Button>
                                </Link>
                            </>
                        ) : (
                            <Link href="/pos">
                                <Button variant="primary" size="sm">
                                    <CreditCard className="w-4 h-4 mr-1.5" /> Open Treatment POS
                                </Button>
                            </Link>
                        )}
                    </div>
                }
            />

            {/* Top Queue Board Tabs: Visits vs Treatments */}
            <div className="flex border-b border-slate-200 mb-6 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('visits')}
                    className={`py-3 px-5 text-sm font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                        activeTab === 'visits'
                            ? 'border-teal-600 text-teal-700'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Users className="w-4 h-4" />
                    <span>Doctor Visits Queue ({visits.length})</span>
                </button>
                <button
                    onClick={() => setActiveTab('treatments')}
                    className={`py-3 px-5 text-sm font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                        activeTab === 'treatments'
                            ? 'border-teal-600 text-teal-700'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Sparkles className="w-4 h-4" />
                    <span>Treatment Queue ({treatmentQueue.length})</span>
                </button>
            </div>

            {/* TAB 1: DOCTOR VISITS QUEUE */}
            {activeTab === 'visits' && (
                <div>
                    {/* Queue Status Filter Pills */}
                    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
                        <button
                            onClick={() => setVisitStatusFilter('all')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                                visitStatusFilter === 'all'
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            All Serials ({visits.length})
                        </button>
                        <button
                            onClick={() => setVisitStatusFilter('waiting')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                visitStatusFilter === 'waiting'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
                            }`}
                        >
                            <Clock className="w-3.5 h-3.5" /> Waiting in Lounge ({visitWaitingCount})
                        </button>
                        <button
                            onClick={() => setVisitStatusFilter('in_consultation')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                visitStatusFilter === 'in_consultation'
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50'
                            }`}
                        >
                            <Stethoscope className="w-3.5 h-3.5" /> In Consultation ({visitInRoomCount})
                        </button>
                        <button
                            onClick={() => setVisitStatusFilter('completed')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                visitStatusFilter === 'completed'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                            }`}
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Completed Today ({visitCompletedCount})
                        </button>
                    </div>

                    {/* Visits Table */}
                    <Card>
                        {filteredVisits.length === 0 ? (
                            <EmptyState
                                icon={Users}
                                title="No patients found in this visit queue state"
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
                                                            onClick={() => handleVisitStatusUpdate(visit.id, 'in_consultation')}
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
                                                                onClick={() => handleVisitStatusUpdate(visit.id, 'completed')}
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
                                                            onClick={() => handleVisitStatusUpdate(visit.id, 'cancelled')}
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
                </div>
            )}

            {/* TAB 2: TREATMENT & PROCEDURE QUEUE */}
            {activeTab === 'treatments' && (
                <div>
                    {/* Treatment Queue Filter Pills */}
                    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
                        <button
                            onClick={() => setTreatmentStatusFilter('all')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                                treatmentStatusFilter === 'all'
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            All Treatments ({treatmentQueue.length})
                        </button>
                        <button
                            onClick={() => setTreatmentStatusFilter('waiting')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                treatmentStatusFilter === 'waiting'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
                            }`}
                        >
                            <Clock className="w-3.5 h-3.5" /> Waiting ({treatmentWaitingCount})
                        </button>
                        <button
                            onClick={() => setTreatmentStatusFilter('in_collection')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                treatmentStatusFilter === 'in_collection'
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50'
                            }`}
                        >
                            <Clock className="w-3.5 h-3.5" /> In Collection ({treatmentInCollectionCount})
                        </button>
                        <button
                            onClick={() => setTreatmentStatusFilter('sample')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                treatmentStatusFilter === 'sample'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                            }`}
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Sample / Done ({treatmentSampleCount})
                        </button>
                    </div>

                    {/* Treatment Queue Table */}
                    <Card>
                        {filteredTreatments.length === 0 ? (
                            <EmptyState
                                icon={Sparkles}
                                title="No treatments found in this queue state"
                                description="Select another status or record treatments from the Treatment POS."
                            />
                        ) : (
                            <Table>
                                <Thead>
                                    <Tr>
                                        <Th className="w-28">Token #</Th>
                                        <Th>Patient Name</Th>
                                        <Th>Contact</Th>
                                        <Th>Treatment / Procedure</Th>
                                        <Th className="w-36">Category</Th>
                                        <Th>Room</Th>
                                        <Th>Status</Th>
                                        <Th align="right">Workflow Actions</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {filteredTreatments.map((item) => {
                                        const rowColor = item.treatment?.color;
                                        return (
                                            <Tr
                                                key={item.id}
                                                style={rowColor ? { backgroundColor: `${rowColor}10`, borderLeft: `4px solid ${rowColor}` } : undefined}
                                            >
                                                <Td style={rowColor ? { borderLeft: `4px solid ${rowColor}` } : undefined}>
                                                    <span className="inline-block px-2.5 py-1 rounded bg-teal-50 text-teal-900 font-mono text-xs font-black border border-teal-200">
                                                        {item.token_number || `#${item.id}`}
                                                    </span>
                                                </Td>
                                                <Td className="whitespace-normal">
                                                    <span className="font-bold text-slate-900 block">
                                                        {item.patient?.name || 'Walk-in Patient'}
                                                    </span>
                                                    <span className="text-[11px] text-slate-400">ID: {item.patient?.user_code || `PT-${item.patient_id}`}</span>
                                                </Td>
                                                <Td>
                                                    <span className="font-mono text-xs text-slate-600">{item.patient?.phone || '—'}</span>
                                                </Td>
                                                <Td className="whitespace-normal max-w-[200px]">
                                                    <div className="flex items-center gap-2">
                                                        {rowColor && (
                                                            <span
                                                                className="w-3.5 h-3.5 rounded-full shrink-0 border border-slate-300 shadow-2xs"
                                                                style={{ backgroundColor: rowColor }}
                                                                title={`Color: ${rowColor}`}
                                                            />
                                                        )}
                                                        <span className="font-bold text-slate-800 text-sm block">
                                                            {item.treatment?.name || 'Procedure'}
                                                        </span>
                                                    </div>
                                                </Td>
                                            <Td className="whitespace-normal max-w-[140px]">
                                                <Badge
                                                    variant="treatment"
                                                    className="whitespace-normal break-words text-left leading-snug rounded-lg py-1 px-2.5 inline-block"
                                                >
                                                    {item.treatment?.category?.name || 'General'}
                                                </Badge>
                                            </Td>
                                            <Td>
                                                {item.treatment?.room ? (
                                                    <Badge variant="info">
                                                        <DoorOpen className="w-3 h-3 mr-1" />
                                                        {item.treatment.room.room_number}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-slate-400">—</span>
                                                )}
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
                                                    {item.status === 'waiting' && (
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            onClick={() => handleTreatmentStatusUpdate(item.id, 'in_collection')}
                                                        >
                                                            <Clock className="w-3.5 h-3.5 mr-1" /> In Collection
                                                        </Button>
                                                    )}

                                                    {item.status === 'in_collection' && (
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
                                                </div>
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
