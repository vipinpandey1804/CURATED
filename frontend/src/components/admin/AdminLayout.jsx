import { Outlet, useLocation, Link, NavLink } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

/** Build a human-readable breadcrumb from the current path */
function useBreadcrumb() {
  const { pathname } = useLocation();
  const parts = pathname.replace('/admin-panel', '').split('/').filter(Boolean);
  const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  const detailLabels = {
    users: 'Profile',
    orders: 'Order Detail',
    products: 'Edit Product',
  };

  const crumbs = [{ label: 'Dashboard', to: '/admin-panel' }];
  let path = '/admin-panel';

  parts.forEach((part, index) => {
    path += `/${part}`;
    let label = part.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    if (isUuid(part)) {
      label = detailLabels[parts[index - 1]] || 'Details';
    }

    crumbs.push({ label, to: path });
  });

  return crumbs;
}

export default function AdminLayout() {
  const crumbs = useBreadcrumb();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
      <AdminSidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top header */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 shrink-0">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500">
            {crumbs.map((crumb, idx) => (
              <span key={crumb.to} className="flex items-center gap-1.5">
                {idx > 0 && <span className="text-gray-300">/</span>}
                {idx === crumbs.length - 1 ? (
                  <span className="text-gray-800 font-medium">{crumb.label}</span>
                ) : (
                  <Link to={crumb.to} className="hover:text-gray-800 transition-colors">
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <NavLink
              to="/admin-panel/profile"
              className={({ isActive }) =>
                `text-xs transition-colors ${isActive ? 'text-gray-800' : 'text-gray-400 hover:text-gray-600'}`
              }
            >
              My profile
            </NavLink>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              View storefront ↗
            </a>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
