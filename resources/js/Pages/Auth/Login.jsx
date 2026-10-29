import React, { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { Activity, Phone, Lock, UserCheck, Stethoscope, ShieldCheck } from 'lucide-react';
import TextInput from '../../Components/Form/TextInput';
import Button from '../../Components/UI/Button';
import Alert from '../../Components/UI/Alert';

export default function Login({ demoDoctors = [], demoAdmin }) {
    const { data, setData, post, processing, errors } = useForm({
        phone: '',
        password: '',
        remember: true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/login');
    };

    const handleQuickLogin = (userId) => {
        router.post('/quick-login', { user_id: userId });
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 antialiased selection:bg-teal-500 selection:text-white">
            <div className="w-full max-w-md">
                {/* Brand Logo & Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 items-center justify-center text-white shadow-xl shadow-teal-500/25 mb-3">
                        <Activity className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">
                        Clinic Diagnostic & Queue
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Sign in to access reception desk, doctor consultation, and POS
                    </p>
                </div>

                {/* Login Form Card */}
                <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-700/80 p-6 sm:p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <TextInput
                            label="Phone Number"
                            icon={Phone}
                            placeholder="e.g. 01700000000"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            error={errors.phone}
                            required
                            inputClassName="bg-slate-900/60 border-slate-700 text-white placeholder-slate-500"
                        />

                        <TextInput
                            label="Password"
                            type="password"
                            icon={Lock}
                            placeholder="••••••••"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            error={errors.password}
                            required
                            inputClassName="bg-slate-900/60 border-slate-700 text-white placeholder-slate-500"
                        />

                        <div className="pt-2">
                            <Button
                                type="submit"
                                variant="primary"
                                loading={processing}
                                className="w-full py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold"
                            >
                                Sign In
                            </Button>
                        </div>
                    </form>

                    {/* Quick Demo Access Buttons */}
                    <div className="mt-8 pt-6 border-t border-slate-700/80">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-center mb-3">
                            One-Click Quick Login
                        </p>
                        <div className="space-y-2">
                            {demoAdmin && (
                                <button
                                    type="button"
                                    onClick={() => handleQuickLogin(demoAdmin.id)}
                                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 border border-slate-600/60 text-left transition group cursor-pointer"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="text-xs font-semibold text-white block">
                                                {demoAdmin.name}
                                            </span>
                                            <span className="text-[10px] text-teal-400 font-medium">
                                                Admin / Receptionist (Phone: {demoAdmin.phone})
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-400 group-hover:text-white font-medium">
                                        Login →
                                    </span>
                                </button>
                            )}

                            {demoDoctors.map((doc) => (
                                <button
                                    key={doc.id}
                                    type="button"
                                    onClick={() => handleQuickLogin(doc.id)}
                                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 border border-slate-600/60 text-left transition group cursor-pointer"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                                            <Stethoscope className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="text-xs font-semibold text-white block">
                                                {doc.name}
                                            </span>
                                            <span className="text-[10px] text-indigo-300 font-medium">
                                                {doc.doctor_profile?.designation || 'Doctor'} (Room: {doc.doctor_profile?.room_number})
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-400 group-hover:text-white font-medium">
                                        Login →
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

