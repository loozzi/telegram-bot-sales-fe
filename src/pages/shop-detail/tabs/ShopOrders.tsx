import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Download, Package, ShoppingBag, User } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { ordersApi } from "../../../api";
import type { Order } from "../../../types";
import "../ShopDetail.css";

const PAGE_SIZE = 20;

export function ShopOrders() {
    const { shopId } = useParams<{ shopId: string }>();
    const [ordersPage, setOrdersPage] = useState(1);

    const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
        queryKey: ["orders", shopId, ordersPage],
        queryFn: () => ordersApi.listShopOrders({
            shop_id: shopId!,
            skip: (ordersPage - 1) * PAGE_SIZE,
            limit: PAGE_SIZE,
        }),
        enabled: !!shopId,
    });

    return (
        <div className="orders-tab animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
                <h2 className="section-title">Danh sách đơn hàng</h2>
            </div>

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
                                <th>Tổng tiền</th>
                                <th>Ngày tạo</th>
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
                                    <td className="text-center">
                                        {order.quantity}
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
                                                    console.error("Failed to download order", error);
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

                    {/* Pagination */}
                    {Math.ceil((ordersData.total || 0) / PAGE_SIZE) > 1 && (
                        <div className="pagination p-4 border-t border-gray-100 flex justify-between items-center">
                            <div className="text-sm text-secondary">
                                Trang {ordersPage} / {Math.ceil((ordersData.total || 0) / PAGE_SIZE)}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    className="btn btn-sm btn-ghost"
                                    disabled={ordersPage === 1}
                                    onClick={() => setOrdersPage(p => p - 1)}
                                >
                                    Trước
                                </button>
                                <button
                                    className="btn btn-sm btn-ghost"
                                    disabled={ordersPage >= Math.ceil((ordersData.total || 0) / PAGE_SIZE)}
                                    onClick={() => setOrdersPage(p => p + 1)}
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
