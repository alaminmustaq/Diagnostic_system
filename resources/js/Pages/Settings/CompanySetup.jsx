import React, { useState, useEffect, useRef } from 'react';
import { useForm } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/UI/PageHeader';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import TextInput from '../../Components/Form/TextInput';
import Textarea from '../../Components/Form/Textarea';
import { Building2, Phone, Mail, MapPin, Upload, Image, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CompanySetup({ setting }) {
    const [logoPreview, setLogoPreview] = useState(setting?.logo_url || null);
    const fileInputRef = useRef(null);

    const { data, setData, post, processing, errors } = useForm({
        company_name: setting?.company_name || 'Aesthetic & Dermatology Clinic',
        company_phone: setting?.company_phone || '+880 1700-000000',
        company_email: setting?.company_email || 'info@clinicdiagnostic.com',
        company_address: setting?.company_address || 'House #12, Road #5, Dhanmondi, Dhaka',
        company_logo: null,
        company_logo_base64: null,
        remove_logo: false,
    });

    useEffect(() => {
        if (setting) {
            setLogoPreview(setting.logo_url || null);
            setData((prev) => ({
                ...prev,
                company_name: setting.company_name ?? prev.company_name,
                company_phone: setting.company_phone ?? prev.company_phone,
                company_email: setting.company_email ?? prev.company_email,
                company_address: setting.company_address ?? prev.company_address,
                company_logo: null,
                company_logo_base64: null,
                remove_logo: false,
            }));
        }
    }, [setting?.updated_at, setting?.logo_url]);

    const handleLogoChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoPreview(URL.createObjectURL(file));

            const reader = new FileReader();
            reader.onload = (uploadEvent) => {
                setData((prev) => ({
                    ...prev,
                    company_logo_base64: uploadEvent.target.result,
                    company_logo: file,
                    remove_logo: false,
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setData((prev) => ({
            ...prev,
            company_logo: null,
            company_logo_base64: null,
            remove_logo: true,
        }));
        setLogoPreview(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/settings/company', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            },
        });
    };

    return (
        <AppLayout title="Company Setup">
            <PageHeader
                title="Company Setup & Clinic Branding"
                subtitle="Configure clinic legal name, official contact number, address, and clinic logo displayed across printable tokens, receipts, and headers"
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Form Area */}
                <div className="lg:col-span-7">
                    <Card title="Clinic & Company Profile" subtitle="All fields immediately reflect on printed serial tokens and invoices">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <TextInput
                                label="Company / Clinic Name"
                                placeholder="e.g. Aesthetic & Dermatology Clinic"
                                icon={Building2}
                                value={data.company_name}
                                onChange={(e) => setData('company_name', e.target.value)}
                                error={errors.company_name}
                                required
                            />

                            <TextInput
                                label="Contact Phone Number"
                                placeholder="e.g. +880 1700-000000 / 02-9876543"
                                icon={Phone}
                                value={data.company_phone}
                                onChange={(e) => setData('company_phone', e.target.value)}
                                error={errors.company_phone}
                                helperText="Official phone displayed on patient tokens and POS invoices"
                            />

                            <TextInput
                                label="Official Email Address"
                                type="email"
                                placeholder="e.g. info@clinicdiagnostic.com"
                                icon={Mail}
                                value={data.company_email}
                                onChange={(e) => setData('company_email', e.target.value)}
                                error={errors.company_email}
                                helperText="Official email displayed on patient tokens and POS invoices"
                            />

                            <Textarea
                                label="Clinic Physical Address"
                                placeholder="e.g. House #12, Road #5, Dhanmondi, Dhaka - 1205"
                                value={data.company_address}
                                onChange={(e) => setData('company_address', e.target.value)}
                                error={errors.company_address}
                                rows={3}
                            />

                            {/* Logo Upload Section */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                                    Clinic Official Logo
                                </label>
                                <div className="flex items-start gap-5 p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                                    {logoPreview ? (
                                        <div className="relative w-24 h-24 rounded-xl border border-slate-300 bg-white p-2 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                                            <img
                                                src={logoPreview}
                                                alt="Logo preview"
                                                className="max-h-full max-w-full object-contain"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 shrink-0">
                                            <Image className="w-8 h-8 mb-1" />
                                            <span className="text-[10px] uppercase font-bold">No Logo</span>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <label className="cursor-pointer inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 shadow-2xs transition">
                                                <Upload className="w-3.5 h-3.5 mr-1.5 text-teal-600" />
                                                Choose New Logo
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept=".png,.jpg,.jpeg,.svg,.webp,image/*"
                                                    onChange={handleLogoChange}
                                                    className="hidden"
                                                />
                                            </label>

                                            {logoPreview && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={handleRemoveLogo}
                                                    type="button"
                                                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            Supported: PNG, SVG, JPG, WebP (Max 10MB). Fits cleanly onto 80mm/58mm thermal slips and receipts.
                                        </p>
                                        {errors.company_logo && (
                                            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-1.5">
                                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                                <span>{errors.company_logo}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex justify-end">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="md"
                                    loading={processing}
                                    className="font-bold shadow-md shadow-teal-600/30"
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Save Company Details
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>

                {/* Live Preview Card */}
                <div className="lg:col-span-5">
                    <Card title="Brand Header Live Preview" subtitle="How your clinic header renders on receipts and tokens">
                        <div className="p-5 rounded-xl border border-slate-300 bg-white text-center shadow-xs space-y-2">
                            {logoPreview && (
                                <div className="h-14 flex items-center justify-center mb-1">
                                    <img src={logoPreview} alt="Logo" className="max-h-full max-w-[160px] object-contain" />
                                </div>
                            )}
                            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                                {data.company_name || 'Clinic Name'}
                            </h3>
                            {data.company_address && (
                                <p className="text-xs text-slate-600 flex items-center justify-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                    <span>{data.company_address}</span>
                                </p>
                            )}
                            {data.company_phone && (
                                <p className="text-xs font-mono font-medium text-slate-700 flex items-center justify-center gap-1">
                                    <Phone className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                    <span>Phone: {data.company_phone}</span>
                                </p>
                            )}
                            {data.company_email && (
                                <p className="text-xs font-mono font-medium text-slate-700 flex items-center justify-center gap-1">
                                    <Mail className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                    <span>Email: {data.company_email}</span>
                                </p>
                            )}
                            <div className="pt-2 border-t border-dashed border-slate-200 text-[11px] text-slate-400">
                                ✦ Patient Consultation Slip Header Preview ✦
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

