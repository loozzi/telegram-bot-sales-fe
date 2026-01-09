import {
    BarChart3,
    ChevronDown,
    ChevronRight,
    CreditCard,
    Folder,
    LogOut,
    Moon,
    ShoppingBag,
    Store,
    Sun
} from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { shopsApi } from "../../api";
import { useAuthStore, useThemeStore } from "../../store";
import "./Sidebar.css"; // Reuse existing styles or create new ones

export function ShopSidebar() {
    const { shopId } = useParams<{ shopId: string }>();
    const navigate = useNavigate();
    const { logout, user } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();
    const [isShopSwitcherOpen, setIsShopSwitcherOpen] = useState(false);

    const { data: shopsData } = useQuery({
        queryKey: ["shops"],
        queryFn: shopsApi.list,
    });

    const shops = shopsData?.items || [];
    const currentShop = shops.find((s) => s.id === shopId);

    const navItems = [
        { path: `/shops/${shopId}/overview`, icon: BarChart3, label: "Tổng quan" },
        { path: `/shops/${shopId}/categories`, icon: Folder, label: "Gian hàng" },
        // { path: `/shops/${shopId}/resources`, icon: Package, label: "Sản phẩm" },
        { path: `/shops/${shopId}/settings`, icon: CreditCard, label: "Cấu hình & Thanh toán" },
        { path: `/shops/${shopId}/orders`, icon: ShoppingBag, label: "Đơn hàng" },
    ];

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <aside className="sidebar">
            {/* Shop Switcher Header */}
            <div className="sidebar-header">
                <div
                    className="shop-switcher"
                    onClick={() => setIsShopSwitcherOpen(!isShopSwitcherOpen)}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}
                >
                    <div className="logo-icon" style={{ background: 'var(--primary-color)', color: '#fff' }}>
                        <Store size={24} />
                    </div>
                    <div className="shop-info" style={{ flex: 1, overflow: 'hidden' }}>
                        <span className="shop-name" style={{ fontWeight: 600, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {currentShop?.name || "Chọn Shop"}
                        </span>
                    </div>
                    <ChevronDown size={16} />
                </div>

                {/* Dropdown for Shop Switcher */}
                {isShopSwitcherOpen && (
                    <div className="shop-dropdown" style={{
                        position: 'absolute',
                        top: '70px',
                        left: '10px',
                        right: '10px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        zIndex: 100,
                        maxHeight: '300px',
                        overflowY: 'auto'
                    }}>
                        <div className="dropdown-item" onClick={() => navigate('/shops')} style={{ padding: '10px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 500 }}>
                            &larr; Tất cả Shop
                        </div>
                        {shops.map(shop => (
                            <div
                                key={shop.id}
                                className={`dropdown-item ${shop.id === shopId ? 'active' : ''}`}
                                onClick={() => {
                                    navigate(`/shops/${shop.id}/overview`);
                                    setIsShopSwitcherOpen(false);
                                }}
                                style={{ padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <Store size={16} />
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shop.name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                        end={item.path.endsWith('overview')} // Only use 'end' matching for overview if it's the index
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
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
                    title={theme === "light" ? "Chế độ tối" : "Chế độ sáng"}
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
