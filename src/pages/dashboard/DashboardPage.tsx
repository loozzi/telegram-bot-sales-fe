import { useQuery } from "@tanstack/react-query";
import {
  Store,
  Package,
  Boxes,
  Wallet,
  TrendingUp,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { shopsApi } from "../../api";
import { useAuthStore } from "../../store";
import "./Dashboard.css";

export function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const { data: shopsData, isLoading } = useQuery({
    queryKey: ["shops"],
    queryFn: shopsApi.list,
  });

  const stats = [
    {
      label: t("dashboard.stats.totalShops"),
      value: shopsData?.total || 0,
      icon: Store,
      color: "purple",
      change: "+12%",
    },
    {
      label: t("dashboard.stats.activeResources"),
      value: "-",
      icon: Package,
      color: "blue",
      change: "+8%",
    },
    {
      label: t("dashboard.stats.inventoryItems"),
      value: "-",
      icon: Boxes,
      color: "green",
      change: "+24%",
    },
    {
      label: t("dashboard.stats.transactions"),
      value: "-",
      icon: Wallet,
      color: "orange",
      change: "+5%",
    },
  ];

  return (
    <div className="dashboard-page animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {t("dashboard.title", { username: user?.username || "User" })}
          </h1>
          <p className="page-subtitle">{t("dashboard.subtitle")}</p>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`stat-card stat-${stat.color}`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="stat-icon">
              <stat.icon size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">{stat.label}</span>
              <div className="stat-value-row">
                <span className="stat-value">
                  {isLoading ? (
                    <span
                      className="spinner"
                      style={{ width: 20, height: 20 }}
                    />
                  ) : (
                    stat.value
                  )}
                </span>
                <span className="stat-change positive">
                  <TrendingUp size={14} />
                  {stat.change}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Activity size={20} />
              {t("dashboard.recentActivity")}
            </h3>
          </div>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon green">
                <ArrowUpRight size={16} />
              </div>
              <div className="activity-content">
                <p className="activity-text">Nhận được giao dịch mới</p>
                <span className="activity-time">2 phút trước</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon blue">
                <Package size={16} />
              </div>
              <div className="activity-content">
                <p className="activity-text">Cập nhật kho tài nguyên</p>
                <span className="activity-time">15 phút trước</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon purple">
                <Store size={16} />
              </div>
              <div className="activity-content">
                <p className="activity-text">Tạo cửa hàng mới</p>
                <span className="activity-time">1 giờ trước</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Store size={20} />
              Thống kê nhanh
            </h3>
          </div>
          <div className="quick-stats">
            <div className="quick-stat-item">
              <span className="quick-stat-label">Giới hạn cửa hàng</span>
              <span className="quick-stat-value">{user?.shop_limit || 5}</span>
            </div>
            <div className="quick-stat-item">
              <span className="quick-stat-label">Cửa hàng hoạt động</span>
              <span className="quick-stat-value">
                {shopsData?.items?.filter((s) => s.is_active).length || 0}
              </span>
            </div>
            <div className="quick-stat-item">
              <span className="quick-stat-label">Trạng thái tài khoản</span>
              <span className="badge badge-success">Hoạt động</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
