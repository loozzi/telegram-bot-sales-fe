import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Store, Edit2, Trash2, Bot, X, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { shopsApi, botApi } from '../../api';
import type { Shop, ShopCreate } from '../../types';
import './Shops.css';

const shopSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    description: z.string().max(500).optional(),
    support_channel: z.string().max(200).optional(),
    support_group: z.string().max(200).optional(),
    policy: z.string().max(5000).optional(),
    bot_token: z.string().min(1, 'Bot token is required').max(200),
});

type ShopForm = z.infer<typeof shopSchema>;

export function ShopsPage() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingShop, setEditingShop] = useState<Shop | null>(null);
    const [deletingShop, setDeletingShop] = useState<Shop | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['shops'],
        queryFn: shopsApi.list,
    });

    const createMutation = useMutation({
        mutationFn: (data: ShopCreate) => shopsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shops'] });
            toast.success('Shop created successfully!');
            closeModal();
        },
        onError: () => toast.error('Failed to create shop'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ShopCreate> }) =>
            shopsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shops'] });
            toast.success('Shop updated successfully!');
            closeModal();
        },
        onError: () => toast.error('Failed to update shop'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => shopsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shops'] });
            toast.success('Shop deleted successfully!');
            setDeletingShop(null);
        },
        onError: () => toast.error('Failed to delete shop'),
    });

    const startBotMutation = useMutation({
        mutationFn: (shopId: string) => botApi.startMyBot(shopId),
        onSuccess: () => toast.success('Bot started!'),
        onError: () => toast.error('Failed to start bot'),
    });

    const stopBotMutation = useMutation({
        mutationFn: (shopId: string) => botApi.stopMyBot(shopId),
        onSuccess: () => toast.success('Bot stopped!'),
        onError: () => toast.error('Failed to stop bot'),
    });

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ShopForm>({
        resolver: zodResolver(shopSchema),
    });

    const openCreateModal = () => {
        setEditingShop(null);
        reset({ name: '', description: '', support_channel: '', support_group: '', policy: '', bot_token: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (shop: Shop) => {
        setEditingShop(shop);
        reset({ name: shop.name, description: shop.description || '', support_channel: shop.support_channel || '', support_group: shop.support_group || '', policy: shop.policy || '', bot_token: shop.bot_token });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingShop(null);
        reset();
    };

    const onSubmit = (data: ShopForm) => {
        if (editingShop) {
            updateMutation.mutate({ id: editingShop.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const getStatusBadge = (status: string, isActive: boolean) => {
        if (!isActive) return <span className="badge badge-error">Inactive</span>;
        switch (status) {
            case 'active': return <span className="badge badge-success">Active</span>;
            case 'suspended': return <span className="badge badge-warning">Suspended</span>;
            default: return <span className="badge badge-info">{status}</span>;
        }
    };

    return (
        <div className="shops-page animate-fadeIn">
            <div className="page-header flex justify-between items-center">
                <div>
                    <h1 className="page-title">Shops</h1>
                    <p className="page-subtitle">Manage your Telegram bot shops</p>
                </div>
                <button className="btn btn-primary" onClick={openCreateModal}>
                    <Plus size={18} />
                    New Shop
                </button>
            </div>

            {isLoading ? (
                <div className="page-loader">
                    <div className="spinner spinner-lg" />
                </div>
            ) : data?.items?.length === 0 ? (
                <div className="empty-state card">
                    <Store size={64} className="empty-state-icon" />
                    <h3 className="empty-state-title">No shops yet</h3>
                    <p className="empty-state-text">
                        Create your first shop to start selling with Telegram bots.
                    </p>
                    <button className="btn btn-primary mt-4" onClick={openCreateModal}>
                        <Plus size={18} />
                        Create Shop
                    </button>
                </div>
            ) : (
                <div className="shops-grid">
                    {data?.items?.map((shop) => (
                        <div key={shop.id} className="shop-card card">
                            <div className="shop-card-header">
                                <div className="shop-icon">
                                    <Store size={24} />
                                </div>
                                <div className="shop-info">
                                    <h3 className="shop-name">{shop.name}</h3>
                                    {shop.description && (
                                        <p className="shop-description">{shop.description}</p>
                                    )}
                                </div>
                            </div>

                            <div className="shop-meta">
                                <div className="shop-status">
                                    {getStatusBadge(shop.status, shop.is_active)}
                                </div>
                                <div className="shop-token">
                                    <span className="token-label">Token:</span>
                                    <code className="token-value">
                                        {shop.bot_token.substring(0, 20)}...
                                    </code>
                                </div>
                                {shop.support_channel && (
                                    <div className="shop-support-channel">
                                        <span className="meta-label">Channel:</span>
                                        <span className="meta-value">{shop.support_channel}</span>
                                    </div>
                                )}
                                {shop.support_group && (
                                    <div className="shop-support-group">
                                        <span className="meta-label">Group:</span>
                                        <span className="meta-value">{shop.support_group}</span>
                                    </div>
                                )}
                                {shop.policy && (
                                    <div className="shop-policy">
                                        <span className="meta-label">Policy:</span>
                                        <span className="meta-value">{shop.policy.length > 50 ? shop.policy.substring(0, 50) + '...' : shop.policy}</span>
                                    </div>
                                )}
                            </div>

                            <div className="shop-actions">
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => shop.is_active ? stopBotMutation.mutate(shop.id) : startBotMutation.mutate(shop.id)}
                                >
                                    <Bot size={16} />
                                    {shop.is_active ? 'Stop Bot' : 'Start Bot'}
                                </button>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => openEditModal(shop)}
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setDeletingShop(shop)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingShop ? 'Edit Shop' : 'Create New Shop'}
                            </h2>
                            <button className="modal-close" onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Shop Name</label>
                                    <input
                                        type="text"
                                        className={`form-input ${errors.name ? 'error' : ''}`}
                                        placeholder="Enter shop name"
                                        {...register('name')}
                                    />
                                    {errors.name && (
                                        <span className="form-error">{errors.name.message}</span>
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

                                <div className="form-group">
                                    <label className="form-label">Telegram Bot Token</label>
                                    <input
                                        type="text"
                                        className={`form-input ${errors.bot_token ? 'error' : ''}`}
                                        placeholder="Enter your bot token from @BotFather"
                                        {...register('bot_token')}
                                    />
                                    {errors.bot_token && (
                                        <span className="form-error">{errors.bot_token.message}</span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Support Channel (Optional)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="https://t.me/your_support_channel"
                                        {...register('support_channel')}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Support Group (Optional)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="https://t.me/your_support_group"
                                        {...register('support_group')}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Policy (Optional)</label>
                                    <textarea
                                        className="form-input"
                                        placeholder="Enter shop policy/rules"
                                        rows={4}
                                        {...register('policy')}
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
                                            {editingShop ? 'Update' : 'Create'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingShop && (
                <div className="modal-overlay" onClick={() => setDeletingShop(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Delete Shop</h2>
                            <button className="modal-close" onClick={() => setDeletingShop(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>
                                Are you sure you want to delete <strong>{deletingShop.name}</strong>?
                                This action cannot be undone.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setDeletingShop(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={() => deleteMutation.mutate(deletingShop.id)}
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
