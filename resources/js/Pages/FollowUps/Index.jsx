import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/UI/PageHeader';
import Card from '../../Components/UI/Card';
import StatCard from '../../Components/UI/StatCard';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import Modal from '../../Components/Modal/Modal';
import Textarea from '../../Components/Form/Textarea';
import { Table, Thead, Tbody, Th, Td, Tr, EmptyState } from '../../Components/Table';
import {
    MessageCircle,
    Send,
    Calendar,
    CheckCircle2,
    Clock,
    AlertCircle,
    UserCheck,
    Play,
    ExternalLink,
    Filter,
} from 'lucide-react';

export default function FollowUps({
    followUps = [],
    doctors = [],
    summary = {},
    filters = {},
    today,
    tomorrow,
}) {
    const [runningJob, setRunningJob] = useState(false);
    const [broadcastModalItem, setBroadcastModalItem] = useState(null);
    const [broadcastMessage, setBroadcastMessage] = useState('');

    const handleFilterChange = (key, val) => {
        const newFilters = { ...filters, [key]: val };
        if (!val) delete newFilters[key];
        router.get('/follow-ups', newFilters, { preserveState: true });
    };

    const handleRunDailyCron = () => {
        setRunningJob(true);
        router.post(
            '/follow-ups/run-daily-job',
            {},
            {
                onFinish: () => setRunningJob(false),
            }
        );
    };

    const handleStatusUpdate = (id, newStatus) => {
        router.patch(`/follow-ups/${id}/status`, { status: newStatus });
    };

    const openBroadcastModal = (item) => {
        const patientName = item.patient?.name || 'Patient';
        const docName = item.doctor?.name || 'Doctor';
        const date = item.follow_up_date;
        const defaultMsg = `Hello ${patientName}, this is a gentle reminder from Aesthetic & Dermatology Clinic. Your scheduled follow-up consultation with ${docName} is due on ${date}. Please visit our clinic desk on time. Thank you!`;

        setBroadcastMessage(defaultMsg);
        setBroadcastModalItem(item);
    };

    const sendWhatsAppBroadcast = () => {
        if (!broadcastModalItem) return;

        // Clean phone number for international WhatsApp link
        let phone = broadcastModalItem.patient?.phone?.replace(/\D/g, '') || '';
        if (phone.startsWith('0')) {
            phone = '88' + phone; // Bangladesh country code default
        }

        const encodedMsg = encodeURIComponent(broadcastMessage);
        const waUrl = `https://wa.me/${phone}?text=${encodedMsg}`;

        // Mark as notified in backend
        router.post(
            `/follow-ups/${broadcastModalItem.id}/mark-notified`,
            {},
            {
                onSuccess: () => {
                    setBroadcastModalItem(null);
                    window.open(waUrl, '_blank');
                },
            }
        );
    };

    return (
        <AppLayout title="Follow-Ups & WhatsApp Engine">
            <PageHeader
                title="Automated Follow-Ups & WhatsApp Engine"
                subtitle="Daily background reminder dispatch, smart auto-resolve on early visits, and manual clinician broadcasts"
                actions={
                    <Button
                        variant="primary"
                        onClick={handleRunDailyCron}
                        loading={runningJob}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25"
                    >
                        <Play className="w-4 h-4 mr-1.5" /> Run Daily WhatsApp Cron Job (Tomorrow: {tomorrow})
                    </Button>
                }
            />

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                <StatCard
                    title="Due Tomorrow (Target Queue)"
                    value={summary.due_tomorrow_unnotified || 0}
                    subtitle={`Follow-up date: ${tomorrow} (unnotified)`}
                    icon={Clock}
                    color="amber"
                />
                <StatCard
                    title="Total Pending Follow-Ups"
                    value={summary.total_pending || 0}
                    subtitle="Awaiting return consultation"
                    icon={MessageCircle}
                    color="teal"
                />
                <StatCard
                    title="Successfully Returned"
                    value={summary.completed || 0}
                    subtitle="Completed or auto-resolved visits"
                    icon={CheckCircle2}
                    color="emerald"
                />
            </div>

            {/* Filters Bar */}
            <Card className="mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            Filter by Doctor
                        </label>
                        <select
                            value={filters.doctor_id || ''}
                            onChange={(e) => handleFilterChange('doctor_id', e.target.value)}
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

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            Follow-Up Date Range
                        </label>
                        <select
                            value={filters.date_filter || ''}
                            onChange={(e) => handleFilterChange('date_filter', e.target.value)}
                            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                            <option value="">All Scheduled Dates</option>
                            <option value="today">Today ({today})</option>
                            <option value="tomorrow">Tomorrow ({tomorrow})</option>
                            <option value="upcoming_week">Next 7 Days</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            Status
                        </label>
                        <select
                            value={filters.status || ''}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed (Returned)</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Follow-Ups Table */}
            <Card title="Patient Follow-Up Schedules">
                {followUps.length === 0 ? (
                    <EmptyState
                        icon={Calendar}
                        title="No follow-up appointments found"
                        description="Follow-ups prescribed by doctors during consultations will appear here."
                    />
                ) : (
                    <Table>
                        <Thead>
                            <Tr>
                                <Th>Due Date</Th>
                                <Th>Patient Name</Th>
                                <Th>Phone</Th>
                                <Th>Doctor</Th>
                                <Th>Source Token</Th>
                                <Th>WhatsApp State</Th>
                                <Th>Status</Th>
                                <Th align="right">Actions</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {followUps.map((item) => (
                                <Tr key={item.id}>
                                    <Td>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-teal-600" />
                                            <span className="font-bold text-slate-900 font-mono text-sm">
                                                {item.follow_up_date}
                                            </span>
                                        </div>
                                    </Td>
                                    <Td>
                                        <span className="font-bold text-slate-900">{item.patient?.name}</span>
                                    </Td>
                                    <Td>
                                        <span className="font-mono text-xs text-slate-600">{item.patient?.phone}</span>
                                    </Td>
                                    <Td>
                                        <span className="text-xs font-semibold text-slate-800">
                                            {item.doctor?.name}
                                        </span>
                                    </Td>
                                    <Td>
                                        {item.source_visit ? (
                                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-xs">
                                                {item.source_visit.token_number}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 text-xs">Manual</span>
                                        )}
                                    </Td>
                                    <Td>
                                        {item.is_notified ? (
                                            <Badge variant="success">
                                                <CheckCircle2 className="w-3 h-3 mr-1" /> Notified
                                            </Badge>
                                        ) : (
                                            <Badge variant="warning">
                                                <Clock className="w-3 h-3 mr-1" /> Pending Notification
                                            </Badge>
                                        )}
                                    </Td>
                                    <Td>
                                        <Badge variant={item.status}>
                                            {item.status.toUpperCase()}
                                        </Badge>
                                    </Td>
                                    <Td align="right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openBroadcastModal(item)}
                                                className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                                            >
                                                <MessageCircle className="w-3.5 h-3.5 mr-1" /> WhatsApp
                                            </Button>

                                            {item.status === 'pending' && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleStatusUpdate(item.id, 'completed')}
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Resolve
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

            {/* Manual WhatsApp Broadcast Modal */}
            <Modal
                isOpen={!!broadcastModalItem}
                onClose={() => setBroadcastModalItem(null)}
                title="Send Custom WhatsApp Notification"
                subtitle={`Recipient: ${broadcastModalItem?.patient?.name} (${broadcastModalItem?.patient?.phone})`}
                size="md"
            >
                {broadcastModalItem && (
                    <div className="space-y-4">
                        <Textarea
                            label="WhatsApp Message Preview"
                            rows={4}
                            value={broadcastMessage}
                            onChange={(e) => setBroadcastMessage(e.target.value)}
                            helperText="Opens WhatsApp Web or App directly with this pre-filled message and updates status to Notified."
                        />

                        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                            <Button
                                variant="secondary"
                                onClick={() => setBroadcastModalItem(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={sendWhatsAppBroadcast}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            >
                                <Send className="w-4 h-4 mr-1.5" /> Dispatch via WhatsApp
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </AppLayout>
    );
}

