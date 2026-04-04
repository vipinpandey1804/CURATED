import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, BarChart3, CalendarDays, ChevronRight, RotateCcw, TrendingUp, Users } from 'lucide-react';
import { adminUserService } from '../../services/adminUserService';
import { AdminButton } from '../../components/admin/ui/AdminButton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/admin/ui/AdminSelect';

const PERIOD_OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'custom', label: 'Custom' },
];

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

function formatDateInput(date) {
  return date.toISOString().slice(0, 10);
}

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

function getVisibleLabels(data) {
  const length = data.length || 1;
  const step = length <= 10 ? 1 : length <= 31 ? 5 : 10;

  return data.map((point, index) => ({
    ...point,
    label: index % step === 0 || index === data.length - 1 ? formatChartDate(point.date) : '',
  }));
}

function EmptyGraphState({ message }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/80 text-sm text-gray-400">
      {message}
    </div>
  );
}

function SummaryLink({ icon: Icon, label, value, to }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
    >
      <Icon className="h-4 w-4 text-gray-500" />
      <span className="font-medium text-gray-600">{label}</span>
      <span className="text-gray-900">{value}</span>
      <ChevronRight className="h-4 w-4 text-gray-400" />
    </Link>
  );
}

function ChartCard({ title, subtitle, children, accent }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {accent && (
          <div className="rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
            {accent}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function TrendAreaChart({ data, dataKey, stroke, fill }) {
  if (!data.length) {
    return <EmptyGraphState message="No trend data available for this range." />;
  }

  const width = 720;
  const height = 240;
  const padding = 20;
  const values = data.map((point) => Number(point[dataKey] || 0));
  const maxValue = Math.max(...values, 1);
  const stepX = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;
  const points = data.map((point, index) => {
    const value = Number(point[dataKey] || 0);
    const x = padding + (index * stepX);
    const y = height - padding - ((value / maxValue) * (height - padding * 2));
    return { x, y };
  });
  const pointList = points.map(({ x, y }) => `${x},${y}`).join(' ');
  const polylinePoints = points.map(({ x, y }) => `${x} ${y}`).join(' L ');
  const areaPath = points.length
    ? `M ${points[0].x} ${height - padding} L ${polylinePoints} L ${points.at(-1).x} ${height - padding} Z`
    : '';
  const visibleLabels = getVisibleLabels(data);

  return (
    <div className="space-y-3">
      <div className="h-60 rounded-xl bg-slate-950/[0.03] p-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" role="img" aria-label={`${dataKey} trend`}>
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
          {points.map((point, index) => (
            <circle key={`${data[index].date}-${dataKey}`} cx={point.x} cy={point.y} r="3.5" fill={stroke} />
          ))}
        </svg>
      </div>
      <div
        className="grid gap-2 text-xs text-gray-500"
        style={{ gridTemplateColumns: `repeat(${visibleLabels.length}, minmax(0, 1fr))` }}
      >
        {visibleLabels.map((point) => (
          <div key={point.date} className="text-center">
            {point.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniBarChart({ data, dataKey, color }) {
  if (!data.length) {
    return <EmptyGraphState message="No bar-chart data available for this range." />;
  }

  const maxValue = Math.max(...data.map((point) => Number(point[dataKey] || 0)), 1);
  const visibleLabels = getVisibleLabels(data);

  return (
    <div className="space-y-4">
      <div className="h-64 rounded-xl bg-slate-950/[0.03] p-4">
        <div
          className="grid h-full items-end gap-2"
          style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}
        >
          {data.map((point) => {
            const value = Number(point[dataKey] || 0);
            const height = `${Math.max((value / maxValue) * 100, value > 0 ? 8 : 2)}%`;

            return (
              <div key={`${point.date}-${dataKey}`} className="flex h-full flex-col justify-end">
                <div
                  className="rounded-t-md transition-all"
                  style={{
                    height,
                    background: `linear-gradient(180deg, ${color}, ${color}cc)`,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div
        className="grid gap-2 text-xs text-gray-500"
        style={{ gridTemplateColumns: `repeat(${visibleLabels.length}, minmax(0, 1fr))` }}
      >
        {visibleLabels.map((point) => (
          <div key={point.date} className="text-center">
            {point.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ items, centerLabel }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  if (!total) {
    return <EmptyGraphState message="No orders are available for this range." />;
  }

  let current = 0;
  const gradient = `conic-gradient(${items.map((item) => {
    const start = (current / total) * 360;
    current += item.value;
    const end = (current / total) * 360;
    return `${item.color} ${start}deg ${end}deg`;
  }).join(', ')})`;

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
      <div className="relative h-44 w-44 shrink-0 rounded-full" style={{ background: gradient }}>
        <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white">
          <span className="text-3xl font-semibold text-gray-900">{total}</span>
          <span className="text-xs uppercase tracking-[0.2em] text-gray-500">{centerLabel}</span>
        </div>
      </div>
      <div className="flex-1 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
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

function ProgressList({ items, emptyMessage }) {
  const maxValue = Math.max(...items.map((item) => item.value), 0);

  if (!maxValue) {
    return <EmptyGraphState message={emptyMessage} />;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label} className="space-y-2">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-gray-600">{item.label}</span>
            <span className="font-semibold text-gray-900">{item.value}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden bg-gray-100">
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
  const today = new Date();
  const defaultStart = new Date(today);
  defaultStart.setDate(today.getDate() - 6);

  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    period: 'week',
    startDate: formatDateInput(defaultStart),
    endDate: formatDateInput(today),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const params = { period: filters.period };
    if (filters.period === 'custom') {
      params.start_date = filters.startDate;
      params.end_date = filters.endDate;
    }

    adminUserService.getStats(params)
      .then(setStats)
      .catch((e) => setError(e.response?.data?.detail || 'Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, [filters]);

  const handlePeriodChange = (value) => {
    setFilters((current) => ({ ...current, period: value }));
  };

  const handleReset = () => {
    setFilters({
      period: 'week',
      startDate: formatDateInput(defaultStart),
      endDate: formatDateInput(today),
    });
  };

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
  const orderStatusItems = Object.entries(stats?.ordersByStatus || {})
    .map(([label, value]) => ({
      label,
      value,
      color: STATUS_COLORS[label] || '#64748b',
    }))
    .filter((item) => item.value > 0);
  const returnStatusItems = Object.entries(stats?.returnsByStatus || {})
    .map(([label, value]) => ({
      label,
      value,
      color: STATUS_COLORS[label] || '#94a3b8',
    }))
    .filter((item) => item.value > 0);

  const revenueInRange = stats?.summary?.revenueInRange || 0;
  const ordersInRange = stats?.summary?.ordersInRange || 0;
  const usersInRange = stats?.summary?.usersInRange || 0;
  const returnsInRange = stats?.summary?.returnsInRange || 0;
  const periodLabel = PERIOD_OPTIONS.find((item) => item.value === filters.period)?.label || 'Week';
  const appliedStart = stats?.appliedFilters?.startDate;
  const appliedEnd = stats?.appliedFilters?.endDate;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Graph-only analytics for your admin panel</p>
        </div>

        <div className="flex max-w-full flex-col items-stretch gap-3 lg:items-end">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5">
              <CalendarDays className="h-4 w-4 text-gray-500" />
              <Select value={filters.period} onValueChange={handlePeriodChange}>
                <SelectTrigger className="h-auto min-w-[120px] border-0 bg-transparent px-0 py-0 text-sm shadow-none focus:ring-0">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filters.period === 'custom' && (
              <>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters((current) => ({ ...current, startDate: e.target.value }))}
                  className="h-10 rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters((current) => ({ ...current, endDate: e.target.value }))}
                  className="h-10 rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </>
            )}

            <AdminButton variant="outline" className="rounded-full" onClick={handleReset}>
              Reset
            </AdminButton>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <SummaryLink icon={TrendingUp} label="Revenue" value={fmtCurrency(revenueInRange)} to="/admin-panel/orders" />
            <SummaryLink icon={BarChart3} label="Orders" value={ordersInRange} to="/admin-panel/orders" />
            <SummaryLink icon={Users} label="Users" value={usersInRange} to="/admin-panel/users" />
            <SummaryLink icon={RotateCcw} label="Returns" value={returnsInRange} to="/admin-panel/returns" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr,0.95fr]">
        <ChartCard
          title="Revenue Trend"
          subtitle={filters.period === 'custom' && appliedStart && appliedEnd
            ? `${appliedStart} to ${appliedEnd} revenue trend`
            : `${periodLabel} revenue trend`}
          accent={fmtCurrency(revenueInRange)}
        >
          <TrendAreaChart data={salesTrend} dataKey="revenue" stroke="#2563eb" fill="rgba(37, 99, 235, 0.14)" />
        </ChartCard>

        <ChartCard
          title="Order Volume"
          subtitle={`${ordersInRange} orders in the selected range`}
          accent={`${ordersInRange} orders`}
        >
          <MiniBarChart data={salesTrend} dataKey="orders" color="#f59e0b" />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr,1.2fr]">
        <ChartCard
          title="Customer Growth"
          subtitle={`${usersInRange} users joined in the selected range`}
          accent={`${stats?.newUsersToday || 0} today`}
        >
          <MiniBarChart data={userGrowth} dataKey="users" color="#0f766e" />
        </ChartCard>

        <ChartCard
          title="Order Mix"
          subtitle="Status distribution for the selected range"
          accent={periodLabel}
        >
          <DonutChart items={orderStatusItems} centerLabel="Orders" />
        </ChartCard>
      </div>

      <ChartCard
        title="Returns Queue"
        subtitle="Status distribution for the selected range"
        accent={`${returnsInRange} returns`}
      >
        <ProgressList items={returnStatusItems} emptyMessage="No returns match the selected range." />
      </ChartCard>
    </div>
  );
}
