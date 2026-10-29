import React from 'react';
import { useForm } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/UI/PageHeader';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Toggle from '../../Components/Form/Toggle';
import TextInput from '../../Components/Form/TextInput';
import {
    Printer,
    Sliders,
    CheckCircle2,
    Copy,
    Maximize2,
    Scissors,
    Layers,
} from 'lucide-react';

export default function Configuration({ setting }) {
    const { data, setData, post, processing, errors } = useForm({
        token_print_size: setting?.token_print_size || '80mm',
        print_separate_slips: setting?.print_separate_slips ?? true,
        token_header_note: setting?.token_header_note || 'Patient Serial Consultation Token',
        token_footer_note: setting?.token_footer_note || 'Please wait in the reception lounge until your serial is announced.',
    });

    const printSizes = [
        {
            id: '80mm',
            title: '80mm Thermal Roll',
            description: 'Standard POS thermal printers (Epson, Xprinter, Rongta). Most popular for reception queue slips.',
            widthPx: '300px',
            badge: 'Recommended',
        },
        {
            id: '58mm',
            title: '58mm Mini Thermal',
            description: 'Compact 2-inch mini receipt printers and wireless bluetooth desktop terminals.',
            widthPx: '230px',
            badge: 'Compact',
        },
        {
            id: 'a5',
            title: 'A5 Half Sheet (148mm)',
            description: 'Laser or inkjet printers using half-size standard office paper.',
            widthPx: '420px',
            badge: 'Standard Paper',
        },
        {
            id: 'a4',
            title: 'A4 Full Page (210mm)',
            description: 'Full-size office documents with generous margins.',
            widthPx: '540px',
            badge: 'Full Sheet',
        },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/settings/configuration');
    };

    const currentSizeConfig = printSizes.find((s) => s.id === data.token_print_size) || printSizes[0];

    return (
        <AppLayout title="Print Configuration & POS Sizing">
            <PageHeader
                title="Print Configuration & POS Sizing"
                subtitle="Configure printer paper dimensions for tokens and invoices, dual-slip separation, and customized header/footer instructions"
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
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
                                                    <span>Target: {size.id}</span>
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
                                    <p className="text-xs text-rose-600 mt-1 font-medium">{errors.token_print_size}</p>
                                )}
                            </div>

                            {/* Separate Slip Page-Break Setting */}
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <Scissors className="w-4 h-4 text-teal-600" />
                                            <h4 className="text-sm font-bold text-slate-900">
                                                Print Two Separate Slips (Desk & Patient Copies)
                                            </h4>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1 max-w-md">
                                            When enabled, prints <strong>Slip 1 (Desk Copy)</strong> and <strong>Slip 2 (Patient Copy)</strong> as two independent pages with an automatic page break (<code className="text-teal-700 font-mono">break-after: page</code>). Thermal printers will cut between the slips instead of squeezing both onto one sheet.
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
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="md"
                                    loading={processing}
                                    className="font-bold shadow-md shadow-teal-600/30"
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Save Print Configuration
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>

                {/* Live Thermal Sizing Preview (Right 5 cols) */}
                <div className="lg:col-span-5">
                    <Card
                        title={`Live ${currentSizeConfig.title} Simulation`}
                        subtitle="Simulates physical printer slip dimensions and cut separator"
                    >
                        <div className="bg-slate-100 p-4 rounded-xl flex flex-col items-center justify-center min-h-[460px] overflow-x-auto">
                            {/* Slip 1: Desk Copy */}
                            <div
                                style={{ width: currentSizeConfig.widthPx }}
                                className="bg-white rounded-lg shadow-md border border-slate-300 p-4 font-sans text-slate-800 text-center transition-all duration-300"
                            >
                                <div className="text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white py-0.5 px-2 rounded inline-block mb-1">
                                    Desk Copy
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
                                </div>

                                <p className="text-[9px] text-slate-400 mt-2">{data.token_footer_note}</p>
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
                                style={{ width: currentSizeConfig.widthPx }}
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
                                </div>

                                <p className="text-[9px] text-slate-400 mt-2">{data.token_footer_note}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

