import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Store,
    Package,
    Boxes,
    Wallet,
    Bot,
    LogOut,
    ChevronRight,
    Sparkles,
    CreditCard,
    ShoppingBag
} from 'lucide-react';
import { useAuthStore } from '../../store';
import './Sidebar.css';

const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/shops', icon: Store, label: 'Shops' },
    { path: '/payments', icon: CreditCard, label: 'Payment Methods' },
    { path: '/resources', icon: Package, label: 'Resources' },
    { path: '/inventories', icon: Boxes, label: 'Inventories' },
    { path: '/orders', icon: ShoppingBag, label: 'Orders' },
    { path: '/bank', icon: Wallet, label: 'Bank Transactions' },
    { path: '/bot', icon: Bot, label: 'Bot Management' },
];

export function Sidebar() {
    const navigate = useNavigate();
    const { logout, user } = useAuthStore();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo">
                    <div className="logo-icon">
                        <Sparkles size={24} />
                    </div>
                    <span className="logo-text">TeleBot Sales</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''}`
                        }
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
                        {user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="user-details">
                        <span className="user-name">{user?.username || 'User'}</span>
                        <span className="user-email">{user?.email || ''}</span>
                    </div>
                </div>
                <button className="btn-logout" onClick={handleLogout}>
                    <LogOut size={18} />
                </button>
            </div>
        </aside>
    );
}
