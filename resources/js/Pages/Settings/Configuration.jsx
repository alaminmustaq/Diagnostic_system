import React, { useState, useRef } from 'react';
import { useForm } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/UI/PageHeader';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Toggle from '../../Components/Form/Toggle';
import TextInput from '../../Components/Form/TextInput';
import Textarea from '../../Components/Form/Textarea';
import { usePermissions } from '../../Utils/permissions';
import {
    Printer,
    MessageCircle,
    CheckCircle2,
    Scissors,
    Ruler,
    Sparkles,
    Smartphone,
    RotateCcw,
    Send,
    Tag,
    Info,
    Check,
    Clock,
    Building2,
    CheckCheck,
} from 'lucide-react';

const DEFAULT_WHATSAPP_TEMPLATE =
    'Hello {patient_name}, this is a reminder from {clinic_name}. Your scheduled follow-up consultation with {doctor_name} is due on {follow_up_date}. Please visit on time. Thank you!';

export default function Configuration({ setting }) {
    const { can } = usePermissions();

    const getInitialTab = () => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('tab') === 'whatsapp') {
                return 'whatsapp';
            }
        }
        return 'print';
    };

    const [activeTab, setActiveTab] = useState(getInitialTab);
    const textareaRef = useRef(null);
    const [copiedTag, setCopiedTag] = useState(null);

    const { data, setData, post, processing, errors } = useForm({
        token_print_size: setting?.token_print_size || '80mm',
        custom_print_width: setting?.custom_print_width || 80,
        custom_print_height: setting?.custom_print_height || '',
        print_separate_slips: setting?.print_separate_slips ?? true,
        token_header_note: setting?.token_header_note || 'Patient Serial Consultation Token',
        token_footer_note:
            setting?.token_footer_note || 'Please wait in the reception lounge until your serial is announced.',
        whatsapp_followup_message: setting?.whatsapp_followup_message || DEFAULT_WHATSAPP_TEMPLATE,
    });

    const printSizes = [
        {
            id: '80mm',
            title: '80mm Thermal Roll',
            description: 'Standard POS thermal printers (Epson, Xprinter, Rongta). Most popular for reception queue slips.',
            widthPx: '300px',
            widthMm: '80mm',
            badge: 'Recommended',
        },
        {
            id: '58mm',
            title: '58mm Mini Thermal',
            description: 'Compact 2-inch mini receipt printers and wireless bluetooth desktop terminals.',
            widthPx: '230px',
            widthMm: '58mm',
            badge: 'Compact',
        },
        {
            id: 'a5',
            title: 'A5 Half Sheet (148mm)',
            description: 'Laser or inkjet printers using half-size standard office paper.',
            widthPx: '420px',
            widthMm: '148mm',
            badge: 'Standard Paper',
        },
        {
            id: 'a4',
            title: 'A4 Full Page (210mm)',
            description: 'Full-size office documents with generous margins.',
            widthPx: '540px',
            widthMm: '210mm',
            badge: 'Full Sheet',
        },
        {
            id: 'custom',
            title: 'Manual / Custom Size',
            description: 'Set custom roll or sheet dimensions in millimeters (e.g. 76mm, 100mm, etc.).',
            widthPx: `${Math.min(Math.max(180, Math.round((parseInt(data.custom_print_width) || 80) * 3.78)), 580)}px`,
            widthMm: `${data.custom_print_width || 80}mm`,
            badge: 'Custom Sizing',
        },
    ];

    const quickWidthPresets = [58, 72, 76, 80, 100, 105, 148];

    const availableTags = [
        { tag: '{patient_name}', label: 'Patient Name', example: 'Tanvir Ahmed' },
        { tag: '{doctor_name}', label: 'Doctor Name', example: 'Dr. Farhana' },
        { tag: '{follow_up_date}', label: 'Follow-Up Date', example: 'Tomorrow (05 Nov 2026)' },
        { tag: '{clinic_name}', label: 'Clinic Name', example: setting?.company_name || 'Aesthetic Clinic' },
        { tag: '{clinic_phone}', label: 'Clinic Phone', example: setting?.company_phone || '+880 1700-000000' },
        { tag: '{clinic_address}', label: 'Clinic Address', example: setting?.company_address || 'Dhanmondi, Dhaka' },
    ];

    const handleTabChange = (tabKey) => {
        setActiveTab(tabKey);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', tabKey);
            window.history.replaceState({}, '', url.toString());
        }
    };

    const handleInsertTag = (tag) => {
        const el = textareaRef.current;
        if (!el) {
            setData('whatsapp_followup_message', (data.whatsapp_followup_message || '') + ' ' + tag);
            return;
        }

        const start = el.selectionStart ?? el.value.length;
        const end = el.selectionEnd ?? el.value.length;
        const currentText = data.whatsapp_followup_message || '';
        const newText = currentText.substring(0, start) + tag + currentText.substring(end);
        setData('whatsapp_followup_message', newText);

        setCopiedTag(tag);
        setTimeout(() => setCopiedTag(null), 1500);

        setTimeout(() => {
            el.focus();
            const newPos = start + tag.length;
            el.setSelectionRange(newPos, newPos);
        }, 50);
    };

    const handleResetWhatsAppTemplate = () => {
        setData('whatsapp_followup_message', DEFAULT_WHATSAPP_TEMPLATE);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/settings/configuration', {
            preserveScroll: true,
        });
    };

    const currentSizeConfig = printSizes.find((s) => s.id === data.token_print_size) || printSizes[0];

    const simulatedWidthPx =
        data.token_print_size === 'custom'
            ? `${Math.min(Math.max(180, Math.round((parseInt(data.custom_print_width) || 80) * 3.78)), 580)}px`
            : currentSizeConfig.widthPx;

    // Build sample live preview message by substituting placeholder tags
    const samplePreviewMessage = (data.whatsapp_followup_message || '')
        .replace(/{patient_name}/g, 'Tanvir Ahmed')
        .replace(/{doctor_name}/g, 'Dr. Farhana')
        .replace(/{follow_up_date}/g, 'Tomorrow, 05 Nov 2026')
        .replace(/{clinic_name}/g, setting?.company_name || 'Aesthetic & Dermatology Clinic')
        .replace(/{clinic_phone}/g, setting?.company_phone || '+880 1700-000000')
        .replace(/{clinic_address}/g, setting?.company_address || 'House #12, Road #5, Dhanmondi, Dhaka')
        .replace(/{clinic_email}/g, setting?.company_email || 'info@clinicdiagnostic.com');

    return (
        <AppLayout title="System Configuration & Settings">
            <PageHeader
                title="System Configuration & Preferences"
                subtitle="Configure printer paper dimensions for tokens/invoices, slip separation rules, and customizable WhatsApp notification message templates"
            />

            {/* Tab Navigation */}
            <div className="flex flex-wrap items-center gap-3 mb-6 border-b border-slate-200 pb-4">
                <button
                    type="button"
                    onClick={() => handleTabChange('print')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
                        activeTab === 'print'
                            ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                    <Printer className="w-4 h-4" />
                    <span>POS Thermal & Print Sizing</span>
                </button>

                <button
                    type="button"
                    onClick={() => handleTabChange('whatsapp')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
                        activeTab === 'whatsapp'
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp Notification Message</span>
                    <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            activeTab === 'whatsapp'
                                ? 'bg-emerald-800 text-emerald-100'
                                : 'bg-emerald-100 text-emerald-800'
                        }`}
                    >
                        Pre-set Template
                    </span>
                </button>
            </div>

            {/* TAB 1: Print & Thermal Slip Sizing */}
            {activeTab === 'print' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-200">
                    {/* Configuration Options (Left 7 cols) */}
                    <div className="lg:col-span-7">
                        <Card
                            title="Printer Paper & POS Thermal Sizing"
                            subtitle="Controls physical dimensions for serial tokens and POS treatment invoices"
                        >
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Token & Invoice Size Radio Cards */}
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-3">
                                        POS Printer Paper Size (Tokens & Receipts)
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        {printSizes.map((size) => {
                                            const isSelected = data.token_print_size === size.id;
                                            return (
                                                <div
                                                    key={size.id}
                                                    onClick={() => setData('token_print_size', size.id)}
                                                    className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${
                                                        isSelected
                                                            ? 'border-teal-600 bg-teal-50/40 shadow-xs'
                                                            : 'border-slate-200 bg-white hover:border-slate-300'
                                                    }`}
                                                >
                                                    <div>
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <span className="font-bold text-sm text-slate-900">
                                                                {size.title}
                                                            </span>
                                                            <span
                                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                                                    isSelected
                                                                        ? 'bg-teal-600 text-white'
                                                                        : 'bg-slate-100 text-slate-600'
                                                                }`}
                                                            >
                                                                {size.badge}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 leading-relaxed">
                                                            {size.description}
                                                        </p>
                                                    </div>

                                                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-400">
                                                        <span>
                                                            Target:{' '}
                                                            {size.id === 'custom'
                                                                ? `${data.custom_print_width || 80}mm`
                                                                : size.id}
                                                        </span>
                                                        {isSelected && (
                                                            <span className="text-teal-700 font-bold flex items-center gap-1">
                                                                <CheckCircle2 className="w-3.5 h-3.5" /> Active
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {errors.token_print_size && (
                                        <p className="text-xs text-rose-600 mt-1 font-medium">
                                            {errors.token_print_size}
                                        </p>
                                    )}
                                </div>

                                {/* Manual Size Inputs (Shown only if 'custom' is selected) */}
                                {data.token_print_size === 'custom' && (
                                    <div className="p-4 rounded-xl bg-teal-50/50 border-2 border-teal-200 space-y-4 animate-in fade-in duration-200">
                                        <div className="flex items-center gap-2">
                                            <Ruler className="w-4 h-4 text-teal-700" />
                                            <h4 className="text-sm font-bold text-teal-950">
                                                Manual Paper Dimensions (in millimeters)
                                            </h4>
                                        </div>
                                        <p className="text-xs text-slate-600">
                                            Enter your POS printer's exact roll width or slip dimensions. Thermal paper rolls feed continuously, so width is the main dimension.
                                        </p>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <TextInput
                                                    label="Paper Width (mm) *"
                                                    type="number"
                                                    min="30"
                                                    max="500"
                                                    placeholder="e.g. 76 or 100"
                                                    value={data.custom_print_width}
                                                    onChange={(e) => setData('custom_print_width', e.target.value)}
                                                    error={errors.custom_print_width}
                                                    helperText="Physical width of paper roll (30mm – 500mm)"
                                                />
                                            </div>
                                            <div>
                                                <TextInput
                                                    label="Paper Height (mm) (Optional)"
                                                    type="number"
                                                    min="30"
                                                    max="1000"
                                                    placeholder="Leave empty for continuous roll"
                                                    value={data.custom_print_height}
                                                    onChange={(e) => setData('custom_print_height', e.target.value)}
                                                    error={errors.custom_print_height}
                                                    helperText="Optional for pre-cut sheets or labels"
                                                />
                                            </div>
                                        </div>

                                        {/* Quick Preset Buttons */}
                                        <div>
                                            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                                                Quick Width Presets:
                                            </span>
                                            <div className="flex flex-wrap gap-2">
                                                {quickWidthPresets.map((preset) => (
                                                    <button
                                                        key={preset}
                                                        type="button"
                                                        onClick={() => setData('custom_print_width', preset)}
                                                        className={`px-2.5 py-1 text-xs rounded-lg font-mono font-medium border transition cursor-pointer ${
                                                            parseInt(data.custom_print_width) === preset
                                                                ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                                                                : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'
                                                        }`}
                                                    >
                                                        {preset}mm
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Separate Slip Page-Break Setting */}
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <Scissors className="w-4 h-4 text-teal-600" />
                                                <h4 className="text-sm font-bold text-slate-900">
                                                    Print Two Separate Slips (Doctor & Patient Copies)
                                                </h4>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1 max-w-md">
                                                When enabled, prints <strong>Slip 1 (Doctor Copy)</strong> and <strong>Slip 2 (Patient Copy)</strong> as two independent pages with an automatic page break (<code className="text-teal-700 font-mono">break-after: page</code>). Thermal printers will cut between the slips instead of squeezing both onto one sheet.
                                            </p>
                                        </div>
                                        <Toggle
                                            enabled={data.print_separate_slips}
                                            onChange={(val) => setData('print_separate_slips', val)}
                                        />
                                    </div>
                                </div>

                                {/* Header and Footer Text customizer */}
                                <div className="space-y-4 pt-2">
                                    <TextInput
                                        label="Token Sub-Heading Note"
                                        placeholder="e.g. Patient Serial Consultation Token"
                                        value={data.token_header_note}
                                        onChange={(e) => setData('token_header_note', e.target.value)}
                                        error={errors.token_header_note}
                                    />

                                    <TextInput
                                        label="Token Bottom Footer Instruction"
                                        placeholder="e.g. Please wait in the reception lounge until your serial is announced."
                                        value={data.token_footer_note}
                                        onChange={(e) => setData('token_footer_note', e.target.value)}
                                        error={errors.token_footer_note}
                                    />
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex justify-end">
                                    {can('edit-configuration-settings') ? (
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            size="md"
                                            loading={processing}
                                            className="font-bold shadow-md shadow-teal-600/30"
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-1.5" /> Save Print Configuration
                                        </Button>
                                    ) : (
                                        <span className="text-xs text-slate-400 font-medium">View-only mode</span>
                                    )}
                                </div>
                            </form>
                        </Card>
                    </div>

                    {/* Live Thermal Sizing Preview (Right 5 cols) */}
                    <div className="lg:col-span-5">
                        <Card
                            title={`Live ${
                                data.token_print_size === 'custom'
                                    ? `Custom (${data.custom_print_width || 80}mm)`
                                    : currentSizeConfig.title
                            } Simulation`}
                            subtitle="Simulates physical printer slip dimensions and cut separator"
                        >
                            <div className="bg-slate-100 p-4 rounded-xl flex flex-col items-center justify-center min-h-[460px] overflow-x-auto">
                                {/* Slip 1: Doctor Copy */}
                                <div
                                    style={{ width: simulatedWidthPx }}
                                    className="bg-white rounded-lg shadow-md border border-slate-300 p-4 font-sans text-slate-800 text-center transition-all duration-300"
                                >
                                    <div className="text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white py-0.5 px-2 rounded inline-block mb-1">
                                        Doctor Copy
                                    </div>
                                    <h4 className="text-xs font-black uppercase text-teal-800 tracking-tight">
                                        {setting?.company_name || 'Clinic Name'}
                                    </h4>
                                    <p className="text-[10px] text-slate-500 font-medium">Chamber Consultation Slip</p>

                                    <div className="my-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-center">
                                        <span className="text-[9px] uppercase font-bold text-slate-600">Queue Token</span>
                                        <p className="text-lg font-black font-mono text-slate-900">281026-001</p>
                                        <span className="text-[10px] font-bold text-slate-800">Serial #1</span>
                                    </div>

                                    <div className="text-[10px] space-y-1 text-left border-y border-slate-100 py-1.5">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Patient:</span>
                                            <span className="font-bold text-slate-800">Tanvir Ahmed</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Phone:</span>
                                            <span className="font-mono text-slate-700">01812345678</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Doctor:</span>
                                            <span className="font-semibold text-slate-800">Dr. Ariful Islam</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Room:</span>
                                            <span className="font-bold text-slate-800">Room 102</span>
                                        </div>
                                        <div className="flex justify-between pt-1 border-t border-dashed border-slate-200">
                                            <span className="text-slate-500">Fee Status:</span>
                                            <span className="font-bold text-emerald-700">1,000.00 Tk (Paid)</span>
                                        </div>
                                    </div>

                                    <div className="mt-2 text-left text-[9px] text-slate-400 border border-dashed border-slate-200 p-1.5 rounded">
                                        <span>BP: ______ | Pulse: ______ | Wt: ______</span>
                                    </div>
                                </div>

                                {/* Cut Line / Page Break Indicator */}
                                {data.print_separate_slips && (
                                    <div className="my-3 flex items-center justify-center gap-2 text-xs text-slate-400 font-mono">
                                        <Scissors className="w-3.5 h-3.5 text-teal-600 animate-bounce" />
                                        <span>-- Automatic Page Break / Paper Cut --</span>
                                    </div>
                                )}

                                {/* Slip 2: Patient Copy */}
                                <div
                                    style={{ width: simulatedWidthPx }}
                                    className="bg-white rounded-lg shadow-md border border-slate-300 p-4 font-sans text-slate-800 text-center transition-all duration-300"
                                >
                                    <div className="text-[10px] font-bold uppercase tracking-wider bg-teal-700 text-white py-0.5 px-2 rounded inline-block mb-1">
                                        Patient Copy
                                    </div>
                                    <h4 className="text-xs font-black uppercase text-teal-800 tracking-tight">
                                        {setting?.company_name || 'Clinic Name'}
                                    </h4>
                                    <p className="text-[10px] text-slate-500">{data.token_header_note}</p>

                                    <div className="my-2.5 py-1.5 bg-teal-50 border border-teal-200 rounded text-center">
                                        <span className="text-[9px] uppercase font-bold text-teal-700">Token</span>
                                        <p className="text-lg font-black font-mono text-teal-900">281026-001</p>
                                        <span className="text-[10px] font-bold text-slate-800">Serial #1</span>
                                    </div>

                                    <div className="text-[10px] space-y-1 text-left border-y border-slate-100 py-1.5">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Patient:</span>
                                            <span className="font-bold text-slate-800">Tanvir Ahmed</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Doctor:</span>
                                            <span className="font-semibold text-slate-800">Dr. Ariful Islam</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Room:</span>
                                            <span className="font-bold text-slate-800">Room 102</span>
                                        </div>
                                        <div className="flex justify-between pt-1 border-t border-dashed border-slate-200">
                                            <span className="text-slate-500">Fee Paid:</span>
                                            <span className="font-bold text-slate-800 font-mono">1,000.00 Tk</span>
                                        </div>
                                    </div>

                                    <p className="text-[9px] text-slate-400 mt-2">{data.token_footer_note}</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {/* TAB 2: WhatsApp Notification Message Configuration */}
            {activeTab === 'whatsapp' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-200">
                    {/* Left Form: Template Editor & Dynamic Tags (7 cols) */}
                    <div className="lg:col-span-7 space-y-6">
                        <Card
                            title="Pre-Set WhatsApp Follow-Up Message"
                            subtitle="Customize the message template sent to patients for upcoming return visits and reminders"
                        >
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Textarea Template Editor */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label
                                            htmlFor="whatsapp_followup_message"
                                            className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                                        >
                                            WhatsApp Message Template <span className="text-rose-500">*</span>
                                        </label>
                                        <span className="text-xs font-mono text-slate-400">
                                            {(data.whatsapp_followup_message || '').length} / 1000 characters
                                        </span>
                                    </div>

                                    <Textarea
                                        id="whatsapp_followup_message"
                                        ref={textareaRef}
                                        rows={5}
                                        value={data.whatsapp_followup_message}
                                        onChange={(e) => setData('whatsapp_followup_message', e.target.value)}
                                        placeholder="Type your WhatsApp notification template here..."
                                        error={errors.whatsapp_followup_message}
                                        className="font-sans text-sm leading-relaxed"
                                    />
                                    <p className="mt-1.5 text-xs text-slate-500">
                                        Include placeholders in curly brackets (e.g.{' '}
                                        <code className="text-emerald-700 font-mono font-semibold">{`{patient_name}`}</code>
                                        ). They will be automatically replaced with the actual patient, doctor, and date
                                        details.
                                    </p>
                                </div>

                                {/* Click-to-Insert Placeholder Chips */}
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                                            <Tag className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>Available Dynamic Tags (Click to Insert):</span>
                                        </div>
                                        <span className="text-[11px] text-slate-400">Inserts at cursor position</span>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {availableTags.map((t) => {
                                            const isJustCopied = copiedTag === t.tag;
                                            return (
                                                <button
                                                    key={t.tag}
                                                    type="button"
                                                    onClick={() => handleInsertTag(t.tag)}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition border cursor-pointer ${
                                                        isJustCopied
                                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                                            : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300'
                                                    }`}
                                                    title={`Example: ${t.example}`}
                                                >
                                                    {isJustCopied ? (
                                                        <Check className="w-3 h-3 text-white" />
                                                    ) : (
                                                        <Sparkles className="w-3 h-3 text-emerald-600" />
                                                    )}
                                                    <span>{t.tag}</span>
                                                    <span className="text-[10px] font-sans text-slate-500 font-normal">
                                                        ({t.label})
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Reset to Default Template */}
                                <div className="flex items-center justify-between pt-1">
                                    <button
                                        type="button"
                                        onClick={handleResetWhatsAppTemplate}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>Reset to Default Clinic Template</span>
                                    </button>
                                </div>

                                {/* Information & Dispatch Channels */}
                                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-2.5 text-xs text-emerald-950">
                                    <div className="flex items-center gap-2 font-bold text-emerald-900">
                                        <Info className="w-4 h-4 text-emerald-700" />
                                        <span>Where This Message is Used:</span>
                                    </div>
                                    <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1 leading-relaxed">
                                        <li>
                                            <strong>Automated Daily Background Cron</strong>:{' '}
                                            <code className="text-emerald-800 font-mono">followups:send-reminders</code> scans
                                            all follow-ups due for tomorrow and automatically renders and sends this message.
                                        </li>
                                        <li>
                                            <strong>1-Click WhatsApp Broadcast</strong>: In the{' '}
                                            <a
                                                href="/follow-ups"
                                                className="text-emerald-700 font-bold underline hover:text-emerald-900"
                                            >
                                                Follow-Up Appointments Page
                                            </a>
                                            , clicking the <strong>WhatsApp</strong> button on any row pre-populates this exact
                                            message with the patient's data ready to send.
                                        </li>
                                    </ul>
                                </div>

                                {/* Save Button */}
                                <div className="pt-3 border-t border-slate-100 flex justify-end">
                                    {can('edit-configuration-settings') ? (
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            size="md"
                                            loading={processing}
                                            className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30"
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-1.5" /> Save WhatsApp Configuration
                                        </Button>
                                    ) : (
                                        <span className="text-xs text-slate-400 font-medium">View-only mode</span>
                                    )}
                                </div>
                            </form>
                        </Card>
                    </div>

                    {/* Right Column: Live Mobile Smartphone Preview (5 cols) */}
                    <div className="lg:col-span-5">
                        <Card
                            title="Live WhatsApp Smartphone Preview"
                            subtitle="Real-time rendering of message with sample patient data"
                        >
                            <div className="bg-slate-100 p-4 sm:p-6 rounded-2xl flex flex-col items-center justify-center">
                                {/* Smartphone Shell */}
                                <div className="w-full max-w-[320px] rounded-[36px] bg-slate-900 p-3 shadow-2xl border-4 border-slate-800">
                                    {/* Top Speaker / Camera Notch */}
                                    <div className="w-full flex items-center justify-center pb-2">
                                        <div className="w-20 h-4 bg-slate-950 rounded-full flex items-center justify-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                                            <div className="w-8 h-1 rounded-full bg-slate-800"></div>
                                        </div>
                                    </div>

                                    {/* Phone Screen */}
                                    <div className="rounded-[24px] overflow-hidden bg-[#ECE5DD] border border-slate-700 flex flex-col min-h-[460px]">
                                        {/* WhatsApp App Header Bar */}
                                        <div className="bg-[#075E54] text-white px-3 py-2.5 flex items-center justify-between shadow-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-emerald-800 border border-emerald-400 flex items-center justify-center text-[10px] font-bold text-white">
                                                    {setting?.company_name ? setting.company_name.charAt(0) : 'C'}
                                                </div>
                                                <div className="leading-tight">
                                                    <h5 className="text-xs font-bold truncate max-w-[150px]">
                                                        {setting?.company_name || 'Aesthetic Clinic'}
                                                    </h5>
                                                    <span className="text-[10px] text-emerald-200">Official Clinic</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-emerald-100 text-xs">
                                                <Send className="w-3.5 h-3.5" />
                                            </div>
                                        </div>

                                        {/* Chat Canvas */}
                                        <div className="flex-1 p-3 flex flex-col justify-end space-y-3 bg-[radial-gradient(#d4cbbe_1px,transparent_1px)] [background-size:16px_16px]">
                                            {/* Chat Date Pill */}
                                            <div className="flex justify-center">
                                                <span className="bg-white/80 backdrop-blur-xs text-[10px] font-semibold text-slate-600 px-2.5 py-0.5 rounded-full shadow-2xs uppercase">
                                                    Today
                                                </span>
                                            </div>

                                            {/* WhatsApp Message Outgoing Bubble */}
                                            <div className="self-end max-w-[92%] bg-[#D9FDD3] text-slate-800 rounded-2xl rounded-tr-xs p-3 shadow-xs border border-emerald-200 text-xs leading-relaxed space-y-1.5">
                                                <p className="whitespace-pre-line text-slate-900 break-words font-sans">
                                                    {samplePreviewMessage || '(No message template provided)'}
                                                </p>
                                                <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 pt-0.5 font-mono">
                                                    <span>10:45 AM</span>
                                                    <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom WhatsApp Input Bar Mockup */}
                                        <div className="bg-[#F0F2F5] px-3 py-2 flex items-center gap-2 border-t border-slate-200">
                                            <div className="flex-1 bg-white rounded-full px-3 py-1 text-[11px] text-slate-400 flex items-center justify-between">
                                                <span>Type a message...</span>
                                            </div>
                                            <div className="w-7 h-7 rounded-full bg-[#00A884] flex items-center justify-center text-white">
                                                <Send className="w-3.5 h-3.5" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Preview Metadata Card */}
                                <div className="mt-4 w-full bg-white p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                                    <div className="font-bold text-slate-700 flex items-center gap-1">
                                        <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Sample Values Used in Preview:</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] font-mono text-slate-500">
                                        <div>
                                            <span className="text-slate-400">patient_name:</span> Tanvir Ahmed
                                        </div>
                                        <div>
                                            <span className="text-slate-400">doctor_name:</span> Dr. Farhana
                                        </div>
                                        <div>
                                            <span className="text-slate-400">clinic_name:</span>{' '}
                                            {setting?.company_name || 'Clinic'}
                                        </div>
                                        <div>
                                            <span className="text-slate-400">follow_up_date:</span> 05 Nov 2026
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
