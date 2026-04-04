import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tag, ShoppingCart, RotateCcw,
  TicketPercent, Users, ChevronLeft, ChevronRight, LogOut,
  Settings, Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/admin-panel', icon: LayoutDashboard, end: true },
  { label: 'Products', to: '/admin-panel/products', icon: Package },
  { label: 'Categories', to: '/admin-panel/categories', icon: Tag },
  { label: 'Attributes', to: '/admin-panel/attributes', icon: Layers },
  { label: 'Orders', to: '/admin-panel/orders', icon: ShoppingCart },
  { label: 'Returns', to: '/admin-panel/returns', icon: RotateCcw },
  { label: 'Coupons', to: '/admin-panel/coupons', icon: TicketPercent },
  { label: 'Users', to: '/admin-panel/users', icon: Users },
];

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-gray-900 text-gray-100 transition-all duration-200 shrink-0',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo row */}
      <div className="flex items-center h-16 px-4 border-b border-gray-700 shrink-0">
        {!collapsed && (
          <span className="text-white font-semibold text-sm tracking-wider uppercase flex-1">
            Admin Panel
          </span>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors ml-auto"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
        {NAV_ITEMS.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-gray-700 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom user area */}
      <div className="border-t border-gray-700 p-3 shrink-0 space-y-1">
        {!collapsed && (
          <div className="text-xs text-gray-400 px-2 pb-1 truncate">
            {user?.email}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-2 py-2 rounded-md text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
