import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  Folder,
  Package,
  Boxes,
  Wallet,
  Bot,
  LogOut,
  ChevronRight,
  Sparkles,
  CreditCard,
  ShoppingBag,
  Sun,
  Moon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuthStore, useThemeStore } from "../../store";
import "./Sidebar.css";

const navItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "sidebar.dashboard" },
  { path: "/shops", icon: Store, label: "sidebar.shops" },
  { path: "/categories", icon: Folder, label: "sidebar.categories" },
  { path: "/payments", icon: CreditCard, label: "sidebar.payments" },
  { path: "/resources", icon: Package, label: "sidebar.resources" },
  { path: "/inventories", icon: Boxes, label: "sidebar.inventories" },
  { path: "/orders", icon: ShoppingBag, label: "sidebar.orders" },
  { path: "/bank", icon: Wallet, label: "sidebar.bank" },
  { path: "/bot", icon: Bot, label: "sidebar.bot" },
];

export function Sidebar() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { logout, user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">
            <Sparkles size={24} />
          </div>
          <span className="logo-text">{t("sidebar.appName")}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <item.icon size={20} />
            <span>{t(item.label)}</span>
            <ChevronRight size={16} className="nav-arrow" />
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {user?.username?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="user-details">
            <span className="user-name">{user?.username || "User"}</span>
            <span className="user-email">{user?.email || ""}</span>
          </div>
        </div>
        <button
          className="btn-theme"
          onClick={toggleTheme}
          title={t("common.theme.toggle")}
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <button className="btn-logout" onClick={handleLogout}>
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
