import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, Users, RotateCcw, TrendingUp, AlertCircle } from 'lucide-react';
import { adminUserService } from '../../services/adminUserService';
import { adminOrderService } from '../../services/adminOrderService';
import { AdminBadge, statusVariant } from '../../components/admin/ui/AdminBadge';

const STATUS_COLORS = {
  PENDING: '#f59e0b',
  CONFIRMED: '#2563eb',
  PROCESSING: '#7c3aed',
  SHIPPED: '#0f766e',
  DELIVERED: '#16a34a',
  CANCELLED: '#dc2626',
  REQUESTED: '#f59e0b',
  APPROVED: '#2563eb',
  REJECTED: '#dc2626',
  RECEIVED: '#0f766e',
  REFUNDED: '#16a34a',
};

function fmtCurrency(value) {
  return value?.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }) ?? '-';
}

function formatChartDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
  });
}

function StatCard({ label, value, icon: Icon, to, color = 'blue' }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };

  const card = (
    <div className="bg-white rounded-lg border border-gray-200 p-5 flex items-center gap-4 hover:shadow-sm transition-shadow">
      <div className={`p-3 rounded-lg ${colorMap[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-semibold text-gray-900">{value ?? '-'}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );

  return to ? <Link to={to}>{card}</Link> : card;
}

function ChartCard({ title, subtitle, children, action }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function TrendAreaChart({ data, dataKey, stroke, fill }) {
  const width = 520;
  const height = 220;
  const padding = 18;
  const values = data.map((point) => Number(point[dataKey] || 0));
  const maxValue = Math.max(...values, 1);
  const stepX = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;
  const points = data.map((point, index) => {
    const value = Number(point[dataKey] || 0);
    const x = padding + (index * stepX);
    const y = height - padding - ((value / maxValue) * (height - padding * 2));
    return { x, y, label: formatChartDate(point.date) };
  });
  const pointList = points.map(({ x, y }) => `${x},${y}`).join(' ');
  const polylinePoints = points.map(({ x, y }) => `${x} ${y}`).join(' L ');
  const areaPath = points.length
    ? `M ${points[0].x} ${height - padding} L ${polylinePoints} L ${points.at(-1).x} ${height - padding} Z`
    : '';

  return (
    <div className="space-y-3">
      <div className="h-56 rounded-xl bg-slate-950/[0.03] p-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" role="img" aria-label={`${dataKey} trend`}>
          {[0, 1, 2, 3].map((step) => {
            const y = padding + (((height - padding * 2) / 3) * step);
            return (
              <line
                key={step}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#e5e7eb"
                strokeDasharray="4 6"
              />
            );
          })}
          {points.length > 1 && (
            <>
              <path d={areaPath} fill={fill} />
              <polyline
                fill="none"
                stroke={stroke}
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={pointList}
              />
            </>
          )}
          {points.map((point) => (
            <circle key={point.label} cx={point.x} cy={point.y} r="4" fill={stroke} />
          ))}
        </svg>
      </div>
      <div className="grid grid-cols-7 gap-2 text-xs text-gray-500">
        {data.map((point) => (
          <div key={point.date} className="text-center">
            {formatChartDate(point.date)}
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniBarChart({ data, dataKey, color }) {
  const maxValue = Math.max(...data.map((point) => Number(point[dataKey] || 0)), 1);

  return (
    <div className="space-y-4">
      <div className="h-56 rounded-xl bg-slate-950/[0.03] p-4">
        <div className="grid h-full grid-cols-7 items-end gap-3">
          {data.map((point) => {
            const value = Number(point[dataKey] || 0);
            const height = `${Math.max((value / maxValue) * 100, value > 0 ? 12 : 4)}%`;

            return (
              <div key={point.date} className="flex h-full flex-col justify-end gap-2">
                <div
                  className="rounded-t-md transition-all"
                  style={{
                    height,
                    background: `linear-gradient(180deg, ${color}, ${color}cc)`,
                  }}
                />
                <span className="text-center text-xs text-gray-500">{formatChartDate(point.date)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DonutChart({ items }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  let current = 0;
  const gradient = items.length
    ? `conic-gradient(${items.map((item) => {
      const start = total ? (current / total) * 360 : 0;
      current += item.value;
      const end = total ? (current / total) * 360 : 0;
      return `${item.color} ${start}deg ${end}deg`;
    }).join(', ')})`
    : '#e5e7eb';

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
      <div className="relative h-44 w-44 shrink-0 rounded-full" style={{ background: gradient }}>
        <div className="absolute inset-5 rounded-full bg-white flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold text-gray-900">{total}</span>
          <span className="text-xs uppercase tracking-[0.2em] text-gray-500">Orders</span>
        </div>
      </div>
      <div className="flex-1 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-gray-600">{item.label}</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressList({ items }) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label} className="space-y-2">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-gray-600">{item.label}</span>
            <span className="font-semibold text-gray-900">{item.value}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      adminUserService.getStats(),
      adminOrderService.getOrders({ page_size: 8 }),
    ])
      .then(([statsData, ordersData]) => {
        setStats(statsData);
        setRecentOrders(ordersData.results || ordersData);
      })
      .catch((e) => setError(e.response?.data?.detail || 'Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-400 text-sm">Loading dashboard...</div>;
  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600 text-sm">
        <AlertCircle className="h-4 w-4" /> {error}
      </div>
    );
  }

  const salesTrend = stats?.salesTrend || [];
  const userGrowth = stats?.userGrowth || [];
  const orderStatusItems = Object.entries(stats?.ordersByStatus || {}).map(([label, value]) => ({
    label,
    value,
    color: STATUS_COLORS[label] || '#64748b',
  }));
  const returnStatusItems = Object.entries(stats?.returnsByStatus || {}).map(([label, value]) => ({
    label,
    value,
    color: STATUS_COLORS[label] || '#94a3b8',
  }));
  const weeklyRevenue = salesTrend.reduce((sum, point) => sum + Number(point.revenue || 0), 0);
  const weeklyOrders = salesTrend.reduce((sum, point) => sum + Number(point.orders || 0), 0);
  const weeklyUsers = userGrowth.reduce((sum, point) => sum + Number(point.users || 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your store</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Products" value={stats?.totalProducts} icon={Package} to="/admin-panel/products" color="blue" />
        <StatCard label="Total Orders" value={stats?.totalOrders} icon={ShoppingCart} to="/admin-panel/orders" color="green" />
        <StatCard label="Pending Returns" value={stats?.pendingReturns} icon={RotateCcw} to="/admin-panel/returns" color="orange" />
        <StatCard label="Total Users" value={stats?.totalUsers} icon={Users} to="/admin-panel/users" color="blue" />
      </div>

      {stats?.revenue && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Revenue Today', value: fmtCurrency(stats.revenue.today) },
            { label: 'Last 7 Days', value: fmtCurrency(stats.revenue.last7Days) },
            { label: 'Last 30 Days', value: fmtCurrency(stats.revenue.last30Days) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <TrendingUp className="h-4 w-4" /> {label}
              </div>
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr,0.9fr] gap-6">
        <ChartCard
          title="Revenue Trend"
          subtitle={`${fmtCurrency(weeklyRevenue)} from ${weeklyOrders} orders in the last 7 days`}
          action={<span className="text-xs font-medium text-emerald-600">Updated daily</span>}
        >
          <TrendAreaChart data={salesTrend} dataKey="revenue" stroke="#2563eb" fill="rgba(37, 99, 235, 0.14)" />
        </ChartCard>

        <ChartCard
          title="Customer Growth"
          subtitle={`${weeklyUsers} new users joined in the last 7 days`}
          action={<span className="text-xs font-medium text-blue-600">{stats?.newUsersToday || 0} today</span>}
        >
          <MiniBarChart data={userGrowth} dataKey="users" color="#0f766e" />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title="Order Mix"
          subtitle="Distribution of all order statuses"
          action={(
            <Link to="/admin-panel/orders" className="text-xs text-blue-600 hover:underline">
              Manage orders
            </Link>
          )}
        >
          <DonutChart items={orderStatusItems} />
        </ChartCard>

        <ChartCard
          title="Returns Queue"
          subtitle="Current return statuses across the store"
          action={(
            <Link to="/admin-panel/returns" className="text-xs text-blue-600 hover:underline">
              Review returns
            </Link>
          )}
        >
          <ProgressList items={returnStatusItems} />
        </ChartCard>
      </div>

      {orderStatusItems.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Orders by Status</h2>
          <div className="flex flex-wrap gap-3">
            {orderStatusItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <AdminBadge variant={statusVariant(item.label)}>{item.label}</AdminBadge>
                <span className="text-sm font-medium text-gray-700">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Recent Orders</h2>
          <Link to="/admin-panel/orders" className="text-xs text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Order', 'Customer', 'Total', 'Status', 'Date'].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">
                    <Link to={`/admin-panel/orders/${order.id}`} className="hover:text-blue-600">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{order.userName || order.userEmail}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">
                    {order.total} {order.totalCurrency}
                  </td>
                  <td className="px-4 py-3">
                    <AdminBadge variant={statusVariant(order.status)}>{order.status}</AdminBadge>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
