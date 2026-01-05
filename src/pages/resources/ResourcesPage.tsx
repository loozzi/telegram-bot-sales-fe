import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Package, Edit2, Trash2, X, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { resourcesApi, shopsApi } from '../../api';
import type { Resource, ResourceCreate, Shop } from '../../types';
import './Resources.css';

const resourceSchema = z.object({
    shop_id: z.string().min(1, 'Shop is required'),
    name: z.string().min(1, 'Name is required').max(100),
    resource_type: z.string().min(1, 'Type is required').max(50),
    description: z.string().max(500).optional(),
    price: z.number().min(0, 'Price must be positive'),
});

type ResourceForm = z.infer<typeof resourceSchema>;

export function ResourcesPage() {
    const queryClient = useQueryClient();
    const [selectedShopId, setSelectedShopId] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingResource, setEditingResource] = useState<Resource | null>(null);
    const [deletingResource, setDeletingResource] = useState<Resource | null>(null);

    const { data: shopsData } = useQuery({
        queryKey: ['shops'],
        queryFn: shopsApi.list,
    });

    const { data: resourcesData, isLoading } = useQuery({
        queryKey: ['resources', selectedShopId],
        queryFn: () => resourcesApi.list(selectedShopId),
        enabled: !!selectedShopId,
    });

    const createMutation = useMutation({
        mutationFn: (data: ResourceCreate) => resourcesApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['resources'] });
            toast.success('Resource created!');
            closeModal();
        },
        onError: () => toast.error('Failed to create resource'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ResourceCreate> }) =>
            resourcesApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['resources'] });
            toast.success('Resource updated!');
            closeModal();
        },
        onError: () => toast.error('Failed to update resource'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => resourcesApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['resources'] });
            toast.success('Resource deleted!');
            setDeletingResource(null);
        },
        onError: () => toast.error('Failed to delete resource'),
    });

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ResourceForm>({
        resolver: zodResolver(resourceSchema),
    });

    const openCreateModal = () => {
        setEditingResource(null);
        reset({ shop_id: selectedShopId, name: '', resource_type: '', description: '', price: 0 });
        setIsModalOpen(true);
    };

    const openEditModal = (resource: Resource) => {
        setEditingResource(resource);
        reset({
            shop_id: resource.shop_id,
            name: resource.name,
            resource_type: resource.resource_type,
            description: resource.description || '',
            price: resource.price,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingResource(null);
        reset();
    };

    const onSubmit = (data: ResourceForm) => {
        if (editingResource) {
            updateMutation.mutate({ id: editingResource.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    const shops: Shop[] = shopsData?.items || [];

    return (
        <div className="resources-page animate-fadeIn">
            <div className="page-header flex justify-between items-center">
                <div>
                    <h1 className="page-title">Resources</h1>
                    <p className="page-subtitle">Manage your shop resources and products</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={openCreateModal}
                    disabled={!selectedShopId}
                >
                    <Plus size={18} />
                    New Resource
                </button>
            </div>

            <div className="filter-bar card">
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Select Shop</label>
                    <select
                        className="form-input"
                        value={selectedShopId}
                        onChange={(e) => setSelectedShopId(e.target.value)}
                    >
                        <option value="">-- Choose a shop --</option>
                        {shops.map((shop) => (
                            <option key={shop.id} value={shop.id}>
                                {shop.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {!selectedShopId ? (
                <div className="empty-state card">
                    <Package size={64} className="empty-state-icon" />
                    <h3 className="empty-state-title">Select a shop</h3>
                    <p className="empty-state-text">
                        Please select a shop above to view and manage its resources.
                    </p>
                </div>
            ) : isLoading ? (
                <div className="page-loader">
                    <div className="spinner spinner-lg" />
                </div>
            ) : resourcesData?.items?.length === 0 ? (
                <div className="empty-state card">
                    <Package size={64} className="empty-state-icon" />
                    <h3 className="empty-state-title">No resources yet</h3>
                    <p className="empty-state-text">
                        Create your first resource to start managing inventory.
                    </p>
                    <button className="btn btn-primary mt-4" onClick={openCreateModal}>
                        <Plus size={18} />
                        Create Resource
                    </button>
                </div>
            ) : (
                <div className="table-container card">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Description</th>
                                <th>Price</th>
                                <th style={{ width: 120 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {resourcesData?.items?.map((resource) => (
                                <tr key={resource.id}>
                                    <td className="font-medium">{resource.name}</td>
                                    <td>
                                        <span className="badge badge-info">{resource.resource_type}</span>
                                    </td>
                                    <td className="text-secondary truncate" style={{ maxWidth: 300 }}>
                                        {resource.description || '-'}
                                    </td>
                                    <td className="font-semibold">{formatPrice(resource.price)}</td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => openEditModal(resource)}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => setDeletingResource(resource)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingResource ? 'Edit Resource' : 'Create Resource'}
                            </h2>
                            <button className="modal-close" onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Shop</label>
                                    <select
                                        className={`form-input ${errors.shop_id ? 'error' : ''}`}
                                        {...register('shop_id')}
                                    >
                                        <option value="">Select shop</option>
                                        {shops.map((shop) => (
                                            <option key={shop.id} value={shop.id}>
                                                {shop.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.shop_id && (
                                        <span className="form-error">{errors.shop_id.message}</span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Name</label>
                                    <input
                                        type="text"
                                        className={`form-input ${errors.name ? 'error' : ''}`}
                                        placeholder="Resource name"
                                        {...register('name')}
                                    />
                                    {errors.name && (
                                        <span className="form-error">{errors.name.message}</span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <input
                                        type="text"
                                        className={`form-input ${errors.resource_type ? 'error' : ''}`}
                                        placeholder="e.g., account, key, license"
                                        {...register('resource_type')}
                                    />
                                    {errors.resource_type && (
                                        <span className="form-error">{errors.resource_type.message}</span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Price (VND)</label>
                                    <input
                                        type="number"
                                        className={`form-input ${errors.price ? 'error' : ''}`}
                                        placeholder="0"
                                        {...register('price', { valueAsNumber: true })}
                                    />
                                    {errors.price && (
                                        <span className="form-error">{errors.price.message}</span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-input"
                                        placeholder="Optional description"
                                        rows={3}
                                        {...register('description')}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                >
                                    {(createMutation.isPending || updateMutation.isPending) ? (
                                        <span className="spinner" style={{ width: 18, height: 18 }} />
                                    ) : (
                                        <>
                                            <Check size={18} />
                                            {editingResource ? 'Update' : 'Create'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deletingResource && (
                <div className="modal-overlay" onClick={() => setDeletingResource(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Delete Resource</h2>
                            <button className="modal-close" onClick={() => setDeletingResource(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>
                                Are you sure you want to delete <strong>{deletingResource.name}</strong>?
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setDeletingResource(null)}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={() => deleteMutation.mutate(deletingResource.id)}
                                disabled={deleteMutation.isPending}
                            >
                                {deleteMutation.isPending ? (
                                    <span className="spinner" style={{ width: 18, height: 18 }} />
                                ) : (
                                    <>
                                        <Trash2 size={18} />
                                        Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
