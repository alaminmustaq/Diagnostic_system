import React, { useState, useEffect, useRef } from "react";
import { router, usePage, Link } from "@inertiajs/react";
import AppLayout from "../../Layouts/AppLayout";
import PageHeader from "../../Components/UI/PageHeader";
import Card from "../../Components/UI/Card";
import StatCard from "../../Components/UI/StatCard";
import Button from "../../Components/UI/Button";
import Badge from "../../Components/UI/Badge";
import Modal from "../../Components/Modal/Modal";
import Textarea from "../../Components/Form/Textarea";
import { usePermissions } from "../../Utils/permissions";
import {
    Table,
    Thead,
    Tbody,
    Th,
    Td,
    Tr,
    EmptyState,
} from "../../Components/Table";
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
    Search,
    X,
    RotateCcw,
    DoorOpen,
    User,
    Phone,
    Sliders,
} from "lucide-react";

export default function FollowUps({
    followUps = [],
    doctors = [],
    patients = [],
    summary = {},
    filters = {},
    today,
    tomorrow,
}) {
    const { can } = usePermissions();
    const { company_setting } = usePage().props;
    const [runningJob, setRunningJob] = useState(false);
    const [broadcastModalItem, setBroadcastModalItem] = useState(null);
    const [broadcastMessage, setBroadcastMessage] = useState("");

    // Local filter state for immediate UI feedback
    const [patientSearch, setPatientSearch] = useState(
        filters.patient_search || "",
    );
    const [fromDate, setFromDate] = useState(filters.from_date || "");
    const [toDate, setToDate] = useState(filters.to_date || "");
    const searchTimeoutRef = useRef(null);

    // Debounced search for patient filter
    const handlePatientSearchChange = (val) => {
        setPatientSearch(val);
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            handleFilterChange("patient_search", val);
        }, 400);
    };

    const handleFilterChange = (key, val) => {
        const newFilters = { ...filters, [key]: val };
        if (!val) {
            delete newFilters[key];
        }
        // If changing date_filter preset, clear specific from/to dates unless it's custom
        if (key === "date_filter" && val !== "custom") {
            delete newFilters.from_date;
            delete newFilters.to_date;
            setFromDate("");
            setToDate("");
        }
        // If entering from_date or to_date, reset preset date_filter
        if (key === "from_date" || key === "to_date") {
            delete newFilters.date_filter;
        }
        router.get("/follow-ups", newFilters, {
            preserveState: true,
            replace: true,
        });
    };

    const handleClearDateRange = () => {
        setFromDate("");
        setToDate("");
        const newFilters = { ...filters };
        delete newFilters.from_date;
        delete newFilters.to_date;
        delete newFilters.date_filter;
        router.get("/follow-ups", newFilters, {
            preserveState: true,
            replace: true,
        });
    };

    const handleResetAllFilters = () => {
        setPatientSearch("");
        setFromDate("");
        setToDate("");
        router.get("/follow-ups", {}, { preserveState: true });
    };

    const hasActiveFilters = Boolean(
        filters.doctor_id ||
        filters.patient_search ||
        filters.status ||
        filters.date_filter ||
        filters.from_date ||
        filters.to_date,
    );

    const handleRunDailyCron = () => {
        setRunningJob(true);
        router.post(
            "/follow-ups/run-daily-job",
            {},
            {
                onFinish: () => setRunningJob(false),
            },
        );
    };

    const handleStatusUpdate = (id, newStatus) => {
        router.patch(`/follow-ups/${id}/status`, { status: newStatus });
    };

    const openBroadcastModal = (item) => {
        const patientName = item.patient?.name || "Valued Patient";
        const docName = item.doctor?.name || "Doctor";
        const date = item.follow_up_date || "";
        const clinicName =
            company_setting?.company_name || "Aesthetic & Dermatology Clinic";
        const clinicPhone = company_setting?.company_phone || "";
        const clinicAddress = company_setting?.company_address || "";
        const clinicEmail = company_setting?.company_email || "";

        const template =
            company_setting?.whatsapp_followup_message ||
            "Hello {patient_name}, this is a reminder from {clinic_name}. Your scheduled follow-up consultation with {doctor_name} is due on {follow_up_date}. Please visit on time. Thank you!";

        const formattedMsg = template
            .replace(/{patient_name}/g, patientName)
            .replace(/{doctor_name}/g, docName)
            .replace(/{follow_up_date}/g, date)
            .replace(/{clinic_name}/g, clinicName)
            .replace(/{clinic_phone}/g, clinicPhone)
            .replace(/{clinic_address}/g, clinicAddress)
            .replace(/{clinic_email}/g, clinicEmail);

        setBroadcastMessage(formattedMsg);
        setBroadcastModalItem(item);
    };

    const sendWhatsAppBroadcast = () => {
        if (!broadcastModalItem) return;

        // Clean phone number for international WhatsApp link
        let phone = broadcastModalItem.patient?.phone?.replace(/\D/g, "") || "";
        if (phone.startsWith("0")) {
            phone = "88" + phone; // Bangladesh country code default
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
                    window.open(waUrl, "_blank");
                },
            },
        );
    };

    // Helper for relative date badges
    const getRelativeDueBadge = (dueDate) => {
        if (!dueDate) return null;
        if (dueDate === today) {
            return (
                <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                    Due Today
                </span>
            );
        }
        if (dueDate === tomorrow) {
            return (
                <span className="inline-block px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                    Due Tomorrow
                </span>
            );
        }
        if (dueDate < today) {
            return (
                <span className="inline-block px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                    Overdue
                </span>
            );
        }
        return (
            <span className="inline-block px-1.5 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200 text-[10px] font-medium">
                Upcoming
            </span>
        );
    };

    return (
        <AppLayout title="Follow-Ups & WhatsApp Engine">
            <PageHeader
                title="Automated Follow-Ups & WhatsApp Engine"
                subtitle="Daily background reminder dispatch, patient return schedules, and direct WhatsApp broadcasts"
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        {can("view-configuration-settings") && (
                            <Link
                                href="/settings/configuration?tab=whatsapp"
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-emerald-700 hover:border-emerald-300 transition shadow-2xs"
                            >
                                <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Message Template</span>
                            </Link>
                        )}
                        {can("whatsapp-followup") && (
                            <Button
                                variant="primary"
                                onClick={handleRunDailyCron}
                                loading={runningJob}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 text-xs sm:text-sm"
                            >
                                <Play className="w-4 h-4 mr-1.5" /> Run Daily
                                WhatsApp Cron (Tomorrow: {tomorrow})
                            </Button>
                        )}
                    </div>
                }
            />

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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

            {/* Comprehensive Filter Bar with Patient & Date Range */}
            <Card className="mb-6" bodyClassName="p-4 sm:p-5">
                <div className="space-y-4">
                    {/* Top Row: Patient Filter & Doctor Filter */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-end">
                        {/* 1. Patient Search Filter */}
                        <div className="md:col-span-5">
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                                Search Patient (Name, Phone, Code)
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Type patient name, phone (017...), or code (PT-...)..."
                                    value={patientSearch}
                                    onChange={(e) =>
                                        handlePatientSearchChange(
                                            e.target.value,
                                        )
                                    }
                                    className="w-full pl-8 pr-8 py-2 text-xs rounded-lg border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-2xs"
                                />
                                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                {patientSearch && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPatientSearch("");
                                            handleFilterChange(
                                                "patient_search",
                                                "",
                                            );
                                        }}
                                        className="p-1 text-slate-400 hover:text-slate-600 absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
                                        title="Clear patient search"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 2. Doctor Filter */}
                        <div className="md:col-span-4">
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                                Filter by Doctor
                            </label>
                            <select
                                value={filters.doctor_id || ""}
                                onChange={(e) =>
                                    handleFilterChange(
                                        "doctor_id",
                                        e.target.value,
                                    )
                                }
                                className="w-full text-xs bg-white border border-slate-300 rounded-lg py-2 px-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                            >
                                <option value="">All Doctors</option>
                                {doctors.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name}{" "}
                                        {d.doctor_profile?.room_number
                                            ? `(Room ${d.doctor_profile.room_number})`
                                            : ""}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 3. Status Filter */}
                        <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                                Status
                            </label>
                            <select
                                value={filters.status || ""}
                                onChange={(e) =>
                                    handleFilterChange("status", e.target.value)
                                }
                                className="w-full text-xs bg-white border border-slate-300 rounded-lg py-2 px-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="completed">
                                    Completed (Returned)
                                </option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>

                    {/* Bottom Row: Date Range Filter (From / To Date & Preset Quick Select) */}
                    <div className="pt-3 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            {/* Preset Dropdown */}
                            <div>
                                <select
                                    value={
                                        filters.date_filter ||
                                        (fromDate || toDate ? "custom" : "")
                                    }
                                    onChange={(e) =>
                                        handleFilterChange(
                                            "date_filter",
                                            e.target.value,
                                        )
                                    }
                                    className="text-xs bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                                >
                                    <option value="">
                                        All Scheduled Dates
                                    </option>
                                    <option value="today">
                                        Today ({today})
                                    </option>
                                    <option value="tomorrow">
                                        Tomorrow ({tomorrow})
                                    </option>
                                    <option value="upcoming_week">
                                        Next 7 Days
                                    </option>
                                    <option value="this_month">
                                        This Month
                                    </option>
                                    <option value="custom">
                                        Custom Date Range
                                    </option>
                                </select>
                            </div>

                            {/* Date Range Inputs: From Date -> To Date */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-semibold text-slate-500">
                                        From:
                                    </span>
                                    <input
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) => {
                                            setFromDate(e.target.value);
                                            handleFilterChange(
                                                "from_date",
                                                e.target.value,
                                            );
                                        }}
                                        className="py-1 px-2.5 text-xs rounded-lg border border-slate-300 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                                        title="From follow-up date"
                                    />
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-semibold text-slate-500">
                                        To:
                                    </span>
                                    <input
                                        type="date"
                                        value={toDate}
                                        onChange={(e) => {
                                            setToDate(e.target.value);
                                            handleFilterChange(
                                                "to_date",
                                                e.target.value,
                                            );
                                        }}
                                        className="py-1 px-2.5 text-xs rounded-lg border border-slate-300 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                                        title="To follow-up date"
                                    />
                                </div>

                                {(fromDate || toDate) && (
                                    <Button
                                        variant="ghost"
                                        size="xs"
                                        onClick={handleClearDateRange}
                                        className="text-slate-400 hover:text-rose-600"
                                        title="Clear custom date range"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Reset All Filters Button */}
                        {hasActiveFilters && (
                            <Button
                                variant="outline"
                                size="xs"
                                onClick={handleResetAllFilters}
                                className="text-slate-600 border-slate-200 hover:bg-slate-100 self-start sm:self-auto"
                            >
                                <RotateCcw className="w-3 h-3 mr-1.5" /> Reset
                                Filters
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            {/* Follow-Ups Responsive Data Table & Mobile Cards */}
            <Card
                title={`Scheduled Follow-Ups (${followUps.length})`}
                subtitle="Real-time patient follow-up appointment log with contact numbers, notification state, and WhatsApp action triggers"
                bodyClassName="p-0 sm:p-0"
            >
                {followUps.length === 0 ? (
                    <div className="p-6">
                        <EmptyState
                            icon={Calendar}
                            title="No follow-up appointments match your criteria"
                            description={
                                hasActiveFilters
                                    ? "Try modifying your patient search, date range, doctor, or status filter."
                                    : "Follow-ups prescribed by doctors during consultations will automatically populate this schedule board."
                            }
                        />
                    </div>
                ) : (
                    <>
                        {/* 1. Desktop & Tablet Streamlined Responsive Table (hidden on mobile, md:block) */}
                        <div className="hidden md:block">
                            <Table className="w-full">
                                <Thead>
                                    <Tr>
                                        <Th className="w-40">
                                            Due Date & Token
                                        </Th>
                                        <Th>Patient Details</Th>
                                        <Th>Doctor & Room</Th>
                                        <Th className="w-48">
                                            Status & WhatsApp
                                        </Th>
                                        <Th align="right" className="w-44">
                                            Actions
                                        </Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {followUps.map((item) => (
                                        <Tr key={item.id}>
                                            {/* Due Date & Token */}
                                            <Td className="whitespace-normal">
                                                <div className="flex items-center gap-1.5 font-bold text-slate-900 font-mono text-xs">
                                                    <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                                    <span>
                                                        {item.follow_up_date}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    {getRelativeDueBadge(
                                                        item.follow_up_date,
                                                    )}
                                                    {item.source_visit
                                                        ?.token_number ? (
                                                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] font-semibold border border-slate-200">
                                                            {
                                                                item
                                                                    .source_visit
                                                                    .token_number
                                                            }
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400">
                                                            Manual
                                                        </span>
                                                    )}
                                                </div>
                                            </Td>

                                            {/* Patient Details */}
                                            <Td className="whitespace-normal">
                                                <span className="font-bold text-slate-900 block text-xs">
                                                    {item.patient?.name ||
                                                        "Walk-in Patient"}
                                                </span>
                                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono mt-0.5">
                                                    {item.patient
                                                        ?.user_code && (
                                                        <span className="text-slate-400">
                                                            ID:{" "}
                                                            {
                                                                item.patient
                                                                    .user_code
                                                            }
                                                        </span>
                                                    )}
                                                    {item.patient?.user_code &&
                                                        item.patient?.phone && (
                                                            <span>•</span>
                                                        )}
                                                    {item.patient?.phone && (
                                                        <span>
                                                            {item.patient.phone}
                                                        </span>
                                                    )}
                                                </div>
                                            </Td>

                                            {/* Doctor & Room */}
                                            <Td className="whitespace-normal">
                                                <span className="font-semibold text-slate-800 text-xs block">
                                                    {item.doctor?.name ||
                                                        "Clinic Physician"}
                                                </span>
                                                <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                                                    {item.doctor?.doctor_profile
                                                        ?.room_number ? (
                                                        <span className="inline-flex items-center gap-1 font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">
                                                            <DoorOpen className="w-2.5 h-2.5 text-slate-400" />
                                                            Room{" "}
                                                            {
                                                                item.doctor
                                                                    .doctor_profile
                                                                    .room_number
                                                            }
                                                        </span>
                                                    ) : (
                                                        <span>
                                                            {item.doctor
                                                                ?.doctor_profile
                                                                ?.designation ||
                                                                "Consultant"}
                                                        </span>
                                                    )}
                                                </div>
                                            </Td>

                                            {/* Status & WhatsApp State */}
                                            <Td className="whitespace-normal">
                                                <div className="space-y-1">
                                                    <div>
                                                        <Badge
                                                            variant={
                                                                item.status
                                                            }
                                                        >
                                                            {item.status.toUpperCase()}
                                                        </Badge>
                                                    </div>
                                                    <div>
                                                        {item.is_notified ? (
                                                            <Badge
                                                                variant="success"
                                                                className="text-[10px] py-0.5"
                                                            >
                                                                <CheckCircle2 className="w-2.5 h-2.5 mr-1" />{" "}
                                                                Notified
                                                            </Badge>
                                                        ) : (
                                                            <Badge
                                                                variant="warning"
                                                                className="text-[10px] py-0.5"
                                                            >
                                                                <Clock className="w-2.5 h-2.5 mr-1" />{" "}
                                                                Pending WhatsApp
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </Td>

                                            {/* Action Buttons */}
                                            <Td align="right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {can(
                                                        "whatsapp-followup",
                                                    ) && (
                                                        <Button
                                                            variant="outline"
                                                            size="xs"
                                                            onClick={() =>
                                                                openBroadcastModal(
                                                                    item,
                                                                )
                                                            }
                                                            className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                                                            title="Dispatch WhatsApp Notification"
                                                        >
                                                            <MessageCircle className="w-3.5 h-3.5 mr-1" />{" "}
                                                            WhatsApp
                                                        </Button>
                                                    )}

                                                    {item.status ===
                                                        "pending" &&
                                                        can(
                                                            "edit-follow-ups",
                                                        ) && (
                                                            <Button
                                                                variant="secondary"
                                                                size="xs"
                                                                onClick={() =>
                                                                    handleStatusUpdate(
                                                                        item.id,
                                                                        "completed",
                                                                    )
                                                                }
                                                                title="Mark Consultation Resolved"
                                                            >
                                                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />{" "}
                                                                Resolve
                                                            </Button>
                                                        )}

                                                    {!can(
                                                        "whatsapp-followup",
                                                    ) &&
                                                        !can(
                                                            "edit-follow-ups",
                                                        ) && (
                                                            <span className="text-xs text-slate-400">
                                                                View Only
                                                            </span>
                                                        )}
                                                </div>
                                            </Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        </div>

                        {/* 2. Mobile Adaptive Card List (md:hidden) */}
                        <div className="md:hidden divide-y divide-slate-100">
                            {followUps.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-4 space-y-3"
                                    style={{
                                        borderLeft: item.is_notified
                                            ? "4px solid #10b981"
                                            : "4px solid #f59e0b",
                                        backgroundColor: item.is_notified
                                            ? "#10b98105"
                                            : "#f59e0b05",
                                    }}
                                >
                                    {/* Card Header: Due Date & Status Badges */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 font-bold font-mono text-xs text-slate-900">
                                            <Calendar className="w-3.5 h-3.5 text-teal-600" />
                                            <span>{item.follow_up_date}</span>
                                            {getRelativeDueBadge(
                                                item.follow_up_date,
                                            )}
                                        </div>
                                        <Badge variant={item.status}>
                                            {item.status.toUpperCase()}
                                        </Badge>
                                    </div>

                                    {/* Patient Info */}
                                    <div className="flex justify-between items-start gap-2">
                                        <div>
                                            <span className="font-bold text-slate-900 text-sm block">
                                                {item.patient?.name ||
                                                    "Walk-in Patient"}
                                            </span>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono mt-0.5">
                                                {item.patient?.user_code && (
                                                    <span>
                                                        ID:{" "}
                                                        {item.patient.user_code}
                                                    </span>
                                                )}
                                                {item.patient?.phone && (
                                                    <span>
                                                        • {item.patient.phone}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {item.source_visit?.token_number && (
                                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-xs font-semibold border border-slate-200">
                                                {item.source_visit.token_number}
                                            </span>
                                        )}
                                    </div>

                                    {/* Doctor Info & Notification State */}
                                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                                        <div className="flex items-center gap-1 text-slate-700">
                                            <span className="font-semibold">
                                                {item.doctor?.name}
                                            </span>
                                            {item.doctor?.doctor_profile
                                                ?.room_number && (
                                                <span className="text-slate-400 font-mono text-[11px]">
                                                    (Room{" "}
                                                    {
                                                        item.doctor
                                                            .doctor_profile
                                                            .room_number
                                                    }
                                                    )
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            {item.is_notified ? (
                                                <Badge
                                                    variant="success"
                                                    className="text-[10px] py-0.5"
                                                >
                                                    <CheckCircle2 className="w-2.5 h-2.5 mr-1" />{" "}
                                                    Notified
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant="warning"
                                                    className="text-[10px] py-0.5"
                                                >
                                                    <Clock className="w-2.5 h-2.5 mr-1" />{" "}
                                                    Pending
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Footer: Actions */}
                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                        {can("whatsapp-followup") && (
                                            <Button
                                                variant="outline"
                                                size="xs"
                                                onClick={() =>
                                                    openBroadcastModal(item)
                                                }
                                                className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                                            >
                                                <MessageCircle className="w-3.5 h-3.5 mr-1" />{" "}
                                                WhatsApp
                                            </Button>
                                        )}

                                        {item.status === "pending" &&
                                            can("edit-follow-ups") && (
                                                <Button
                                                    variant="secondary"
                                                    size="xs"
                                                    onClick={() =>
                                                        handleStatusUpdate(
                                                            item.id,
                                                            "completed",
                                                        )
                                                    }
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />{" "}
                                                    Resolve
                                                </Button>
                                            )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
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
                            onChange={(e) =>
                                setBroadcastMessage(e.target.value)
                            }
                            helperText="Pre-set by clinic configuration. You can edit this text before dispatching to WhatsApp."
                        />

                        {can("view-configuration-settings") && (
                            <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                                <span>
                                    Default template can be customized in
                                    settings:
                                </span>
                                <Link
                                    href="/settings/configuration?tab=whatsapp"
                                    className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
                                >
                                    <Sliders className="w-3 h-3" /> Edit
                                    Template
                                </Link>
                            </div>
                        )}

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
                                <Send className="w-4 h-4 mr-1.5" /> Dispatch via
                                WhatsApp
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </AppLayout>
    );
}
