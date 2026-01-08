import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Edit2, Eye, EyeOff, Plus, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import { z } from "zod";
import { paymentsApi } from "../../../api";
import type { BankType, Payment, PaymentCreate, PaymentStatus } from "../../../types";
import "../ShopDetail.css";

const paymentSchema = z.object({
    bank_type: z.string().min(1, 'Vui lòng chọn ngân hàng'),
    bank_number: z.string().min(1, 'Số tài khoản là bắt buộc'),
    bank_name: z.string().optional(),
    account_name: z.string().optional(),
    token: z.string().optional(),
});

type PaymentForm = z.infer<typeof paymentSchema>;

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

export function ShopSettings() {
    const { shopId } = useParams<{ shopId: string }>();
    const queryClient = useQueryClient();

    // Payment State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
    const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);
    const [showTokenId, setShowTokenId] = useState<string | null>(null);

    const { data: paymentsData } = useQuery({
        queryKey: ["payments", shopId],
        queryFn: () => paymentsApi.list(shopId!),
        enabled: !!shopId,
    });

    const payments = paymentsData?.items || [];

    const paymentForm = useForm<PaymentForm>({
        resolver: zodResolver(paymentSchema),
    });

    // Reset form when editingPayment changes
    useEffect(() => {
        if (editingPayment) {
            paymentForm.reset({
                bank_type: editingPayment.bank_type,
                bank_number: editingPayment.bank_number,
                bank_name: editingPayment.bank_name || "",
                account_name: editingPayment.account_name || "",
                token: "",
            });
        } else {
            paymentForm.reset({
                bank_type: "",
                bank_number: "",
                bank_name: "",
                account_name: "",
                token: "",
            });
        }
    }, [editingPayment, paymentForm]);

    const createPaymentMutation = useMutation({
        mutationFn: (data: PaymentCreate) => paymentsApi.create(shopId!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["payments", shopId] });
            toast.success("Thêm phương thức thanh toán thành công!");
            setIsPaymentModalOpen(false);
        },
        onError: () => toast.error("Thêm thất bại"),
    });

    const updatePaymentMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<PaymentCreate> }) =>
            paymentsApi.update(shopId!, id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["payments", shopId] });
            toast.success("Cập nhật phương thức thanh toán thành công!");
            setIsPaymentModalOpen(false);
            setEditingPayment(null);
        },
        onError: () => toast.error("Cập nhật thất bại"),
    });

    const deletePaymentMutation = useMutation({
        mutationFn: (id: string) => paymentsApi.delete(shopId!, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["payments", shopId] });
            toast.success("Xóa phương thức thanh toán thành công!");
            setDeletingPayment(null);
        },
        onError: () => toast.error("Xóa thất bại"),
    });

    const togglePaymentStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: PaymentStatus }) =>
            paymentsApi.updateStatus(shopId!, id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["payments", shopId] });
            toast.success("Cập nhật trạng thái thành công!");
        },
        onError: () => toast.error("Cập nhật trạng thái thất bại"),
    });

    // Modal Component
    const PaymentModal = () => (
        isPaymentModalOpen && (
            <div className="modal-overlay">
                <div className="modal-content">
                    <h2 className="modal-title">
                        {editingPayment ? "Cập nhật ngân hàng" : "Thêm ngân hàng mới"}
                    </h2>
                    <form
                        onSubmit={paymentForm.handleSubmit((data) => {
                            const payload = {
                                ...data,
                                bank_type: data.bank_type as BankType,
                                token: data.token || ""
                            };
                            if (editingPayment) {
                                updatePaymentMutation.mutate({
                                    id: editingPayment.id,
                                    data: payload,
                                });
                            } else {
                                createPaymentMutation.mutate(payload);
                            }
                        })}
                    >
                        <div className="form-group">
                            <label>Ngân hàng</label>
                            <select {...paymentForm.register("bank_type")} className="form-select">
                                <option value="">Chọn ngân hàng</option>
                                {BANK_OPTIONS.map((bank) => (
                                    <option key={bank.value} value={bank.value}>
                                        {bank.label}
                                    </option>
                                ))}
                            </select>
                            {paymentForm.formState.errors.bank_type && (
                                <span className="form-error">{paymentForm.formState.errors.bank_type.message}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Số tài khoản</label>
                            <input
                                {...paymentForm.register("bank_number")}
                                className="form-input"
                                placeholder="Nhập số tài khoản"
                            />
                            {paymentForm.formState.errors.bank_number && (
                                <span className="form-error">{paymentForm.formState.errors.bank_number.message}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Tên chủ tài khoản</label>
                            <input
                                {...paymentForm.register("account_name")}
                                className="form-input"
                                placeholder="NGUYEN VAN A"
                            />
                        </div>

                        <div className="form-group">
                            <label>Token (API - nếu có)</label>
                            <input
                                {...paymentForm.register("token")}
                                className="form-input"
                                type="password"
                                placeholder="Nhập token..."
                            />
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => setIsPaymentModalOpen(false)}
                            >
                                Hủy
                            </button>
                            <button type="submit" className="btn btn-primary">
                                {editingPayment ? "Cập nhật" : "Thêm mới"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    );

    return (
        <div className="settings-tab animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
                <h2 className="section-title">Phương thức thanh toán</h2>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setEditingPayment(null);
                        setIsPaymentModalOpen(true);
                    }}
                >
                    <Plus size={18} />
                    Thêm ngân hàng
                </button>
            </div>

            {payments.length === 0 ? (
                <div className="empty-state card">
                    <CreditCard size={48} className="empty-state-icon" />
                    <h3 className="empty-state-title">Chưa có phương thức thanh toán</h3>
                    <p className="empty-state-text">Thêm tài khoản ngân hàng để nhận thanh toán từ khách hàng.</p>
                    <button
                        className="btn btn-primary mt-4"
                        onClick={() => {
                            setEditingPayment(null);
                            setIsPaymentModalOpen(true);
                        }}
                    >
                        <Plus size={18} />
                        Thêm tài khoản
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {payments.map((payment) => (
                        <div key={payment.id} className={`card ${!payment.status || payment.status === 'suspended' ? 'opacity-75' : ''}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <CreditCard size={24} className="text-gray-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">{BANK_OPTIONS.find(b => b.value === payment.bank_type)?.label || payment.bank_type}</h3>
                                        <p className="text-sm text-secondary font-mono">{payment.bank_number}</p>
                                    </div>
                                </div>
                                <button
                                    className={`status-toggle ${payment.status === 'working' ? 'available' : 'sold'}`}
                                    style={{ border: 'none', background: 'none', padding: 0 }}
                                    onClick={() => togglePaymentStatusMutation.mutate({
                                        id: payment.id,
                                        status: payment.status === 'working' ? 'suspended' : 'working'
                                    })}
                                    title={payment.status === 'working' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                >
                                    {payment.status === 'working' ? <ToggleRight size={28} className="text-success" /> : <ToggleLeft size={28} className="text-secondary" />}
                                </button>
                            </div>

                            <div className="space-y-3 mb-4">
                                {payment.account_name && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-secondary">Chủ tài khoản:</span>
                                        <span className="font-medium">{payment.account_name}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm items-center">
                                    <span className="text-secondary">Token:</span>
                                    <div className="flex items-center gap-2">
                                        <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                                            {showTokenId === payment.id ? "••••••••" : "••••••••"}
                                        </code>
                                        <button className="text-secondary hover:text-primary" onClick={() => setShowTokenId(showTokenId === payment.id ? null : payment.id)}>
                                            {showTokenId === payment.id ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-secondary">Trạng thái:</span>
                                    {payment.status === "working" ? <span className="badge badge-success">Hoạt động</span> : <span className="badge badge-error">Tạm dừng</span>}
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-gray-100">
                                <button
                                    className="btn btn-secondary btn-sm flex-1"
                                    onClick={() => {
                                        setEditingPayment(payment);
                                        setIsPaymentModalOpen(true);
                                    }}
                                >
                                    <Edit2 size={16} /> Sửa
                                </button>
                                <button
                                    className="btn btn-ghost btn-sm text-error hover:bg-red-50"
                                    onClick={() => setDeletingPayment(payment)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <PaymentModal />
            {/* Delete Confirmation Modal */}
            {deletingPayment && (
                <div className="modal-overlay" onClick={() => setDeletingPayment(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Xóa phương thức thanh toán</h2>
                            <button className="modal-close" onClick={() => setDeletingPayment(null)}>
                                <div className="i-lucide-x w-5 h-5" />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>
                                Bạn có chắc chắn muốn xóa phương thức thanh toán <strong>{deletingPayment.bank_number}</strong>?
                                Hành động này không thể hoàn tác.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setDeletingPayment(null)}
                            >
                                Hủy
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={() => deletePaymentMutation.mutate(deletingPayment.id)}
                            >
                                <Trash2 size={18} />
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
