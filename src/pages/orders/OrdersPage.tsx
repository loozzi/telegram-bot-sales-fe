import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Filter, User, Package } from 'lucide-react';
import dayjs from 'dayjs';
import { ordersApi, shopsApi } from '../../api';
import type { Order, Shop } from '../../types';
import './Orders.css';

type SortField = 'created_at' | 'price_at_purchase' | 'user_username' | 'resource_name';
type SortOrder = 'asc' | 'desc';

const PAGE_SIZE = 20;

export function OrdersPage() {
    const [selectedShop, setSelectedShop] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    // Fetch shops for selector
    const { data: shopsData } = useQuery({
        queryKey: ['shops'],
        queryFn: shopsApi.list,
    });

    // Fetch orders for selected shop
    const { data: ordersData, isLoading, isFetching } = useQuery({
        queryKey: ['orders', selectedShop, currentPage],
        queryFn: () => ordersApi.listShopOrders({
            shop_id: selectedShop,
            skip: (currentPage - 1) * PAGE_SIZE,
            limit: PAGE_SIZE,
        }),
        enabled: !!selectedShop,
    });

    const shops = shopsData?.items || [];
    const totalItems = ordersData?.total || 0;
    const totalPages = Math.ceil(totalItems / PAGE_SIZE);

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
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

    const sortedOrders = useMemo(() => {
        const items = ordersData?.items || [];
        return [...items].sort((a: Order, b: Order) => {
            let comparison = 0;
            switch (sortField) {
                case 'created_at':
                    comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                    break;
                case 'price_at_purchase':
                    comparison = a.price_at_purchase - b.price_at_purchase;
                    break;
                case 'user_username':
                    comparison = (a.user_username || '').localeCompare(b.user_username || '');
                    break;
                case 'resource_name':
                    comparison = (a.resource_name || '').localeCompare(b.resource_name || '');
                    break;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });
    }, [ordersData?.items, sortField, sortOrder]);

    const handleShopChange = (shopId: string) => {
        setSelectedShop(shopId);
        setCurrentPage(1);
    };

    return (
        <div className="orders-page animate-fadeIn">
            <div className="page-header flex justify-between items-center">
                <div>
                    <h1 className="page-title">Orders</h1>
                    <p className="page-subtitle">View all orders for your shops</p>
                </div>
            </div>

            <div className="filter-bar card">
                <div className="filters-row">
                    <div className="filter-icon">
                        <Filter size={20} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0, minWidth: 200 }}>
                        <select
                            className="form-input"
                            value={selectedShop}
                            onChange={(e) => handleShopChange(e.target.value)}
                        >
                            <option value="">Select a shop</option>
                            {shops.map((shop: Shop) => (
                                <option key={shop.id} value={shop.id}>{shop.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {!selectedShop ? (
                <div className="empty-state card">
                    <ShoppingBag size={64} className="empty-state-icon" />
                    <h3 className="empty-state-title">Select a shop</h3>
                    <p className="empty-state-text">
                        Choose a shop from the dropdown above to view its orders.
                    </p>
                </div>
            ) : isLoading ? (
                <div className="page-loader">
                    <div className="spinner spinner-lg" />
                </div>
            ) : sortedOrders.length === 0 ? (
                <div className="empty-state card">
                    <ShoppingBag size={64} className="empty-state-icon" />
                    <h3 className="empty-state-title">No orders yet</h3>
                    <p className="empty-state-text">
                        Orders will appear here when customers make purchases.
                    </p>
                </div>
            ) : (
                <div className="table-container card">
                    {isFetching && <div className="table-loading"><div className="spinner" /></div>}
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th className="sortable" onClick={() => handleSort('user_username')}>
                                    Customer {getSortIcon('user_username')}
                                </th>
                                <th className="sortable" onClick={() => handleSort('resource_name')}>
                                    Product {getSortIcon('resource_name')}
                                </th>
                                <th className="sortable" onClick={() => handleSort('price_at_purchase')}>
                                    Price {getSortIcon('price_at_purchase')}
                                </th>
                                <th>Items</th>
                                <th>Total</th>
                                <th className="sortable" onClick={() => handleSort('created_at')}>
                                    Date {getSortIcon('created_at')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedOrders.map((order: Order) => (
                                <tr key={order.id}>
                                    <td>
                                        <code className="order-id">{order.id.substring(0, 8)}...</code>
                                    </td>
                                    <td>
                                        <div className="customer-info">
                                            <User size={14} />
                                            <span>{order.user_username || order.user_telegram_id || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="product-info">
                                            <Package size={14} />
                                            <div>
                                                <span className="product-name">{order.resource_name || 'N/A'}</span>
                                                {order.resource_type && (
                                                    <span className="product-type">{order.resource_type}</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="price">
                                        {formatAmount(order.price_at_purchase)}
                                    </td>
                                    <td>
                                        <span className="badge badge-info">
                                            {order.order_items?.length || 0} items
                                        </span>
                                    </td>
                                    <td className="total-price">
                                        {formatAmount(order.price_at_purchase * (order.order_items?.length || 1))}
                                    </td>
                                    <td className="text-secondary">
                                        {dayjs(order.created_at).format('DD/MM/YYYY HH:mm')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pagination">
                            <div className="pagination-info">
                                Showing {((currentPage - 1) * PAGE_SIZE) + 1} - {Math.min(currentPage * PAGE_SIZE, totalItems)} of {totalItems}
                            </div>
                            <div className="pagination-controls">
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                >
                                    First
                                </button>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="pagination-page">
                                    Page {currentPage} of {totalPages}
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
                                    Last
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
