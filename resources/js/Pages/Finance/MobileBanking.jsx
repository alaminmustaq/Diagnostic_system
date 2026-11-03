import React, { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/UI/PageHeader';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import { Table, Thead, Tbody, Th, Td, Tr, EmptyState } from '../../Components/Table';
import Modal from '../../Components/Modal/Modal';
import ConfirmModal from '../../Components/Modal/ConfirmModal';
import TextInput from '../../Components/Form/TextInput';
import SelectInput from '../../Components/Form/SelectInput';
import Toggle from '../../Components/Form/Toggle';
import { Smartphone, Plus, Edit2, Trash2, Search, Check, X, PhoneCall } from 'lucide-react';

const COMMON_ACCOUNT_TYPES = ['Personal', 'Agent', 'Merchant'];

export default function MobileBanking({ accounts = [] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [deletingAccountId, setDeletingAccountId] = useState(null);
    const [customTypeMode, setCustomTypeMode] = useState(false);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        bank_name: '',
        account_name: '',
        account_number: '',
        account_type: 'Personal',
        is_active: true,
    });

    const openCreateModal = () => {
        reset();
        clearErrors();
        setEditingAccount(null);
        setCustomTypeMode(false);
        setData({
            bank_name: '',
            account_name: '',
            account_number: '',
            account_type: 'Personal',
            is_active: true,
        });
        setIsModalOpen(true);
    };

    const openEditModal = (account) => {
        clearErrors();
        setEditingAccount(account);
        const isStandard = COMMON_ACCOUNT_TYPES.includes(account.account_type);
        setCustomTypeMode(!isStandard && Boolean(account.account_type));
        setData({
            bank_name: account.bank_name || '',
            account_name: account.account_name || '',
            account_number: account.account_number || '',
            account_type: account.account_type || 'Personal',
            is_active: Boolean(account.is_active),
        });
        setIsModalOpen(true);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (editingAccount) {
            put(`/finance/mobile-banking/${editingAccount.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        } else {
            post('/finance/mobile-banking', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleDelete = () => {
        if (!deletingAccountId) return;
        router.delete(`/finance/mobile-banking/${deletingAccountId}`, {
            onSuccess: () => setDeletingAccountId(null),
        });
    };

    const filteredAccounts = accounts.filter((acc) => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
            (acc.bank_name && acc.bank_name.toLowerCase().includes(q)) ||
            (acc.account_name && acc.account_name.toLowerCase().includes(q)) ||
            (acc.account_number && acc.account_number.toLowerCase().includes(q)) ||
            (acc.account_type && acc.account_type.toLowerCase().includes(q))
        );
    });

    return (
        <AppLayout title="Mobile Banking Setup">
            <PageHeader
                title="Mobile Banking Setup"
                subtitle="Configure mobile financial services (bKash, Nagad, Rocket, Upay) accounts"
                actions={
                    <Button variant="primary" onClick={openCreateModal}>
                        <Plus className="w-4 h-4 mr-1.5" /> Add Mobile Banking
                    </Button>
                }
            />

            {/* Top Toolbar */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="relative max-w-sm w-full">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by account name, mobile number or type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 shadow-2xs"
                    />
                </div>
                <div className="text-xs text-slate-500">
                    Showing <span className="font-semibold text-slate-800">{filteredAccounts.length}</span> of {accounts.length} accounts
                </div>
            </div>

            <Card>
                {filteredAccounts.length === 0 ? (
                    <EmptyState
                        icon={Smartphone}
                        title={searchTerm ? 'No matching mobile banking accounts found' : 'No mobile banking accounts added yet'}
                        description={
                            searchTerm
                                ? 'Try refining your search keyword or clearing the filter.'
                                : 'Configure your mobile banking accounts (e.g. bKash, Nagad) to accept mobile payments.'
                        }
                        action={
                            !searchTerm && (
                                <Button variant="primary" size="sm" onClick={openCreateModal}>
                                    <Plus className="w-4 h-4 mr-1.5" /> Add Mobile Banking
                                </Button>
                            )
                        }
                    />
                ) : (
                    <Table>
                        <Thead>
                            <Tr>
                                <Th className="w-12 text-center">#</Th>
                                <Th>Bank Name</Th>
                                <Th>Account Name</Th>
                                <Th>Mobile Number</Th>
                                <Th>Account Type</Th>
                                <Th className="text-center">Status</Th>
                                <Th className="text-right">Actions</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {filteredAccounts.map((account, index) => (
                                <Tr key={account.id} hover>
                                    <Td className="text-center text-xs text-slate-400 font-medium">
                                        {index + 1}
                                    </Td>
                                    <Td>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-900 block">
                                                {account.bank_name || '—'}
                                            </span>
                                        </div>
                                    </Td>
                                    <Td>
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center shrink-0">
                                                <Smartphone className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="font-medium text-slate-800 block">
                                                    {account.account_name}
                                                </span>
                                            </div>
                                        </div>
                                    </Td>
                                    <Td>
                                        <div className="flex items-center gap-1.5">
                                            <PhoneCall className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                            <code className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-800 border border-slate-200">
                                                {account.account_number}
                                            </code>
                                        </div>
                                    </Td>
                                    <Td>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                                            {account.account_type || 'General'}
                                        </span>
                                    </Td>
                                    <Td className="text-center">
                                        {account.is_active ? (
                                            <Badge variant="success" size="sm">
                                                <Check className="w-3 h-3 mr-1" /> Active
                                            </Badge>
                                        ) : (
                                            <Badge variant="neutral" size="sm">
                                                <X className="w-3 h-3 mr-1" /> Inactive
                                            </Badge>
                                        )}
                                    </Td>
                                    <Td className="text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <Button
                                                variant="ghost"
                                                size="xs"
                                                onClick={() => openEditModal(account)}
                                                className="text-slate-600 hover:text-teal-600"
                                                title="Edit Account"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="xs"
                                                onClick={() => setDeletingAccountId(account.id)}
                                                className="text-slate-600 hover:text-rose-600"
                                                title="Delete Account"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                )}
            </Card>

            {/* Add / Edit Mobile Banking Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingAccount ? 'Edit Mobile Banking Account' : 'Add Mobile Banking Account'}
                subtitle={
                    editingAccount
                        ? 'Update account name, mobile number, type and status'
                        : 'Register a new mobile banking service account for clinic receipts'
                }
            >
                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <TextInput
                        label="Bank Name"
                        placeholder="e.g. bKash, Nagad, Rocket, Upay"
                        value={data.bank_name}
                        onChange={(e) => setData('bank_name', e.target.value)}
                        error={errors.bank_name}
                        autoFocus
                    />

                    <TextInput
                        label="Account Name"
                        placeholder="e.g. bKash Merchant, Nagad Personal, Rocket Agent"
                        value={data.account_name}
                        onChange={(e) => setData('account_name', e.target.value)}
                        error={errors.account_name}
                        required
                    />

                    <TextInput
                        label="Mobile Number"
                        placeholder="e.g. 01712345678"
                        value={data.account_number}
                        onChange={(e) => setData('account_number', e.target.value)}
                        error={errors.account_number}
                        icon={PhoneCall}
                        required
                    />

                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                                Account Type <span className="text-rose-500">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => {
                                    setCustomTypeMode(!customTypeMode);
                                    if (customTypeMode) {
                                        setData('account_type', 'Personal');
                                    }
                                }}
                                className="text-[11px] text-teal-600 hover:text-teal-700 font-medium"
                            >
                                {customTypeMode ? 'Choose from list' : 'Custom Type?'}
                            </button>
                        </div>

                        {customTypeMode ? (
                            <TextInput
                                placeholder="Enter custom type e.g. Corporate, Sub-agent"
                                value={data.account_type}
                                onChange={(e) => setData('account_type', e.target.value)}
                                error={errors.account_type}
                                required
                            />
                        ) : (
                            <SelectInput
                                value={data.account_type}
                                onChange={(e) => setData('account_type', e.target.value)}
                                error={errors.account_type}
                                required
                            >
                                <option value="Personal">Personal</option>
                                <option value="Agent">Agent</option>
                                <option value="Merchant">Merchant</option>
                            </SelectInput>
                        )}
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                        <Toggle
                            label="Active Status"
                            description="Enable this mobile banking account for transactions"
                            enabled={data.is_active}
                            onChange={(val) => setData('is_active', val)}
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setIsModalOpen(false)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            loading={processing}
                        >
                            {editingAccount ? 'Save Changes' : 'Create Mobile Banking'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={Boolean(deletingAccountId)}
                onClose={() => setDeletingAccountId(null)}
                onConfirm={handleDelete}
                title="Delete Mobile Banking Account"
                message="Are you sure you want to delete this mobile banking account? This will remove it from the active account list."
                confirmLabel="Delete Account"
            />
        </AppLayout>
    );
}

