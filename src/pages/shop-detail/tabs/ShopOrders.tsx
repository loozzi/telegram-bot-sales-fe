import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Download, Package, ShoppingBag, User } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { ordersApi, resourcesApi, categoriesApi } from "../../../api";
import type { Order } from "../../../types";
import "../ShopDetail.css";

export function ShopOrders() {
    const { shopId } = useParams<{ shopId: string }>();
    const [ordersPage, setOrdersPage] = useState(1);
    const [limit, setLimit] = useState(20);
    // filter states
    const [resourceId, setResourceId] = useState<string>('');
    const [buyerName, setBuyerName] = useState<string>('');
    const [categoryId, setCategoryId] = useState<string>('');
    const [sortBy, setSortBy] = useState<'created_at' | 'price_at_purchase' | 'total_price'>('created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // fetch resources and categories for select options
    const { data: resourcesData } = useQuery({
        queryKey: ["resources", shopId],
        queryFn: () => resourcesApi.list(shopId!),
        enabled: !!shopId,
    });
    const { data: categoriesData } = useQuery({
        queryKey: ["categories", shopId],
        queryFn: () => categoriesApi.list(shopId!),
        enabled: !!shopId,
    });

    const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
        queryKey: ["orders", shopId, ordersPage, limit, resourceId, buyerName, categoryId, sortBy, sortOrder],
        queryFn: () =>
            ordersApi.listShopOrders({
                shop_id: shopId!,
                skip: (ordersPage - 1) * limit,
                limit: limit,
                resource_id: resourceId || undefined,
                buyer_name: buyerName || undefined,
                category_id: categoryId || undefined,
                sort_by: sortBy,
                sort_order: sortOrder,
            }),
        enabled: !!shopId,
    });

    return (
        <div className="orders-tab animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
                <h2 className="section-title">Danh sách đơn hàng</h2>
            </div>

            {/* Filter and pagination controls */}
            <div className="flex justify-between items-center mb-4 px-1">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Hiển thị</span>
                    <select
                        className="form-select text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        value={limit}
                        onChange={(e) => {
                            setLimit(Number(e.target.value));
                            setOrdersPage(1);
                        }}
                    >
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                    <span className="text-sm text-gray-500">dòng mỗi trang</span>
                    {/* Filter inputs */}
                    <input
                        type="text"
                        placeholder="Tên người mua"
                        className="form-input text-sm border-gray-300 rounded-md shadow-sm focus:border-purple-400 focus:ring focus:ring-purple-200 focus:ring-opacity-50 h-[38px]"
                        value={buyerName}
                        onChange={(e) => {
                            setBuyerName(e.target.value);
                            setOrdersPage(1);
                        }}
                    />
                    <select
                        className="form-select text-sm border-gray-300 rounded-md"
                        value={resourceId}
                        onChange={(e) => {
                            setResourceId(e.target.value);
                            setOrdersPage(1);
                        }}
                    >
                        <option value="">Tất cả sản phẩm</option>
                        {resourcesData?.items.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.name}
                            </option>
                        ))}
                    </select>
                    <select
                        className="form-select text-sm border-gray-300 rounded-md"
                        value={categoryId}
                        onChange={(e) => {
                            setCategoryId(e.target.value);
                            setOrdersPage(1);
                        }}
                    >
                        <option value="">Tất cả danh mục</option>
                        {categoriesData?.items.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>

                </div>
            </div>

            {/* Pagination navigation */}
            <div className="flex items-center gap-2">
                <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                    disabled={ordersPage === 1}
                >
                    <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-gray-700">
                    Trang {ordersPage} / {Math.ceil((ordersData?.total || 0) / limit) || 1}
                </span>
                <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setOrdersPage((p) => p + 1)}
                    disabled={ordersPage >= (Math.ceil((ordersData?.total || 0) / limit) || 1)}
                >
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Main content */}
            {isLoadingOrders ? (
                <div className="page-loader">
                    <div className="spinner spinner-lg" />
                </div>
            ) : !ordersData?.items || ordersData.items.length === 0 ? (
                <div className="empty-state card">
                    <ShoppingBag size={64} className="empty-state-icon" />
                    <h3 className="empty-state-title">Chưa có đơn hàng</h3>
                    <p className="empty-state-text">
                        Đơn hàng sẽ xuất hiện ở đây khi có khách hàng mua sắm.
                    </p>
                </div>
            ) : (
                <div className="table-container card">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Mã đơn</th>
                                <th>Người mua</th>
                                <th>Sản phẩm</th>
                                <th>Số lượng</th>
                                <th
                                    className="cursor-pointer hover:bg-gray-50 transition-colors select-none"
                                    onClick={() => {
                                        setSortBy('price_at_purchase');
                                        setSortOrder(sortBy === 'price_at_purchase' && sortOrder === 'asc' ? 'desc' : 'asc');
                                        setOrdersPage(1);
                                    }}
                                >
                                    <div className="flex items-center gap-1">
                                        Giá
                                        {sortBy === 'price_at_purchase' && (
                                            sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="cursor-pointer hover:bg-gray-50 transition-colors select-none"
                                    onClick={() => {
                                        setSortBy('total_price');
                                        setSortOrder(sortBy === 'total_price' && sortOrder === 'asc' ? 'desc' : 'asc');
                                        setOrdersPage(1);
                                    }}
                                >
                                    <div className="flex items-center gap-1">
                                        Tổng tiền
                                        {sortBy === 'total_price' && (
                                            sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="cursor-pointer hover:bg-gray-50 transition-colors select-none"
                                    onClick={() => {
                                        setSortBy('created_at');
                                        setSortOrder(sortBy === 'created_at' && sortOrder === 'asc' ? 'desc' : 'asc');
                                        setOrdersPage(1);
                                    }}
                                >
                                    <div className="flex items-center gap-1">
                                        Ngày tạo
                                        {sortBy === 'created_at' && (
                                            sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                        )}
                                    </div>
                                </th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ordersData.items.map((order: Order) => (
                                <tr key={order.id}>
                                    <td>
                                        <code className="text-xs">{order.id.substring(0, 8)}...</code>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <User size={14} className="text-secondary" />
                                            <span>{order.buyer || order.user_username || order.user_telegram_id || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <Package size={14} className="text-secondary" />
                                            <span className="font-medium">{order.resource_name || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="text-center">{order.quantity}</td>
                                    <td className="text-center">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.price_at_purchase)}
                                    </td>
                                    <td className="font-semibold text-primary">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_price)}
                                    </td>
                                    <td className="text-secondary text-sm">
                                        {dayjs(order.created_at).format('DD/MM/YYYY HH:mm')}
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-sm btn-ghost text-primary"
                                            onClick={async () => {
                                                try {
                                                    const text = await ordersApi.downloadOrder(order.id);
                                                    const blob = new Blob([text], { type: 'text/plain' });
                                                    const url = window.URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = `order-${order.id}.txt`;
                                                    document.body.appendChild(a);
                                                    a.click();
                                                    window.URL.revokeObjectURL(url);
                                                    document.body.removeChild(a);
                                                } catch (error) {
                                                    console.error('Failed to download order', error);
                                                }
                                            }}
                                            title="Tải xuống"
                                        >
                                            <Download size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {/* Pagination can be added here if needed */}
                </div>
            )}
        </div>
    );
}
