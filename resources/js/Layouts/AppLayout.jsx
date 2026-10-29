import React, { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    LayoutDashboard,
    Ticket,
    Users,
    Stethoscope,
    CreditCard,
    MessageCircle,
    BarChart3,
    UserCog,
    Layers,
    LogOut,
    Menu,
    X,
    Building2,
    Calendar,
    ChevronDown,
    Activity,
    Settings as SettingsIcon,
    Sliders,
} from 'lucide-react';
import Alert from '../Components/UI/Alert';

export default function AppLayout({ children, title }) {
    const { auth, flash, company_setting } = usePage().props;
    const user = auth?.user;
    const companyName = company_setting?.company_name || 'DIAGNOSTIC PRO';
    const companyLogo = company_setting?.logo_url || null;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState(flash?.success || flash?.error);
    const [alertType, setAlertType] = useState(flash?.success ? 'success' : flash?.error ? 'error' : null);

    React.useEffect(() => {
        if (flash?.success) {
            setAlertMessage(flash.success);
            setAlertType('success');
        } else if (flash?.error) {
            setAlertMessage(flash.error);
            setAlertType('error');
        }
    }, [flash]);

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Serial Booking', href: '/booking', icon: Ticket, badge: 'Desk' },
        { name: 'Queue Board', href: '/consultation/queue', icon: Users },
        { name: 'Doctor Consultation', href: '/consultation/room', icon: Stethoscope },
        { name: 'Treatment POS', href: '/pos', icon: CreditCard },
        { name: 'Follow-Ups (WhatsApp)', href: '/follow-ups', icon: MessageCircle },
        { name: 'Reports & Analytics', href: '/reports', icon: BarChart3 },
    ];

    const adminNav = [
        { name: 'Doctor Setup', href: '/admin/doctors', icon: UserCog },
        { name: 'Treatments Catalog', href: '/admin/treatments', icon: Layers },
    ];

    const settingsNav = [
        { name: 'Company Setup', href: '/settings/company', icon: Building2 },
        { name: 'Configuration', href: '/settings/configuration', icon: Sliders },
    ];

    const isCurrentUrl = (path) => {
        const currentPath = window.location.pathname;
        if (path === '/dashboard') return currentPath === '/dashboard' || currentPath === '/';
        return currentPath.startsWith(path);
    };

    const isSettingsActive = typeof window !== 'undefined' && window.location.pathname.startsWith('/settings');
    const [settingsOpen, setSettingsOpen] = useState(true);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row antialiased">
            {/* Mobile Header */}
            <div className="lg:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md z-30">
                <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
                    {companyLogo ? (
                        <div className="w-8 h-8 rounded-lg bg-white/10 p-1 border border-white/15 flex items-center justify-center shrink-0 overflow-hidden">
                            <img src={companyLogo} alt={companyName} className="max-h-full max-w-full object-contain" />
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center font-bold text-white shrink-0">
                            <Activity className="w-5 h-5" />
                        </div>
                    )}
                    <div className="min-w-0">
                        <span className="font-extrabold text-sm tracking-tight block truncate max-w-[200px]" title={companyName}>
                            {companyName}
                        </span>
                        <p className="text-[10px] text-teal-400 -mt-0.5 font-medium truncate">Clinic & Queue System</p>
                    </div>
                </Link>
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 shrink-0"
                >
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Sidebar Desktop & Mobile */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 ${
                    mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex-1 overflow-y-auto">
                    {/* Brand */}
                    <Link
                        href="/dashboard"
                        className="h-16 px-4 flex items-center gap-3 border-b border-slate-800/80 bg-slate-950/40 hover:bg-slate-950/70 transition group"
                    >
                        {companyLogo ? (
                            <div className="w-10 h-10 rounded-xl bg-white/10 p-1.5 border border-white/15 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                                <img src={companyLogo} alt={companyName} className="max-h-full max-w-full object-contain" />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center font-bold text-white shadow-md shadow-teal-500/20 shrink-0">
                                <Activity className="w-5 h-5 text-white" />
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <span className="font-extrabold text-sm tracking-tight text-white block truncate group-hover:text-teal-300 transition" title={companyName}>
                                {companyName}
                            </span>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-400 block truncate">
                                Clinic & Queue System
                            </span>
                        </div>
                    </Link>

                    {/* Navigation Links */}
                    <div className="px-3 py-4 space-y-1">
                        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Clinic Modules
                        </p>
                        {navigation.map((item) => {
                            const active = isCurrentUrl(item.href);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                                        active
                                            ? 'bg-teal-600 text-white font-semibold shadow-md shadow-teal-600/30'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon className={`w-4 h-4 transition ${active ? 'text-white' : 'text-slate-400 group-hover:text-teal-400'}`} />
                                        <span>{item.name}</span>
                                    </div>
                                    {item.badge && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${active ? 'bg-teal-700 text-teal-100' : 'bg-slate-800 text-slate-400'}`}>
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}

                        {/* Admin System Setup */}
                        <div className="pt-5 pb-1">
                            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                                System Setup
                            </p>
                            {adminNav.map((item) => {
                                const active = isCurrentUrl(item.href);
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                                            active
                                                ? 'bg-teal-600 text-white font-semibold shadow-md shadow-teal-600/30'
                                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                        }`}
                                    >
                                        <Icon className={`w-4 h-4 transition ${active ? 'text-white' : 'text-slate-400 group-hover:text-teal-400'}`} />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Settings with Child Items */}
                        <div className="pt-4 pb-1">
                            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                                Settings
                            </p>
                            <button
                                type="button"
                                onClick={() => setSettingsOpen(!settingsOpen)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group cursor-pointer ${
                                    isSettingsActive
                                        ? 'bg-slate-800 text-white font-semibold'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <SettingsIcon className={`w-4 h-4 transition ${isSettingsActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-teal-400'}`} />
                                    <span>Settings</span>
                                </div>
                                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${settingsOpen ? 'rotate-180 text-teal-400' : 'text-slate-500'}`} />
                            </button>

                            {settingsOpen && (
                                <div className="mt-1 ml-3.5 pl-3 border-l border-slate-800 space-y-1">
                                    {settingsNav.map((item) => {
                                        const active = isCurrentUrl(item.href);
                                        const Icon = item.icon;
                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                                                    active
                                                        ? 'bg-teal-600 text-white font-semibold shadow-xs'
                                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                                }`}
                                            >
                                                <Icon className={`w-3.5 h-3.5 transition ${active ? 'text-white' : 'text-slate-400 group-hover:text-teal-400'}`} />
                                                <span>{item.name}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom User Profile */}
                <div className="p-3 border-t border-slate-800/80 bg-slate-950/30">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs uppercase shrink-0 border border-teal-500/30">
                                {user?.name ? user.name.substring(0, 2) : 'US'}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-white truncate">{user?.name || 'Guest User'}</p>
                                <p className="text-[10px] text-teal-400 uppercase font-bold tracking-wider">{user?.role || 'User'}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.post('/logout')}
                            title="Log Out"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Menu Backdrop */}
            {mobileMenuOpen && (
                <div
                    onClick={() => setMobileMenuOpen(false)}
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 lg:hidden"
                />
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                {/* Desktop Top Navbar */}
                <header className="h-16 bg-white border-b border-slate-200/80 px-6 hidden lg:flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100/80 py-1.5 px-3 rounded-lg border border-slate-200/60">
                            <Calendar className="w-3.5 h-3.5 text-teal-600" />
                            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 py-1.5 px-3 rounded-lg border border-slate-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="font-semibold text-slate-800">{user?.name}</span>
                            <span className="text-[11px] px-1.5 py-0.5 rounded uppercase font-bold bg-slate-200 text-slate-700">
                                {user?.role}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Main Body */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
                    {alertMessage && (
                        <div className="mb-6">
                            <Alert
                                type={alertType || 'info'}
                                message={alertMessage}
                                onClose={() => setAlertMessage(null)}
                            />
                        </div>
                    )}
                    {children}
                </main>

                {/* Footer */}
                <footer className="no-print border-t border-slate-200/80 bg-white py-3.5 px-6 mt-auto">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
                        <p>
                            Copyright &copy; {new Date().getFullYear()} <span className="font-semibold text-slate-700">Datadss Ltd</span>. All rights reserved.
                        </p>
                        <p className="text-[11px] text-slate-400">
                            Clinic Diagnostic &amp; Queue Management System
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
}

