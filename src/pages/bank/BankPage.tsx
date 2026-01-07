import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Wallet, RefreshCw, ArrowDownLeft, ArrowUpRight, Filter, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { bankApi } from '../../api';
import type { BankTransaction, BankTransactionStatus, BankType } from '../../types';
import './Bank.css';

type SortField = 'direction' | 'bank_name' | 'amount' | 'transaction_date' | 'status';
type SortOrder = 'asc' | 'desc';

const PAGE_SIZE = 20;

export function BankPage() {
    const [statusFilter, setStatusFilter] = useState<BankTransactionStatus | ''>('');
    const [bankFilter, setBankFilter] = useState<BankType | ''>('');
    const [sortField, setSortField] = useState<SortField>('transaction_date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [currentPage, setCurrentPage] = useState(1);

    const { data, isLoading, refetch, isFetching } = useQuery({
        queryKey: ['bank-transactions', statusFilter, bankFilter, currentPage],
        queryFn: () => bankApi.listTransactions({
            status: statusFilter || undefined,
            bank_type: bankFilter || undefined,
            skip: (currentPage - 1) * PAGE_SIZE,
            limit: PAGE_SIZE,
        }),
    });

    const totalItems = data?.total || 0;
    const totalPages = Math.ceil(totalItems / PAGE_SIZE);

    const syncMutation = useMutation({
        mutationFn: () => bankApi.syncNow(),
        onSuccess: () => {
            refetch();
            toast.success('Giao dịch đã đồng bộ!');
        },
        onError: () => toast.error('Đồng bộ thất bại'),
    });

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    const getStatusBadge = (status: BankTransactionStatus) => {
        switch (status) {
            case 'completed': return <span className="badge badge-success">Hoàn thành</span>;
            case 'pending': return <span className="badge badge-warning">Đang chờ</span>;
            case 'failed': return <span className="badge badge-error">Thất bại</span>;
            default: return <span className="badge badge-info">{status}</span>;
        }
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return null;
        return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
    };

    const sortedTransactions = useMemo(() => {
        const items = data?.items || [];
        return [...items].sort((a: BankTransaction, b: BankTransaction) => {
            let comparison = 0;
            switch (sortField) {
                case 'direction':
                    comparison = a.direction.localeCompare(b.direction);
                    break;
                case 'bank_name':
                    comparison = (a.bank_name || '').localeCompare(b.bank_name || '');
                    break;
                case 'amount':
                    comparison = a.amount - b.amount;
                    break;
                case 'transaction_date':
                    comparison = new Date(a.transaction_date || 0).getTime() - new Date(b.transaction_date || 0).getTime();
                    break;
                case 'status':
                    comparison = a.status.localeCompare(b.status);
                    break;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });
    }, [data?.items, sortField, sortOrder]);

    const transactions = sortedTransactions;

    return (
        <div className="bank-page animate-fadeIn">
            <div className="page-header flex justify-between items-center">
                <div>
                    <h1 className="page-title">Giao Dịch Ngân Hàng</h1>
                    <p className="page-subtitle">Xem và quản lý giao dịch ngân hàng</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => syncMutation.mutate()}
                    disabled={syncMutation.isPending}
                >
                    {syncMutation.isPending ? (
                        <span className="spinner" style={{ width: 18, height: 18 }} />
                    ) : (
                        <>
                            <RefreshCw size={18} />
                            Đồng Bộ Ngay
                        </>
                    )}
                </button>
            </div>

            <div className="filter-bar card">
                <div className="filters-row">
                    <div className="filter-icon">
                        <Filter size={20} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <select
                            className="form-input"
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value as BankTransactionStatus | ''); setCurrentPage(1); }}
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="pending">Đang chờ</option>
                            <option value="completed">Hoàn thành</option>
                            <option value="failed">Thất bại</option>
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <select
                            className="form-input"
                            value={bankFilter}
                            onChange={(e) => { setBankFilter(e.target.value as BankType | ''); setCurrentPage(1); }}
                        >
                            <option value="">Tất cả ngân hàng</option>
                            <option value="vcb">Vietcombank</option>
                            <option value="tpb">TPBank</option>
                            <option value="mb">MB Bank</option>
                            <option value="acb">ACB</option>
                            <option value="bidv">BIDV</option>
                            <option value="tcb">Techcombank</option>
                        </select>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="page-loader">
                    <div className="spinner spinner-lg" />
                </div>
            ) : transactions.length === 0 ? (
                <div className="empty-state card">
                    <Wallet size={64} className="empty-state-icon" />
                    <h3 className="empty-state-title">Không có giao dịch</h3>
                    <p className="empty-state-text">
                        Giao dịch sẽ xuất hiện ở đây khi được đồng bộ từ ngân hàng của bạn.
                    </p>
                </div>
            ) : (
                <div className="table-container card">
                    {isFetching && <div className="table-loading"><div className="spinner" /></div>}
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="sortable" onClick={() => handleSort('direction')}>
                                    Hướng {getSortIcon('direction')}
                                </th>
                                <th className="sortable" onClick={() => handleSort('bank_name')}>
                                    Ngân Hàng {getSortIcon('bank_name')}
                                </th>
                                <th className="sortable" onClick={() => handleSort('amount')}>
                                    Số Tiền {getSortIcon('amount')}
                                </th>
                                <th>Mô Tả</th>
                                <th className="sortable" onClick={() => handleSort('transaction_date')}>
                                    Ngày {getSortIcon('transaction_date')}
                                </th>
                                <th className="sortable" onClick={() => handleSort('status')}>
                                    Trạng Thái {getSortIcon('status')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((tx) => (
                                <tr key={tx.id}>
                                    <td>
                                        <div className={`direction-badge ${tx.direction}`}>
                                            {tx.direction === 'in' ? (
                                                <><ArrowDownLeft size={14} /> Vào</>
                                            ) : (
                                                <><ArrowUpRight size={14} /> Ra</>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="bank-info">
                                            <span className="bank-name">{tx.bank_name}</span>
                                            <span className="bank-number">{tx.bank_number}</span>
                                        </div>
                                    </td>
                                    <td className={`amount ${tx.direction}`}>
                                        {tx.direction === 'in' ? '+' : '-'}{formatAmount(tx.amount)}
                                    </td>
                                    <td className="description truncate" style={{ maxWidth: 250 }}>
                                        {tx.description || tx.content || '-'}
                                    </td>
                                    <td className="text-secondary">
                                        {tx.transaction_date
                                            ? dayjs(tx.transaction_date).format('DD/MM/YYYY HH:mm')
                                            : '-'
                                        }
                                    </td>
                                    <td>{getStatusBadge(tx.status)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pagination">
                            <div className="pagination-info">
                                Hiển thị {((currentPage - 1) * PAGE_SIZE) + 1} - {Math.min(currentPage * PAGE_SIZE, totalItems)} trong tổng {totalItems}
                            </div>
                            <div className="pagination-controls">
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                >
                                    Đầu
                                </button>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="pagination-page">
                                    Trang {currentPage} / {totalPages}
                                </span>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight size={16} />
                                </button>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                >
                                    Cuối
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
