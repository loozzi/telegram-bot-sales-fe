import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Store, Edit2, Trash2, Bot, X, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { shopsApi, botApi } from '../../api';
import type { Shop, ShopCreate } from '../../types';
import './Shops.css';
import { useAuthStore } from '../../store';

const shopSchema = z.object({
    name: z.string().min(1, 'Tên là bắt buộc').max(100),
    description: z.string().max(500).optional(),
    support_channel: z.string().max(200).optional(),
    support_group: z.string().max(200).optional(),
    policy: z.string().max(5000).optional(),
    bot_token: z.string().min(1, 'Bot token là bắt buộc').max(200),
});

type ShopForm = z.infer<typeof shopSchema>;

export function ShopsPage() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingShop, setEditingShop] = useState<Shop | null>(null);
    const [deletingShop, setDeletingShop] = useState<Shop | null>(null);
    const { logout } = useAuthStore();

    const { data, isLoading } = useQuery({
        queryKey: ['shops'],
        queryFn: shopsApi.list,
    });

    const createMutation = useMutation({
        mutationFn: (data: ShopCreate) => shopsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shops'] });
            toast.success('Tạo cửa hàng thành công!');
            closeModal();
        },
        onError: () => toast.error('Tạo cửa hàng thất bại'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ShopCreate> }) =>
            shopsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shops'] });
            toast.success('Cập nhật cửa hàng thành công!');
            closeModal();
        },
        onError: () => toast.error('Cập nhật cửa hàng thất bại'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => shopsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shops'] });
            toast.success('Xóa cửa hàng thành công!');
            setDeletingShop(null);
        },
        onError: () => toast.error('Xóa cửa hàng thất bại'),
    });

    const startBotMutation = useMutation({
        mutationFn: (shopId: string) => botApi.startMyBot(shopId),
        onSuccess: () => toast.success('Bot đã khởi động!'),
        onError: () => toast.error('Khởi động bot thất bại'),
    });

    const stopBotMutation = useMutation({
        mutationFn: (shopId: string) => botApi.stopMyBot(shopId),
        onSuccess: () => toast.success('Bot đã dừng!'),
        onError: () => toast.error('Dừng bot thất bại'),
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
        if (!isActive) return <span className="badge badge-error">Không hoạt động</span>;
        switch (status) {
            case 'active': return <span className="badge badge-success">Hoạt động</span>;
            case 'suspended': return <span className="badge badge-warning">Tạm ngưng</span>;
            default: return <span className="badge badge-info">{status}</span>;
        }
    };

    return (
        <div className="shops-page animate-fadeIn">
            <div className="page-header flex justify-between items-center">
                <div>
                    <h1 className="page-title">Cửa Hàng</h1>
                    <p className="page-subtitle">Quản lý các cửa hàng bot Telegram của bạn</p>
                </div>
                <div className="flex items-center gap-2"    >
                    <button className="btn btn-primary" onClick={openCreateModal}>
                        <Plus size={18} />
                        Cửa Hàng Mới
                    </button>
                    <button
                        onClick={() => {
                            logout();
                            navigate("/login");
                        }}
                        className="btn btn-ghost btn-sm text-error flex items-center gap-2"
                    >
                        <X size={18} />
                        Đăng xuất
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="page-loader">
                    <div className="spinner spinner-lg" />
                </div>
            ) : data?.items?.length === 0 ? (
                <div className="empty-state card">
                    <Store size={64} className="empty-state-icon" />
                    <h3 className="empty-state-title">Chưa có cửa hàng</h3>
                    <p className="empty-state-text">
                        Tạo cửa hàng đầu tiên để bắt đầu bán hàng với bot Telegram.
                    </p>
                    <button className="btn btn-primary mt-4" onClick={openCreateModal}>
                        <Plus size={18} />
                        Tạo Cửa Hàng
                    </button>
                </div>
            ) : (
                <div className="shops-grid">
                    {data?.items?.map((shop) => (
                        <div
                            key={shop.id}
                            className="shop-card card clickable-card"
                            onClick={() => navigate(`/shops/${shop.id}`)}
                        >
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
                                        <span className="meta-label">Kênh:</span>
                                        <span className="meta-value">{shop.support_channel}</span>
                                    </div>
                                )}
                                {shop.support_group && (
                                    <div className="shop-support-group">
                                        <span className="meta-label">Nhóm:</span>
                                        <span className="meta-value">{shop.support_group}</span>
                                    </div>
                                )}
                                {shop.policy && (
                                    <div className="shop-policy">
                                        <span className="meta-label">Chính sách:</span>
                                        <span className="meta-value">{shop.policy.length > 50 ? shop.policy.substring(0, 50) + '...' : shop.policy}</span>
                                    </div>
                                )}
                            </div>

                            <div className="shop-actions" onClick={(e) => e.stopPropagation()}>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => shop.is_active ? stopBotMutation.mutate(shop.id) : startBotMutation.mutate(shop.id)}
                                >
                                    <Bot size={16} />
                                    {shop.is_active ? 'Dừng Bot' : 'Khởi Động Bot'}
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
                                {editingShop ? 'Sửa Cửa Hàng' : 'Tạo Cửa Hàng Mới'}
                            </h2>
                            <button className="modal-close" onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Tên Cửa Hàng</label>
                                    <input
                                        type="text"
                                        className={`form-input ${errors.name ? 'error' : ''}`}
                                        placeholder="Nhập tên cửa hàng"
                                        {...register('name')}
                                    />
                                    {errors.name && (
                                        <span className="form-error">{errors.name.message}</span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Mô Tả</label>
                                    <textarea
                                        className="form-input"
                                        placeholder="Mô tả tùy chọn"
                                        rows={3}
                                        {...register('description')}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Token Bot Telegram</label>
                                    <input
                                        type="text"
                                        className={`form-input ${errors.bot_token ? 'error' : ''}`}
                                        placeholder="Nhập token bot từ @BotFather"
                                        {...register('bot_token')}
                                    />
                                    {errors.bot_token && (
                                        <span className="form-error">{errors.bot_token.message}</span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Kênh Hỗ Trợ (Tùy Chọn)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="https://t.me/your_support_channel"
                                        {...register('support_channel')}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Nhóm Hỗ Trợ (Tùy Chọn)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="https://t.me/your_support_group"
                                        {...register('support_group')}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Chính Sách (Tùy Chọn)</label>
                                    <textarea
                                        className="form-input"
                                        placeholder="Nhập chính sách/quy định của cửa hàng"
                                        rows={4}
                                        {...register('policy')}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Hủy
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
                                            {editingShop ? 'Cập Nhật' : 'Tạo'}
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
                            <h2 className="modal-title">Xóa Cửa Hàng</h2>
                            <button className="modal-close" onClick={() => setDeletingShop(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>
                                Bạn có chắc chắn muốn xóa <strong>{deletingShop.name}</strong>?
                                Hành động này không thể hoàn tác.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setDeletingShop(null)}
                            >
                                Hủy
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
                                        Xóa
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
