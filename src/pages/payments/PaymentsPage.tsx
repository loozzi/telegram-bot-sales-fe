import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, CreditCard, Edit2, Trash2, X, Check, Eye, EyeOff, ToggleLeft, ToggleRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { paymentsApi, shopsApi } from '../../api';
import type { Payment, PaymentCreate, Shop, BankType, PaymentStatus } from '../../types';
import './Payments.css';

const BANK_OPTIONS: { value: BankType; label: string }[] = [
    { value: 'vcb', label: 'Vietcombank' },
    { value: 'tpb', label: 'TPBank' },
    { value: 'mb', label: 'MB Bank' },
    { value: 'acb', label: 'ACB' },
    { value: 'bidv', label: 'BIDV' },
    { value: 'tcb', label: 'Techcombank' },
    { value: 'vtb', label: 'VietinBank' },
    { value: 'seabank', label: 'SeABank' },
    { value: 'viettel', label: 'Viettel Money' },
    { value: 'msb', label: 'MSB' },
    { value: 'timo', label: 'Timo' },
    { value: 'vab', label: 'VietABank' },
];

// Token is optional in schema - we validate it manually for create mode
const paymentSchema = z.object({
    bank_type: z.string().min(1, 'Bank is required'),
    bank_number: z.string().min(1, 'Account number is required'),
    bank_name: z.string().optional(),
    account_name: z.string().optional(),
    token: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export function PaymentsPage() {
    const queryClient = useQueryClient();
    const [selectedShopId, setSelectedShopId] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
    const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);
    const [showTokenId, setShowTokenId] = useState<string | null>(null);

    const { data: shopsData } = useQuery({
        queryKey: ['shops'],
        queryFn: shopsApi.list,
    });

    const { data: paymentsData, isLoading } = useQuery({
        queryKey: ['payments', selectedShopId],
        queryFn: () => paymentsApi.list(selectedShopId),
        enabled: !!selectedShopId,
    });

    const createMutation = useMutation({
        mutationFn: (data: PaymentCreate) => paymentsApi.create(selectedShopId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            toast.success('Payment method added!');
            closeModal();
        },
        onError: () => toast.error('Failed to add payment method'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<PaymentCreate> }) =>
            paymentsApi.update(selectedShopId, id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            toast.success('Payment method updated!');
            closeModal();
        },
        onError: () => toast.error('Failed to update payment method'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => paymentsApi.delete(selectedShopId, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            toast.success('Payment method deleted!');
            setDeletingPayment(null);
        },
        onError: () => toast.error('Failed to delete'),
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: PaymentStatus }) =>
            paymentsApi.updateStatus(selectedShopId, id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            toast.success('Status updated!');
        },
        onError: () => toast.error('Failed to update status'),
    });

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<PaymentFormData>({
        resolver: zodResolver(paymentSchema),
    });

    const openCreateModal = () => {
        setEditingPayment(null);
        reset({ bank_type: '', bank_number: '', bank_name: '', account_name: '', token: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (payment: Payment) => {
        setEditingPayment(payment);
        reset({
            bank_type: payment.bank_type,
            bank_number: payment.bank_number,
            bank_name: payment.bank_name || '',
            account_name: payment.account_name || '',
            token: '',
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingPayment(null);
        reset();
    };

    const onSubmit = (data: PaymentFormData) => {
        // For create, token is required
        if (!editingPayment && !data.token) {
            toast.error('Token is required for new payment methods');
            return;
        }

        if (editingPayment) {
            // For update, only include token if provided
            const updatePayload: Partial<PaymentCreate> = {
                bank_type: data.bank_type as BankType,
                bank_number: data.bank_number,
                bank_name: data.bank_name || undefined,
                account_name: data.account_name || undefined,
            };
            if (data.token) {
                updatePayload.token = data.token;
            }
            updateMutation.mutate({ id: editingPayment.id, data: updatePayload });
        } else {
            const payload: PaymentCreate = {
                bank_type: data.bank_type as BankType,
                bank_number: data.bank_number,
                bank_name: data.bank_name || undefined,
                account_name: data.account_name || undefined,
                token: data.token!,
            };
            createMutation.mutate(payload);
        }
    };

    const toggleStatus = (payment: Payment) => {
        const newStatus: PaymentStatus = payment.status === 'working' ? 'suspended' : 'working';
        statusMutation.mutate({ id: payment.id, status: newStatus });
    };

    const getBankLabel = (bankType: BankType) => {
        return BANK_OPTIONS.find(b => b.value === bankType)?.label || bankType.toUpperCase();
    };

    const getStatusBadge = (status: PaymentStatus) => {
        switch (status) {
            case 'working': return <span className="badge badge-success">Working</span>;
            case 'suspended': return <span className="badge badge-error">Suspended</span>;
            case 'pending': return <span className="badge badge-warning">Pending</span>;
            case 'invalid': return <span className="badge badge-error">Invalid</span>;
            default: return <span className="badge badge-info">{status}</span>;
        }
    };

    const shops: Shop[] = shopsData?.items || [];
    const payments: Payment[] = paymentsData?.items || [];

    return (
        <div className="payments-page animate-fadeIn">
            <div className="page-header flex justify-between items-center">
                <div>
                    <h1 className="page-title">Payment Methods</h1>
                    <p className="page-subtitle">Manage bank accounts for your shops</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={openCreateModal}
                    disabled={!selectedShopId}
                >
                    <Plus size={18} />
                    Add Bank Account
                </button>
            </div>

            <div className="filter-bar card">
                <div className="form-group" style={{ marginBottom: 0, maxWidth: 300 }}>
                    <label className="form-label">Select Shop</label>
                    <select
                        className="form-input"
                        value={selectedShopId}
                        onChange={(e) => setSelectedShopId(e.target.value)}
                    >
                        <option value="">-- Choose a shop --</option>
                        {shops.map((shop) => (
                            <option key={shop.id} value={shop.id}>{shop.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {!selectedShopId ? (
                <div className="empty-state card">
                    <CreditCard size={64} className="empty-state-icon" />
                    <h3 className="empty-state-title">Select a shop</h3>
                    <p className="empty-state-text">
                        Choose a shop to manage its payment methods.
                    </p>
                </div>
            ) : isLoading ? (
                <div className="page-loader">
                    <div className="spinner spinner-lg" />
                </div>
            ) : payments.length === 0 ? (
                <div className="empty-state card">
                    <CreditCard size={64} className="empty-state-icon" />
                    <h3 className="empty-state-title">No payment methods</h3>
                    <p className="empty-state-text">
                        Add a bank account to receive payments.
                    </p>
                    <button className="btn btn-primary mt-4" onClick={openCreateModal}>
                        <Plus size={18} />
                        Add Bank Account
                    </button>
                </div>
            ) : (
                <div className="payments-grid">
                    {payments.map((payment) => (
                        <div key={payment.id} className={`payment-card card ${payment.status}`}>
                            <div className="payment-card-header">
                                <div className="bank-icon">
                                    <CreditCard size={24} />
                                </div>
                                <div className="payment-info">
                                    <h3 className="bank-label">{getBankLabel(payment.bank_type)}</h3>
                                    <span className="account-number">{payment.bank_number}</span>
                                </div>
                                <button
                                    className={`status-toggle-btn ${payment.status}`}
                                    onClick={() => toggleStatus(payment)}
                                    title={payment.status === 'working' ? 'Suspend' : 'Activate'}
                                >
                                    {payment.status === 'working' ? (
                                        <ToggleRight size={28} />
                                    ) : (
                                        <ToggleLeft size={28} />
                                    )}
                                </button>
                            </div>

                            <div className="payment-details">
                                {payment.account_name && (
                                    <div className="detail-row">
                                        <span className="detail-label">Account Name</span>
                                        <span className="detail-value">{payment.account_name}</span>
                                    </div>
                                )}
                                <div className="detail-row">
                                    <span className="detail-label">Status</span>
                                    {getStatusBadge(payment.status)}
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">API Token</span>
                                    <div className="token-display">
                                        <code className="token-value">
                                            {showTokenId === payment.id ? '••••••••••••' : '••••••••'}
                                        </code>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => setShowTokenId(showTokenId === payment.id ? null : payment.id)}
                                        >
                                            {showTokenId === payment.id ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="payment-actions">
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => openEditModal(payment)}
                                >
                                    <Edit2 size={16} />
                                    Edit
                                </button>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setDeletingPayment(payment)}
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
                                {editingPayment ? 'Edit Payment Method' : 'Add Payment Method'}
                            </h2>
                            <button className="modal-close" onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Bank</label>
                                    <select
                                        className={`form-input ${errors.bank_type ? 'error' : ''}`}
                                        {...register('bank_type')}
                                    >
                                        <option value="">Select bank</option>
                                        {BANK_OPTIONS.map((bank) => (
                                            <option key={bank.value} value={bank.value}>
                                                {bank.label}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.bank_type && (
                                        <span className="form-error">{errors.bank_type.message}</span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Account Number</label>
                                    <input
                                        type="text"
                                        className={`form-input ${errors.bank_number ? 'error' : ''}`}
                                        placeholder="Enter account number"
                                        {...register('bank_number')}
                                    />
                                    {errors.bank_number && (
                                        <span className="form-error">{errors.bank_number.message}</span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Account Holder Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Name on the account"
                                        {...register('account_name')}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Bank Name (Optional)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Branch or custom name"
                                        {...register('bank_name')}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        Bank Token {editingPayment ? '(optional - leave empty to keep current)' : '(required)'}
                                    </label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        placeholder={editingPayment ? 'Leave empty to keep current token' : 'Bank API token for transaction sync'}
                                        {...register('token')}
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
                                            {editingPayment ? 'Update' : 'Add'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deletingPayment && (
                <div className="modal-overlay" onClick={() => setDeletingPayment(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Delete Payment Method</h2>
                            <button className="modal-close" onClick={() => setDeletingPayment(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>
                                Are you sure you want to delete this bank account?
                            </p>
                            <div className="delete-preview-card">
                                <CreditCard size={20} />
                                <div>
                                    <strong>{getBankLabel(deletingPayment.bank_type)}</strong>
                                    <span>{deletingPayment.bank_number}</span>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setDeletingPayment(null)}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={() => deleteMutation.mutate(deletingPayment.id)}
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
