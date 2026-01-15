import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    RefreshCw,
    Filter,
    CheckCircle2,
    XCircle,
    Clock,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { bankApi } from '../../api/bank';
import { formatDate, formatCurrency } from '../../utils/format';
import type { BankType, BankTransactionStatus } from '../../types';
import './BankPage.css';
import toast from 'react-hot-toast';

export function BankPage() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [statusFilter, setStatusFilter] = useState<BankTransactionStatus | ''>('');
    const [bankTypeFilter, setBankTypeFilter] = useState<BankType | ''>('');

    const { data, isLoading, isRefetching } = useQuery({
        queryKey: ['bank-transactions', page, limit, statusFilter, bankTypeFilter],
        queryFn: () => bankApi.listTransactions({
            skip: (page - 1) * limit,
            limit,
            status: statusFilter || undefined,
            bank_type: bankTypeFilter || undefined
        }),
    });

    const syncMutation = useMutation({
        mutationFn: bankApi.syncNow,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
            toast.success(t('common.syncSuccess') || 'Đồng bộ thành công');
        },
        onError: () => {
            toast.error(t('common.syncError') || 'Đồng bộ thất bại');
        }
    });

    const getStatusBadge = (status: BankTransactionStatus) => {
        switch (status) {
            case 'completed':
                return (
                    <span className="badge badge-success flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        {t('common.active')}
                    </span>
                );
            case 'failed':
                return (
                    <span className="badge badge-error flex items-center gap-1">
                        <XCircle size={12} />
                        Thất bại
                    </span>
                );
            case 'pending':
                return (
                    <span className="badge badge-warning flex items-center gap-1">
                        <Clock size={12} />
                        Chờ xử lý
                    </span>
                );
            default:
                return <span className="badge badge-ghost">{status}</span>;
        }
    };

    const getDirectionIcon = (direction: 'in' | 'out') => {
        if (direction === 'in') {
            return <ArrowDownLeft size={18} className="text-success" />;
        }
        return <ArrowUpRight size={18} className="text-error" />;
    };

    return (
        <div className="bank-page animate-fadeIn space-y-6">
            {/* Filters */}
            <div className="card bg-base-100 p-6 flex flex-row justify-between mb-0">
                <div className="flex flex-col md:flex-row gap-4 md:items-end">
                    <div className="flex flex-row gap-4 w-full md:w-auto">
                        <div className="mb-0 flex-1 md:w-auto">
                            <label className="form-label text-xs uppercase tracking-wider mb-1.5 flex items-center gap-2">
                                <Filter size={14} />
                                Trạng thái
                            </label>
                            <select
                                className="form-input w-full md:min-w-[200px] cursor-pointer"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as BankTransactionStatus)}
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="completed">Thành công</option>
                                <option value="pending">Chờ xử lý</option>
                                <option value="failed">Thất bại</option>
                            </select>
                        </div>

                        <div className="mb-0 flex-1 md:w-auto">
                            <label className="form-label text-xs uppercase tracking-wider mb-1.5">
                                Ngân hàng
                            </label>
                            <select
                                className="form-input w-full md:min-w-[200px] cursor-pointer"
                                value={bankTypeFilter}
                                onChange={(e) => setBankTypeFilter(e.target.value as BankType)}
                            >
                                <option value="">Tất cả ngân hàng</option>
                                <option value="vcb">Vietcombank</option>
                                <option value="tpb">TPBank</option>
                                <option value="mb">MB Bank</option>
                                <option value="acb">ACB</option>
                                <option value="bidv">BIDV</option>
                                <option value="tcb">Techcombank</option>
                                <option value="vtb">VietinBank</option>
                            </select>
                        </div>
                    </div>

                    <div className="ml-auto text-sm text-base-content/70 pb-3">
                        {(isLoading || isRefetching) && (
                            <span className="flex items-center gap-2 animate-pulse text-primary">
                                <RefreshCw size={14} className="animate-spin" />
                                Đang cập nhật dữ liệu...
                            </span>
                        )}
                    </div>
                </div>
                <div>
                    <button
                        className="btn btn-primary"
                        onClick={() => syncMutation.mutate()}
                        disabled={syncMutation.isPending}
                    >
                        <RefreshCw size={18} className={syncMutation.isPending ? "animate-spin" : ""} />
                        {syncMutation.isPending ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}
                    </button>
                </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mb-0 px-1">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Hiển thị</span>
                    <select
                        className="form-select text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        value={limit}
                        onChange={(e) => {
                            setLimit(Number(e.target.value));
                            setPage(1);
                        }}
                    >
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                    <span className="text-sm text-gray-500">dòng mỗi trang</span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm text-gray-700">
                        Trang {page} / {Math.ceil((data?.total || 0) / limit) || 1}
                    </span>
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={!data || page >= (Math.ceil((data?.total || 0) / limit) || 1)}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="card bg-base-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead>
                            <tr>
                                <th>Giao dịch</th>
                                <th>Ngân hàng</th>
                                <th>Số tiền</th>
                                <th>Nội dung</th>
                                <th>Trạng thái</th>
                                <th>Thời gian</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="h-16 bg-base-200/50"></td>
                                    </tr>
                                ))
                            ) : data?.items.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-3 text-base-content/50">
                                            <Wallet size={48} />
                                            <p>Chưa có giao dịch nào</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                data?.items.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-base-200/50 transition-colors">
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-base-200 rounded-lg">
                                                    {getDirectionIcon(tx.direction)}
                                                </div>
                                                <div>
                                                    <div className="font-medium font-mono text-xs opacity-70">
                                                        #{tx.transaction_id}
                                                    </div>
                                                    <div className="text-sm font-bold truncate max-w-[150px]" title={tx.id}>
                                                        ID: {tx.id.substring(0, 8)}...
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex flex-col">
                                                <span className="font-medium uppercase">{tx.bank_type}</span>
                                                <span className="text-xs text-base-content/70">{tx.bank_number}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`font-bold ${tx.direction === 'in' ? 'text-success' : 'text-error'
                                                }`}>
                                                {tx.direction === 'in' ? '+' : '-'}{formatCurrency(tx.amount)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="max-w-xs truncate text-sm" title={tx.content || ''}>
                                                {tx.content || '-'}
                                                {tx.description && (
                                                    <div className="text-xs text-base-content/70 truncate">
                                                        {tx.description.slice(0, 24)}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>{getStatusBadge(tx.status)}</td>
                                        <td>
                                            <div className="flex flex-col text-sm">
                                                <span>{formatDate(tx.transaction_date || tx.created_at || '')}</span>
                                                <span className="text-xs text-base-content/70">
                                                    {tx.created_at ? formatDate(tx.created_at) : ''}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>


            </div>
        </div>
    );
}
