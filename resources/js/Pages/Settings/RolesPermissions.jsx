import React, { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/UI/PageHeader';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Badge from '../../Components/UI/Badge';
import TextInput from '../../Components/Form/TextInput';
import SelectInput from '../../Components/Form/SelectInput';
import { usePermissions } from '../../Utils/permissions';
import { Table, Thead, Tbody, Th, Td, Tr, EmptyState } from '../../Components/Table';
import {
    ShieldCheck,
    Shield,
    Users,
    Key,
    Check,
    Plus,
    Trash2,
    Save,
    AlertCircle,
    CheckCircle2,
    Lock,
    Unlock,
    UserCheck,
    Layers,
    LayoutDashboard,
    Ticket,
    Stethoscope,
    CreditCard,
    MessageCircle,
    BarChart3,
    UserCog,
    DoorOpen,
    Landmark,
    Smartphone,
    Building2,
    Sliders,
} from 'lucide-react';

// Icon map for modules
const iconMap = {
    LayoutDashboard,
    Ticket,
    Users,
    Stethoscope,
    CreditCard,
    MessageCircle,
    BarChart3,
    UserCog,
    DoorOpen,
    Layers,
    Landmark,
    Smartphone,
    Building2,
    Sliders,
    ShieldCheck,
};

export default function RolesPermissions({
    roles = [],
    modules = [],
    operationalPermissions = [],
    allPermissions = [],
    users = [],
}) {
    const { can } = usePermissions();
    const [activeTab, setActiveTab] = useState('roles'); // 'roles' or 'users'
    const [selectedRole, setSelectedRole] = useState(roles[0] || null);
    const [showNewRoleModal, setShowNewRoleModal] = useState(false);

    // Edit Role Form
    const editForm = useForm({
        name: selectedRole?.name || '',
        permissions: selectedRole?.permissions || [],
    });

    // Create Role Form
    const createForm = useForm({
        name: '',
        permissions: [],
    });

    // User Assignment Form state
    const [selectedUserRole, setSelectedUserRole] = useState({});

    // When switching active role in editor
    const handleSelectRole = (role) => {
        setSelectedRole(role);
        editForm.setData({
            name: role.name,
            permissions: role.permissions || [],
        });
        editForm.clearErrors();
    };

    const handlePermissionToggle = (permName) => {
        if (selectedRole?.name === 'Super Admin') return; // Super admin has locked full access

        const currentPerms = [...editForm.data.permissions];
        const idx = currentPerms.indexOf(permName);
        if (idx > -1) {
            currentPerms.splice(idx, 1);
        } else {
            currentPerms.push(permName);
        }
        editForm.setData('permissions', currentPerms);
    };

    const handleToggleModuleAll = (modulePerms) => {
        if (selectedRole?.name === 'Super Admin') return;

        const permValues = Object.values(modulePerms);
        const currentPerms = [...editForm.data.permissions];
        const allSelected = permValues.every((p) => currentPerms.includes(p));

        let updated;
        if (allSelected) {
            // Uncheck all
            updated = currentPerms.filter((p) => !permValues.includes(p));
        } else {
            // Check all
            const toAdd = permValues.filter((p) => !currentPerms.includes(p));
            updated = [...currentPerms, ...toAdd];
        }
        editForm.setData('permissions', updated);
    };

    const handleSelectAll = () => {
        if (selectedRole?.name === 'Super Admin') return;
        editForm.setData('permissions', [...allPermissions]);
    };

    const handleDeselectAll = () => {
        if (selectedRole?.name === 'Super Admin') return;
        editForm.setData('permissions', []);
    };

    const handleSaveRole = (e) => {
        e.preventDefault();
        if (!selectedRole) return;

        editForm.put(`/settings/roles/${selectedRole.id}`, {
            onSuccess: () => {
                // Success handled by flash
            },
        });
    };

    const handleCreateRole = (e) => {
        e.preventDefault();
        createForm.post('/settings/roles', {
            onSuccess: () => {
                setShowNewRoleModal(false);
                createForm.reset();
            },
        });
    };

    const handleDeleteRole = (role) => {
        if (role.is_system) {
            alert(`The core system role '${role.name}' cannot be deleted.`);
            return;
        }

        if (confirm(`Are you sure you want to delete role '${role.name}'? Users assigned to this role will lose its permissions.`)) {
            router.delete(`/settings/roles/${role.id}`);
        }
    };

    const handleAssignUserRole = (userId) => {
        const roleName = selectedUserRole[userId];
        if (!roleName) return;

        router.post(`/settings/users/${userId}/assign-role`, {
            role_name: roleName,
        });
    };

    return (
        <AppLayout title="Roles & Permissions Management">
            <PageHeader
                title="Roles & Permissions Management"
                subtitle="Granular security framework powered by Spatie. Configure access rights, assign view/create/update/delete permissions per module, and delegate staff responsibilities."
                actions={
                    <div className="flex items-center gap-2">
                        <Button
                            variant={activeTab === 'roles' ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setActiveTab('roles')}
                        >
                            <Shield className="w-4 h-4 mr-1.5" /> Roles Matrix
                        </Button>
                        <Button
                            variant={activeTab === 'users' ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setActiveTab('users')}
                        >
                            <UserCheck className="w-4 h-4 mr-1.5" /> User Assignment
                        </Button>
                    </div>
                }
            />

            {/* TAB 1: ROLES & PERMISSIONS MATRIX */}
            {activeTab === 'roles' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left: Role Navigation List */}
                    <div className="lg:col-span-4 space-y-4">
                        <Card
                            title="System Roles"
                            subtitle="Select a role to inspect or update permissions"
                            actions={
                                can('create-roles-permissions') && (
                                    <button
                                        type="button"
                                        onClick={() => setShowNewRoleModal(true)}
                                        className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 rounded-lg border border-teal-200 transition cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>New Role</span>
                                    </button>
                                )
                            }
                        >
                            <div className="space-y-2">
                                {roles.map((r) => {
                                    const isSelected = selectedRole?.id === r.id;
                                    const isSuper = r.name === 'Super Admin';
                                    return (
                                        <div
                                            key={r.id}
                                            onClick={() => handleSelectRole(r)}
                                            className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                                                isSelected
                                                    ? 'bg-teal-50/70 border-teal-500 shadow-xs'
                                                    : 'bg-white border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="min-w-0 pr-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm text-slate-900 truncate">
                                                        {r.name}
                                                    </span>
                                                    {isSuper ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                                            <Lock className="w-2.5 h-2.5" /> Full Root
                                                        </span>
                                                    ) : r.is_system ? (
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                                            System
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                                                    <span>{r.permissions_count} / {allPermissions.length} permissions</span>
                                                    <span>•</span>
                                                    <span>{r.users_count} users</span>
                                                </p>
                                            </div>

                                            {!r.is_system && can('delete-roles-permissions') && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteRole(r);
                                                    }}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                                    title="Delete custom role"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    </div>

                    {/* Right: Permissions Grid for Selected Role */}
                    <div className="lg:col-span-8 space-y-6">
                        {selectedRole ? (
                            <Card
                                title={`Edit Permissions: ${selectedRole.name}`}
                                subtitle={
                                    selectedRole.name === 'Super Admin'
                                        ? 'Super Admin automatically possesses all permissions across the entire clinic system.'
                                        : 'Toggle granular view, create, update, and delete access for this role.'
                                }
                                actions={
                                    selectedRole.name !== 'Super Admin' && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={handleSelectAll}
                                                className="text-xs font-semibold text-teal-600 hover:text-teal-700 underline cursor-pointer"
                                            >
                                                Select All
                                            </button>
                                            <span className="text-slate-300">|</span>
                                            <button
                                                type="button"
                                                onClick={handleDeselectAll}
                                                className="text-xs font-semibold text-slate-500 hover:text-slate-700 underline cursor-pointer"
                                            >
                                                Deselect All
                                            </button>
                                        </div>
                                    )
                                }
                            >
                                <form onSubmit={handleSaveRole} className="space-y-6">
                                    {/* Role Name */}
                                    <div className="max-w-md">
                                        <TextInput
                                            label="Role Name"
                                            value={editForm.data.name}
                                            onChange={(e) => editForm.setData('name', e.target.value)}
                                            error={editForm.errors.name}
                                            disabled={selectedRole.name === 'Super Admin'}
                                            required
                                        />
                                    </div>

                                    {/* Modules Permission Matrix */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                                Module & Access Rights
                                            </span>
                                            <div className="flex items-center gap-6 text-xs font-bold text-slate-500 uppercase tracking-wider pr-2">
                                                <span className="w-16 text-center">View</span>
                                                <span className="w-16 text-center">Create</span>
                                                <span className="w-16 text-center">Update</span>
                                                <span className="w-16 text-center">Delete</span>
                                            </div>
                                        </div>

                                        <div className="divide-y divide-slate-100">
                                            {modules.map((mod) => {
                                                const IconComponent = iconMap[mod.icon] || ShieldCheck;
                                                const modPerms = mod.permissions;
                                                const isSuper = selectedRole.name === 'Super Admin';
                                                const allModuleSelected = isSuper || Object.values(modPerms).every((p) =>
                                                    editForm.data.permissions.includes(p)
                                                );

                                                return (
                                                    <div
                                                        key={mod.key}
                                                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-lg transition"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                                                                <IconComponent className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <span className="font-bold text-xs text-slate-800 block">
                                                                    {mod.label}
                                                                </span>
                                                                {!isSuper && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleToggleModuleAll(modPerms)}
                                                                        className="text-[11px] text-teal-600 hover:text-teal-700 font-semibold underline cursor-pointer"
                                                                    >
                                                                        {allModuleSelected ? 'Uncheck all' : 'Check all'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Action Checkboxes */}
                                                        <div className="flex items-center gap-6 justify-end pr-2">
                                                            {['view', 'create', 'update', 'delete'].map((action) => {
                                                                const permName = modPerms[action];
                                                                const isChecked = isSuper || editForm.data.permissions.includes(permName);

                                                                return (
                                                                    <label
                                                                        key={action}
                                                                        className={`w-16 flex items-center justify-center py-1.5 px-2 rounded-lg border text-xs font-semibold cursor-pointer transition select-none ${
                                                                            isChecked
                                                                                ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                                                                                : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                                                                        } ${isSuper ? 'opacity-80 cursor-not-allowed' : ''}`}
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            className="sr-only"
                                                                            checked={isChecked}
                                                                            disabled={isSuper}
                                                                            onChange={() => handlePermissionToggle(permName)}
                                                                        />
                                                                        <div className="flex items-center gap-1 capitalize">
                                                                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                                                            <span>{action}</span>
                                                                        </div>
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Operational & Clinical Workflow Permissions */}
                                    {operationalPermissions.length > 0 && (
                                        <div className="pt-6 border-t border-slate-200 space-y-4">
                                            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                                <div>
                                                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                                        Operational & Clinical Workflow Actions
                                                    </h5>
                                                    <p className="text-[11px] text-slate-500">
                                                        Granular permissions for calling patients, serial cancellation, queue progression, and WhatsApp notifications
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {operationalPermissions.map((op) => {
                                                    const isSuper = selectedRole.name === 'Super Admin';
                                                    const isChecked = isSuper || editForm.data.permissions.includes(op.name);

                                                    return (
                                                        <label
                                                            key={op.name}
                                                            className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition select-none ${
                                                                isChecked
                                                                    ? 'bg-teal-50/70 border-teal-300 ring-1 ring-teal-400/40'
                                                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                                            } ${isSuper ? 'opacity-80 cursor-not-allowed' : ''}`}
                                                        >
                                                            <div className="pt-0.5">
                                                                <input
                                                                    type="checkbox"
                                                                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer"
                                                                    checked={isChecked}
                                                                    disabled={isSuper}
                                                                    onChange={() => handlePermissionToggle(op.name)}
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span className="font-bold text-xs text-slate-900 block truncate">
                                                                        {op.label}
                                                                    </span>
                                                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                                                                        {op.badge}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                                                                    {op.description}
                                                                </p>
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Button */}
                                    {selectedRole.name !== 'Super Admin' && can('edit-roles-permissions') && (
                                        <div className="pt-4 border-t border-slate-200 flex items-center justify-end">
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                size="md"
                                                loading={editForm.processing}
                                                className="font-bold shadow-md shadow-teal-600/30"
                                            >
                                                <Save className="w-4 h-4 mr-1.5" /> Save Role Permissions
                                            </Button>
                                        </div>
                                    )}
                                </form>
                            </Card>
                        ) : (
                            <EmptyState
                                icon={Shield}
                                title="No role selected"
                                description="Select a role from the left column to view its permissions."
                            />
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: USER ROLE ASSIGNMENT */}
            {activeTab === 'users' && (
                <div className="space-y-6">
                    <Card
                        title="User Role Assignments"
                        subtitle="Assign Spatie security roles to clinic doctors, administrators, and receptionists"
                    >
                        {users.length === 0 ? (
                            <EmptyState title="No staff or doctor users found" />
                        ) : (
                            <Table>
                                <Thead>
                                    <Tr>
                                        <Th>User Name</Th>
                                        <Th>Phone Number</Th>
                                        <Th>User Type (Role Column)</Th>
                                        <Th>Current Spatie Role</Th>
                                        <Th>Assign New Role</Th>
                                        <Th className="text-right">Action</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {users.map((u) => {
                                        const currentVal = selectedUserRole[u.id] || u.current_role;
                                        return (
                                            <Tr key={u.id}>
                                                <Td className="font-bold text-slate-900">{u.name}</Td>
                                                <Td className="font-mono text-xs">{u.phone}</Td>
                                                <Td>
                                                    <span className="capitalize px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                                        {u.user_type}
                                                    </span>
                                                </Td>
                                                <Td>
                                                    <Badge
                                                        variant={
                                                            u.current_role === 'Super Admin'
                                                                ? 'completed'
                                                                : u.current_role === 'Doctor'
                                                                ? 'in_consultation'
                                                                : 'waiting'
                                                        }
                                                    >
                                                        {u.current_role}
                                                    </Badge>
                                                </Td>
                                                <Td>
                                                    <select
                                                        value={currentVal}
                                                        onChange={(e) =>
                                                            setSelectedUserRole({
                                                                ...selectedUserRole,
                                                                [u.id]: e.target.value,
                                                            })
                                                        }
                                                        className="text-xs bg-white border border-slate-300 rounded-lg py-1.5 px-2.5 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                                                    >
                                                        {roles.map((r) => (
                                                            <option key={r.id} value={r.name}>
                                                                {r.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </Td>
                                                <Td className="text-right">
                                                    {can('edit-roles-permissions') ? (
                                                        <Button
                                                            variant="secondary"
                                                            size="xs"
                                                            onClick={() => handleAssignUserRole(u.id)}
                                                            disabled={currentVal === u.current_role}
                                                        >
                                                            <Save className="w-3.5 h-3.5 mr-1" /> Update Role
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">View Only</span>
                                                    )}
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

            {/* Modal: Create New Role */}
            {showNewRoleModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto px-4 py-6 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs">
                    <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-200">
                        <h4 className="font-bold text-lg text-slate-900 mb-1">Create New Role</h4>
                        <p className="text-xs text-slate-500 mb-4">
                            Define a new security role. You can customize permissions after creation.
                        </p>

                        <form onSubmit={handleCreateRole} className="space-y-4">
                            <TextInput
                                label="Role Name"
                                placeholder="e.g. Clinical Assistant, Night Receptionist..."
                                value={createForm.data.name}
                                onChange={(e) => createForm.setData('name', e.target.value)}
                                error={createForm.errors.name}
                                required
                            />

                            <div className="pt-2 flex items-center justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setShowNewRoleModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="sm"
                                    loading={createForm.processing}
                                >
                                    Create Role
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

