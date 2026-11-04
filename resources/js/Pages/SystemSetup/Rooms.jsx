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
import Toggle from '../../Components/Form/Toggle';
import { usePermissions } from '../../Utils/permissions';
import { DoorOpen, Plus, Edit2, Trash2, Check, X } from 'lucide-react';

export default function Rooms({ rooms = [] }) {
    const { can } = usePermissions();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [deletingRoomId, setDeletingRoomId] = useState(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        room_number: '',
        description: '',
        status: 'active',
        is_active: true,
    });

    const openCreateModal = () => {
        reset();
        clearErrors();
        setEditingRoom(null);
        setIsModalOpen(true);
    };

    const openEditModal = (room) => {
        clearErrors();
        setEditingRoom(room);
        const isActive = room.status ? room.status === 'active' : Boolean(room.is_active);
        setData({
            room_number: room.room_number || '',
            description: room.description || '',
            status: isActive ? 'active' : 'inactive',
            is_active: isActive,
        });
        setIsModalOpen(true);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (editingRoom) {
            put(`/admin/rooms/${editingRoom.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        } else {
            post('/admin/rooms', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleDelete = () => {
        if (!deletingRoomId) return;
        router.delete(`/admin/rooms/${deletingRoomId}`, {
            onSuccess: () => setDeletingRoomId(null),
        });
    };

    return (
        <AppLayout title="Room Setup">
            <PageHeader
                title="Room Setup & Management"
                subtitle="Configure consultation and procedure rooms, descriptions, and operational status"
                actions={
                    can('create-rooms') && (
                        <Button variant="primary" onClick={openCreateModal}>
                            <Plus className="w-4 h-4 mr-1.5" /> Add New Room
                        </Button>
                    )
                }
            />

            <Card>
                {rooms.length === 0 ? (
                    <EmptyState
                        icon={DoorOpen}
                        title="No rooms added yet"
                        description="Create your clinic's consultation and treatment rooms to organize daily operations."
                        action={
                            can('create-rooms') && (
                                <Button variant="primary" size="sm" onClick={openCreateModal}>
                                    <Plus className="w-4 h-4 mr-1.5" /> Add Room
                                </Button>
                            )
                        }
                    />
                ) : (
                    <Table>
                        <Thead>
                            <Tr>
                                <Th>ID</Th>
                                <Th>Room Number</Th>
                                <Th>Description</Th>
                                <Th>Status</Th>
                                <Th align="right">Actions</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {rooms.map((room) => {
                                const isActive = room.status
                                    ? room.status === 'active'
                                    : Boolean(room.is_active);

                                return (
                                    <Tr key={room.id}>
                                        <Td>
                                            <span className="font-mono text-xs text-slate-500">
                                                #{room.id}
                                            </span>
                                        </Td>
                                        <Td>
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200 shrink-0">
                                                    <DoorOpen className="w-4 h-4" />
                                                </div>
                                                <span className="font-bold text-slate-900">
                                                    {room.room_number}
                                                </span>
                                            </div>
                                        </Td>
                                        <Td>
                                            <span className="text-xs text-slate-600">
                                                {room.description || '—'}
                                            </span>
                                        </Td>
                                        <Td>
                                            {isActive ? (
                                                <Badge variant="success">
                                                    <Check className="w-3 h-3 mr-1" /> Active
                                                </Badge>
                                            ) : (
                                                <Badge variant="neutral">
                                                    <X className="w-3 h-3 mr-1" /> Inactive
                                                </Badge>
                                            )}
                                        </Td>
                                        <Td align="right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {can('edit-rooms') && (
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => openEditModal(room)}
                                                        title="Edit Room"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                )}
                                                {can('delete-rooms') && (
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => setDeletingRoomId(room.id)}
                                                        title="Delete Room"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                )}
                                                {!can('edit-rooms') && !can('delete-rooms') && (
                                                    <span className="text-xs text-slate-400">View Only</span>
                                                )}
                                            </div>
                                        </Td>
                                    </Tr>
                                );
                            })}
                        </Tbody>
                    </Table>
                )}
            </Card>

            {/* Room Add / Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingRoom ? `Edit Room: ${editingRoom.room_number}` : 'Add New Room'}
                subtitle="Enter the room number, optional description, and active status"
                size="md"
            >
                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <TextInput
                        label="Room Number"
                        placeholder="e.g. Room 101"
                        value={data.room_number}
                        onChange={(e) => setData('room_number', e.target.value)}
                        error={errors.room_number}
                        required
                    />

                    <Textarea
                        label="Description (Optional)"
                        placeholder="e.g. Ground floor consultation room, Laser therapy suite..."
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        error={errors.description}
                        rows={3}
                    />

                    <Toggle
                        label="Room Status (Active)"
                        description="Controls whether this room is active and available"
                        enabled={data.status === 'active'}
                        onChange={(val) => {
                            setData((prev) => ({
                                ...prev,
                                status: val ? 'active' : 'inactive',
                                is_active: val,
                            }));
                        }}
                    />

                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                        <Button
                            variant="secondary"
                            onClick={() => setIsModalOpen(false)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" loading={processing}>
                            {editingRoom ? 'Save Changes' : 'Create Room'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={!!deletingRoomId}
                onClose={() => setDeletingRoomId(null)}
                onConfirm={handleDelete}
                title="Remove Room"
                message="Are you sure you want to remove this room?"
            />
        </AppLayout>
    );
}

