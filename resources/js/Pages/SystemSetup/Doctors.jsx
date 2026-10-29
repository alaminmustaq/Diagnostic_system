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
import Textarea from '../../Components/Form/Textarea';
import { UserCog, Plus, Edit2, Trash2, Phone, Stethoscope, DoorOpen, DollarSign } from 'lucide-react';

export default function Doctors({ doctors = [] }) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState(null);
    const [deletingDoctorId, setDeletingDoctorId] = useState(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        phone: '',
        password: '',
        designation: '',
        degrees: '',
        room_number: '',
        professional_phone: '',
        bio_summary: '',
        default_visit_rate: '1000.00',
    });

    const openCreateModal = () => {
        reset();
        clearErrors();
        setEditingDoctor(null);
        setIsCreateModalOpen(true);
    };

    const openEditModal = (doctor) => {
        clearErrors();
        setEditingDoctor(doctor);
        setData({
            name: doctor.name || '',
            phone: doctor.phone || '',
            password: '',
            designation: doctor.doctor_profile?.designation || '',
            degrees: doctor.doctor_profile?.degrees || '',
            room_number: doctor.doctor_profile?.room_number || '',
            professional_phone: doctor.doctor_profile?.professional_phone || '',
            bio_summary: doctor.doctor_profile?.bio_summary || '',
            default_visit_rate: doctor.doctor_profile?.default_visit_rate || '1000.00',
        });
        setIsCreateModalOpen(true);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (editingDoctor) {
            put(`/admin/doctors/${editingDoctor.id}`, {
                onSuccess: () => {
                    setIsCreateModalOpen(false);
                    reset();
                },
            });
        } else {
            post('/admin/doctors', {
                onSuccess: () => {
                    setIsCreateModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleDelete = () => {
        if (!deletingDoctorId) return;
        router.delete(`/admin/doctors/${deletingDoctorId}`, {
            onSuccess: () => setDeletingDoctorId(null),
        });
    };

    return (
        <AppLayout title="Doctor Setup">
            <PageHeader
                title="Doctor Setup & Staff Management"
                subtitle="Configure doctors, designations, consultation rooms, and baseline consultation rates"
                actions={
                    <Button variant="primary" onClick={openCreateModal}>
                        <Plus className="w-4 h-4 mr-1.5" /> Add New Doctor
                    </Button>
                }
            />

            <Card>
                {doctors.length === 0 ? (
                    <EmptyState
                        icon={UserCog}
                        title="No doctors added yet"
                        description="Add your clinic's first doctor to begin scheduling patient serials."
                        action={
                            <Button variant="primary" size="sm" onClick={openCreateModal}>
                                <Plus className="w-4 h-4 mr-1.5" /> Add Doctor
                            </Button>
                        }
                    />
                ) : (
                    <Table>
                        <Thead>
                            <Tr>
                                <Th>Doctor Name</Th>
                                <Th>Designation & Degrees</Th>
                                <Th>Room #</Th>
                                <Th>Login Phone</Th>
                                <Th>Visit Rate</Th>
                                <Th align="right">Actions</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {doctors.map((doctor) => {
                                const profile = doctor.doctor_profile;
                                return (
                                    <Tr key={doctor.id}>
                                        <Td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm border border-teal-200">
                                                    {doctor.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-slate-900 block">{doctor.name}</span>
                                                    <span className="text-[11px] text-slate-400">ID: DOC-{doctor.id}</span>
                                                </div>
                                            </div>
                                        </Td>
                                        <Td>
                                            <span className="font-semibold text-slate-800 text-xs block">
                                                {profile?.designation || 'Specialist'}
                                            </span>
                                            <span className="text-[11px] text-slate-500">{profile?.degrees}</span>
                                        </Td>
                                        <Td>
                                            <Badge variant="info">
                                                <DoorOpen className="w-3 h-3 mr-1" />
                                                {profile?.room_number || 'Room N/A'}
                                            </Badge>
                                        </Td>
                                        <Td>
                                            <span className="font-mono text-xs text-slate-700">{doctor.phone}</span>
                                        </Td>
                                        <Td>
                                            <span className="font-bold text-teal-700 font-mono text-sm">
                                                {profile?.default_visit_rate ? `${parseFloat(profile.default_visit_rate).toFixed(2)} Tk` : '0.00 Tk'}
                                            </span>
                                        </Td>
                                        <Td align="right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => openEditModal(doctor)}
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => setDeletingDoctorId(doctor.id)}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </Td>
                                    </Tr>
                                );
                            })}
                        </Tbody>
                    </Table>
                )}
            </Card>

            {/* Doctor Add / Edit Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title={editingDoctor ? `Edit Doctor: ${editingDoctor.name}` : 'Doctor Setup (User & Profile)'}
                subtitle="The system automatically splits user authentication and professional doctor profile data"
                size="lg"
            >
                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextInput
                            label="Doctor Full Name"
                            placeholder="e.g. Dr. Ariful Islam"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            error={errors.name}
                            required
                        />

                        <TextInput
                            label="Login Phone Number"
                            placeholder="e.g. 01800000000"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            error={errors.phone}
                            required
                        />

                        <TextInput
                            label="Password"
                            type="password"
                            placeholder={editingDoctor ? 'Leave blank to keep current' : 'Min 6 characters'}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            error={errors.password}
                            required={!editingDoctor}
                        />

                        <TextInput
                            label="Default Visit Rate (Tk)"
                            type="number"
                            step="0.01"
                            placeholder="1000.00"
                            value={data.default_visit_rate}
                            onChange={(e) => setData('default_visit_rate', e.target.value)}
                            error={errors.default_visit_rate}
                            required
                        />

                        <TextInput
                            label="Designation"
                            placeholder="e.g. Senior Hair Specialist"
                            value={data.designation}
                            onChange={(e) => setData('designation', e.target.value)}
                            error={errors.designation}
                            required
                        />

                        <TextInput
                            label="Degrees & Certifications"
                            placeholder="e.g. MBBS, MD (Dermatology)"
                            value={data.degrees}
                            onChange={(e) => setData('degrees', e.target.value)}
                            error={errors.degrees}
                            required
                        />

                        <TextInput
                            label="Consultation Room Number"
                            placeholder="e.g. Room 102"
                            value={data.room_number}
                            onChange={(e) => setData('room_number', e.target.value)}
                            error={errors.room_number}
                            required
                        />

                        <TextInput
                            label="Professional Contact Phone (Optional)"
                            placeholder="e.g. 01800000001"
                            value={data.professional_phone}
                            onChange={(e) => setData('professional_phone', e.target.value)}
                            error={errors.professional_phone}
                        />
                    </div>

                    <Textarea
                        label="Doctor Bio / Clinical Summary (Optional)"
                        placeholder="Brief summary of professional experience, awards, and specialties..."
                        value={data.bio_summary}
                        onChange={(e) => setData('bio_summary', e.target.value)}
                        error={errors.bio_summary}
                        rows={2}
                    />

                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                        <Button
                            variant="secondary"
                            onClick={() => setIsCreateModalOpen(false)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" loading={processing}>
                            {editingDoctor ? 'Save Changes' : 'Register Doctor'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={!!deletingDoctorId}
                onClose={() => setDeletingDoctorId(null)}
                onConfirm={handleDelete}
                title="Remove Doctor"
                message="Are you sure you want to remove this doctor? Existing records and serial history will remain preserved in archive."
            />
        </AppLayout>
    );
}

