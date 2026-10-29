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
import { Layers, Plus, Edit2, Trash2, FolderPlus, Sparkles, Check, X } from 'lucide-react';

export default function Treatments({ categories = [], treatments = [] }) {
    const [activeTab, setActiveTab] = useState('treatments'); // 'treatments' | 'categories'

    // Category Modal state
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [deletingCatId, setDeletingCatId] = useState(null);

    const catForm = useForm({
        name: '',
        ordering: 0,
        is_active: true,
    });

    // Treatment Modal state
    const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);
    const [editingTreatment, setEditingTreatment] = useState(null);
    const [deletingTreatmentId, setDeletingTreatmentId] = useState(null);

    const treatmentForm = useForm({
        category_id: categories.length > 0 ? categories[0].id : '',
        name: '',
        price: '2500.00',
        ordering: 0,
        is_active: true,
    });

    // Category actions
    const openCreateCategory = () => {
        catForm.reset();
        setEditingCategory(null);
        setIsCatModalOpen(true);
    };

    const openEditCategory = (cat) => {
        setEditingCategory(cat);
        catForm.setData({
            name: cat.name,
            ordering: cat.ordering,
            is_active: Boolean(cat.is_active),
        });
        setIsCatModalOpen(true);
    };

    const handleCategorySubmit = (e) => {
        e.preventDefault();
        if (editingCategory) {
            catForm.put(`/admin/categories/${editingCategory.id}`, {
                onSuccess: () => {
                    setIsCatModalOpen(false);
                    catForm.reset();
                },
            });
        } else {
            catForm.post('/admin/categories', {
                onSuccess: () => {
                    setIsCatModalOpen(false);
                    catForm.reset();
                },
            });
        }
    };

    const handleDeleteCategory = () => {
        if (!deletingCatId) return;
        router.delete(`/admin/categories/${deletingCatId}`, {
            onSuccess: () => setDeletingCatId(null),
        });
    };

    // Treatment actions
    const openCreateTreatment = () => {
        treatmentForm.reset();
        setEditingTreatment(null);
        if (categories.length > 0) {
            treatmentForm.setData('category_id', categories[0].id);
        }
        setIsTreatmentModalOpen(true);
    };

    const openEditTreatment = (treatment) => {
        setEditingTreatment(treatment);
        treatmentForm.setData({
            category_id: treatment.category_id,
            name: treatment.name,
            price: treatment.price,
            ordering: treatment.ordering,
            is_active: Boolean(treatment.is_active),
        });
        setIsTreatmentModalOpen(true);
    };

    const handleTreatmentSubmit = (e) => {
        e.preventDefault();
        if (editingTreatment) {
            treatmentForm.put(`/admin/treatments/${editingTreatment.id}`, {
                onSuccess: () => {
                    setIsTreatmentModalOpen(false);
                    treatmentForm.reset();
                },
            });
        } else {
            treatmentForm.post('/admin/treatments', {
                onSuccess: () => {
                    setIsTreatmentModalOpen(false);
                    treatmentForm.reset();
                },
            });
        }
    };

    const handleDeleteTreatment = () => {
        if (!deletingTreatmentId) return;
        router.delete(`/admin/treatments/${deletingTreatmentId}`, {
            onSuccess: () => setDeletingTreatmentId(null),
        });
    };

    return (
        <AppLayout title="Treatments & Services Catalog">
            <PageHeader
                title="Treatments Catalog & Categories"
                subtitle="Manage available clinic procedures, laser therapies, pricing, and category grouping"
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" onClick={openCreateCategory}>
                            <FolderPlus className="w-4 h-4 mr-1.5" /> Add Category
                        </Button>
                        <Button variant="primary" onClick={openCreateTreatment}>
                            <Plus className="w-4 h-4 mr-1.5" /> Add Treatment
                        </Button>
                    </div>
                }
            />

            {/* Sub-navigation Tabs */}
            <div className="flex border-b border-slate-200 mb-6">
                <button
                    onClick={() => setActiveTab('treatments')}
                    className={`py-3 px-5 text-sm font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                        activeTab === 'treatments'
                            ? 'border-teal-600 text-teal-700'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Sparkles className="w-4 h-4" />
                    <span>All Treatments ({treatments.length})</span>
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`py-3 px-5 text-sm font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                        activeTab === 'categories'
                            ? 'border-teal-600 text-teal-700'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Layers className="w-4 h-4" />
                    <span>Treatment Categories ({categories.length})</span>
                </button>
            </div>

            {/* Treatments View */}
            {activeTab === 'treatments' && (
                <Card>
                    {treatments.length === 0 ? (
                        <EmptyState
                            icon={Sparkles}
                            title="No treatments created"
                            description="Add treatments to build your clinic's service catalog."
                            action={
                                <Button variant="primary" size="sm" onClick={openCreateTreatment}>
                                    <Plus className="w-4 h-4 mr-1.5" /> Add Treatment
                                </Button>
                            }
                        />
                    ) : (
                        <Table>
                            <Thead>
                                <Tr>
                                    <Th>Order</Th>
                                    <Th>Treatment Service</Th>
                                    <Th>Category</Th>
                                    <Th>Price (Tk)</Th>
                                    <Th>Status</Th>
                                    <Th align="right">Actions</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {treatments.map((t) => (
                                    <Tr key={t.id}>
                                        <Td>
                                            <span className="font-mono text-xs text-slate-400">#{t.ordering}</span>
                                        </Td>
                                        <Td>
                                            <span className="font-bold text-slate-900">{t.name}</span>
                                        </Td>
                                        <Td>
                                            <Badge variant="treatment">
                                                {t.category?.name || 'Unassigned'}
                                            </Badge>
                                        </Td>
                                        <Td>
                                            <span className="font-mono font-bold text-teal-700 text-sm">
                                                {parseFloat(t.price).toFixed(2)} Tk
                                            </span>
                                        </Td>
                                        <Td>
                                            {t.is_active ? (
                                                <span className="inline-flex items-center text-xs text-emerald-600 font-semibold gap-1">
                                                    <Check className="w-3.5 h-3.5" /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center text-xs text-slate-400 font-medium gap-1">
                                                    <X className="w-3.5 h-3.5" /> Inactive
                                                </span>
                                            )}
                                        </Td>
                                        <Td align="right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => openEditTreatment(t)}
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => setDeletingTreatmentId(t.id)}
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
            )}

            {/* Categories View */}
            {activeTab === 'categories' && (
                <Card>
                    {categories.length === 0 ? (
                        <EmptyState
                            icon={Layers}
                            title="No treatment categories"
                            description="Create categories like Laser, Hair Restoration, or Aesthetics to group procedures."
                            action={
                                <Button variant="primary" size="sm" onClick={openCreateCategory}>
                                    <FolderPlus className="w-4 h-4 mr-1.5" /> Add Category
                                </Button>
                            }
                        />
                    ) : (
                        <Table>
                            <Thead>
                                <Tr>
                                    <Th>Display Order</Th>
                                    <Th>Category Name</Th>
                                    <Th>Treatments Inside</Th>
                                    <Th>Status</Th>
                                    <Th align="right">Actions</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {categories.map((cat) => (
                                    <Tr key={cat.id}>
                                        <Td>
                                            <span className="font-mono text-xs text-slate-400">#{cat.ordering}</span>
                                        </Td>
                                        <Td>
                                            <span className="font-bold text-slate-900">{cat.name}</span>
                                        </Td>
                                        <Td>
                                            <span className="text-xs text-slate-500 font-medium">
                                                {cat.treatments?.length || 0} service(s)
                                            </span>
                                        </Td>
                                        <Td>
                                            {cat.is_active ? (
                                                <Badge variant="success">Active</Badge>
                                            ) : (
                                                <Badge variant="neutral">Inactive</Badge>
                                            )}
                                        </Td>
                                        <Td align="right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => openEditCategory(cat)}
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => setDeletingCatId(cat.id)}
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
            )}

            {/* Category Modal */}
            <Modal
                isOpen={isCatModalOpen}
                onClose={() => setIsCatModalOpen(false)}
                title={editingCategory ? 'Edit Treatment Category' : 'Create Treatment Category'}
                size="sm"
            >
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                    <TextInput
                        label="Category Name"
                        placeholder="e.g. Laser Therapies"
                        value={catForm.data.name}
                        onChange={(e) => catForm.setData('name', e.target.value)}
                        error={catForm.errors.name}
                        required
                    />

                    <TextInput
                        label="Display Ordering"
                        type="number"
                        placeholder="0"
                        value={catForm.data.ordering}
                        onChange={(e) => catForm.setData('ordering', parseInt(e.target.value) || 0)}
                        error={catForm.errors.ordering}
                    />

                    <Toggle
                        label="Active Status"
                        description="Controls visibility in admin billing dropdowns"
                        enabled={catForm.data.is_active}
                        onChange={(val) => catForm.setData('is_active', val)}
                    />

                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                        <Button
                            variant="secondary"
                            onClick={() => setIsCatModalOpen(false)}
                            disabled={catForm.processing}
                        >
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" loading={catForm.processing}>
                            {editingCategory ? 'Save Changes' : 'Create Category'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Treatment Modal */}
            <Modal
                isOpen={isTreatmentModalOpen}
                onClose={() => setIsTreatmentModalOpen(false)}
                title={editingTreatment ? 'Edit Treatment Service' : 'Add Treatment Service'}
                size="md"
            >
                <form onSubmit={handleTreatmentSubmit} className="space-y-4">
                    <SelectInput
                        label="Treatment Category"
                        value={treatmentForm.data.category_id}
                        onChange={(e) => treatmentForm.setData('category_id', e.target.value)}
                        error={treatmentForm.errors.category_id}
                        required
                    >
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </SelectInput>

                    <TextInput
                        label="Treatment / Procedure Name"
                        placeholder="e.g. Fractional CO2 Laser"
                        value={treatmentForm.data.name}
                        onChange={(e) => treatmentForm.setData('name', e.target.value)}
                        error={treatmentForm.errors.name}
                        required
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <TextInput
                            label="Price (Tk)"
                            type="number"
                            step="0.01"
                            placeholder="2500.00"
                            value={treatmentForm.data.price}
                            onChange={(e) => treatmentForm.setData('price', e.target.value)}
                            error={treatmentForm.errors.price}
                            required
                        />

                        <TextInput
                            label="Display Ordering"
                            type="number"
                            placeholder="0"
                            value={treatmentForm.data.ordering}
                            onChange={(e) => treatmentForm.setData('ordering', parseInt(e.target.value) || 0)}
                            error={treatmentForm.errors.ordering}
                        />
                    </div>

                    <Toggle
                        label="Available for Booking"
                        description="Shows inside the treatment POS menu"
                        enabled={treatmentForm.data.is_active}
                        onChange={(val) => treatmentForm.setData('is_active', val)}
                    />

                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                        <Button
                            variant="secondary"
                            onClick={() => setIsTreatmentModalOpen(false)}
                            disabled={treatmentForm.processing}
                        >
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" loading={treatmentForm.processing}>
                            {editingTreatment ? 'Save Changes' : 'Add Treatment'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Confirm Category Delete */}
            <ConfirmModal
                isOpen={!!deletingCatId}
                onClose={() => setDeletingCatId(null)}
                onConfirm={handleDeleteCategory}
                title="Delete Category"
                message="Are you sure you want to delete this category? All treatments under it will also be deleted."
            />

            {/* Confirm Treatment Delete */}
            <ConfirmModal
                isOpen={!!deletingTreatmentId}
                onClose={() => setDeletingTreatmentId(null)}
                onConfirm={handleDeleteTreatment}
                title="Delete Treatment"
                message="Are you sure you want to delete this treatment service?"
            />
        </AppLayout>
    );
}

