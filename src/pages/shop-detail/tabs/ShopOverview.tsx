import { useQuery } from "@tanstack/react-query";
import {
    Activity,
    CreditCard,
    DollarSign,
    Package,
    TrendingUp,
    Users
} from "lucide-react";
import { useParams } from "react-router-dom";
import { statsApi } from "../../../api";
import "../ShopDetail.css";

export function ShopOverview() {
    const { shopId } = useParams<{ shopId: string }>();

    const { data: orderStats } = useQuery({
        queryKey: ["shop-stats", "orders", shopId],
        queryFn: () => statsApi.getOrderStats(shopId!),
        enabled: !!shopId,
    });

    const { data: revenueByResource } = useQuery({
        queryKey: ["shop-stats", "resource-revenue", shopId],
        queryFn: () => statsApi.getRevenueByResource(shopId!),
        enabled: !!shopId,
    });

    const { data: successRate } = useQuery({
        queryKey: ["shop-stats", "success-rate", shopId],
        queryFn: () => statsApi.getSuccessRate(shopId!),
        enabled: !!shopId,
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatRate = (rate: number | undefined) => {
        if (rate === undefined) return "0%";
        return `${rate.toFixed(1)}%`;
    };

    return (
        <div className="overview-tab animate-fadeIn">
            {/* Summary Cards */}
            <div className="stats-grid">
                <div className="stat-card card">
                    <div className="stat-icon-wrapper blue">
                        <DollarSign size={24} className="stat-icon" />
                    </div>
                    <div className="stat-info">
                        <p className="stat-label">Doanh thu</p>
                        <p className="stat-value">{formatCurrency(orderStats?.total_revenue || 0)}</p>
                    </div>
                </div>

                <div className="stat-card card">
                    <div className="stat-icon-wrapper green">
                        <Package size={24} className="stat-icon" />
                    </div>
                    <div className="stat-info">
                        <p className="stat-label">Tổng đơn hàng</p>
                        <p className="stat-value">{orderStats?.total_orders || 0}</p>
                    </div>
                </div>

                <div className="stat-card card">
                    <div className="stat-icon-wrapper purple">
                        <Activity size={24} className="stat-icon" />
                    </div>
                    <div className="stat-info">
                        <p className="stat-label">Tỉ lệ thành công</p>
                        <p className="stat-value">{formatRate(successRate?.success_rate)}</p>
                    </div>
                </div>

                <div className="stat-card card">
                    <div className="stat-icon-wrapper orange">
                        <CreditCard size={24} className="stat-icon" />
                    </div>
                    <div className="stat-info">
                        <p className="stat-label">Giá trị TB/Đơn</p>
                        <p className="stat-value">{formatCurrency(orderStats?.avg_order_value || 0)}</p>
                    </div>
                </div>
            </div>

            <div className="stats-detail-grid">
                {/* Recent Orders Chart / List Placeholder */}
                <div className="card detailed-stat-card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <TrendingUp size={20} />
                            Đơn hàng gần đây
                        </h3>
                    </div>
                    <div className="card-content">
                        {orderStats?.orders_by_date && Object.keys(orderStats.orders_by_date).length > 0 ? (
                            <div className="simple-bar-chart">
                                {Object.entries(orderStats.orders_by_date)
                                    .slice(-7) // Show last 7 days
                                    .map(([date, count]) => (
                                        <div key={date} className="chart-bar-item">
                                            <div className="bar-label">{new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</div>
                                            <div className="bar-wrapper">
                                                <div
                                                    className="bar-fill"
                                                    style={{ height: `${Math.min(count * 10, 100)}px` }}
                                                    title={`${count} đơn`}
                                                ></div>
                                            </div>
                                            <div className="bar-value">{count}</div>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <div className="empty-state">Chưa có dữ liệu đơn hàng</div>
                        )}
                    </div>
                </div>

                {/* Top Resources */}
                <div className="card detailed-stat-card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <Users size={20} />
                            Top sản phẩm
                        </h3>
                    </div>
                    <div className="card-content">
                        <div className="resource-list">
                            {revenueByResource?.slice(0, 5).map((resource, index) => (
                                <div key={resource.resource_id} className="resource-stat-item">
                                    <div className="resource-rank">{index + 1}</div>
                                    <div className="resource-info">
                                        <div className="resource-name">{resource.resource_name}</div>
                                    </div>
                                    <div className="resource-revenue">
                                        {formatCurrency(resource.revenue)}
                                    </div>
                                </div>
                            ))}
                            {(!revenueByResource || revenueByResource.length === 0) && (
                                <div className="empty-state">Chưa có dữ liệu sản phẩm</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
