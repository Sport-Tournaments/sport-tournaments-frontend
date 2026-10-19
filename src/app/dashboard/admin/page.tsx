'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Loading, Alert } from '@/components/ui';
import { useAuthStore } from '@/store';
import { adminService } from '@/services';
import type { AdminActivityItem, DashboardStats } from '@/services/admin.service';

// Static class maps: dynamically built Tailwind classes (`text-${color}-600`) are purged at build time.
const COLOR_CLASSES = {
  blue: { text: 'text-blue-600', bg: 'bg-blue-100', icon: 'text-blue-500' },
  green: { text: 'text-green-600', bg: 'bg-green-100', icon: 'text-green-500' },
  purple: { text: 'text-purple-600', bg: 'bg-purple-100', icon: 'text-purple-500' },
  orange: { text: 'text-orange-600', bg: 'bg-orange-100', icon: 'text-orange-500' },
} as const;

const STATUS_BAR_CLASSES: Record<string, string> = {
  PUBLISHED: 'bg-blue-500',
  ONGOING: 'bg-green-500',
  COMPLETED: 'bg-gray-400',
  CANCELLED: 'bg-red-400',
  DRAFT: 'bg-amber-400',
};

const ACTIVITY_STYLES: Record<AdminActivityItem['type'], { bg: string; label: string; href: (id: string) => string }> = {
  user: { bg: 'bg-blue-100 text-blue-700', label: 'New user', href: () => '/dashboard/admin/users' },
  tournament: { bg: 'bg-green-100 text-green-700', label: 'Tournament created', href: (id) => `/dashboard/tournaments/${id}/edit` },
  registration: { bg: 'bg-orange-100 text-orange-700', label: 'Team registered', href: (id) => `/dashboard/tournaments/${id}` },
};

function formatRelativeTime(value: string | Date, now: Date = new Date()): string {
  const date = new Date(value);
  const diffMs = now.getTime() - date.getTime();
  if (Number.isNaN(diffMs)) return '';
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

function BarList({ rows, colorFor }: { rows: { label: string; count: number; key: string }[]; colorFor?: (key: string) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.key}>
          <div className="flex justify-between text-sm">
            <span className="text-gray-700 truncate">{row.label}</span>
            <span className="font-medium text-gray-900 tabular-nums">{row.count}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-gray-100">
            <div
              className={`h-2 rounded-full ${colorFor?.(row.key) ?? 'bg-[var(--uefa-blue,#0b2b5b)]'}`}
              style={{ width: `${(row.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const QUICK_ACTIONS = [
  { href: '/dashboard/admin/tournaments', title: 'Manage Tournaments', description: 'Edit, feature and moderate tournaments' },
  { href: '/dashboard/admin/users', title: 'Manage Users', description: 'View and manage all users' },
  { href: '/dashboard/admin/clubs', title: 'Manage Clubs', description: 'Verify and manage clubs' },
  { href: '/dashboard/admin/crm', title: 'CRM', description: 'Outreach pipeline for clubs and organizers' },
  { href: '/dashboard/admin/settings', title: 'System Settings', description: 'Configure platform settings' },
];

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStats(await adminService.getDashboardStats());
    } catch {
      // No mock fallback: showing fake numbers to admins is worse than an error.
      setError('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      // Managers only have the CRM part of the admin area.
      router.push(user.role === 'MANAGER' ? '/dashboard/admin/crm' : '/dashboard');
      return;
    }
    fetchStats();
  }, [user, router, fetchStats]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers ?? 0,
      change: `+${stats?.newUsersThisWeek ?? 0} this week · +${stats?.recentUsers ?? 0} in 30 days`,
      color: 'blue' as const,
      href: '/dashboard/admin/users',
    },
    {
      title: 'Tournaments',
      value: stats?.totalTournaments ?? 0,
      change: `${stats?.activeTournaments ?? 0} published · ${stats?.ongoingTournaments ?? 0} live`,
      color: 'green' as const,
      href: '/dashboard/admin/tournaments',
    },
    {
      title: 'Clubs',
      value: stats?.totalClubs ?? 0,
      change: 'Registered',
      color: 'purple' as const,
      href: '/dashboard/admin/clubs',
    },
    {
      title: 'Registrations',
      value: stats?.totalRegistrations ?? 0,
      change: `${stats?.pendingRegistrations ?? 0} pending approval`,
      color: 'orange' as const,
      href: '/dashboard/admin/tournaments',
    },
  ];

  const statusRows = (stats?.tournamentStatuses ?? [])
    .filter((row) => row.count > 0)
    .map((row) => ({ key: row.status, label: t(`tournament.status.${row.status}`), count: row.count }));
  const countryRows = (stats?.topCountries ?? []).map((row) => ({ key: row.country, label: row.country, count: row.count }));
  const trendRows = (stats?.registrationTrend ?? []).map((row) => ({ key: row.month, label: row.month, count: row.count }));
  const activity = stats?.recentActivity ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {error && (
          <Alert variant="error">
            {error}{' '}
            <button type="button" className="underline font-medium" onClick={fetchStats}>
              Retry
            </button>
          </Alert>
        )}

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Platform overview and management</p>
        </div>

        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {statCards.map((stat) => {
              const colors = COLOR_CLASSES[stat.color];
              return (
                <Link key={stat.title} href={stat.href} className="block">
                  <Card>
                    <CardContent className="p-3 sm:p-6">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs sm:text-sm text-gray-500">{stat.title}</p>
                        <span className={`h-2.5 w-2.5 rounded-full ${colors.bg}`} aria-hidden="true" />
                      </div>
                      <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-1 tabular-nums">
                        {stat.value.toLocaleString()}
                      </p>
                      <p className={`text-xs sm:text-sm mt-1 ${colors.text}`}>{stat.change}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tournaments by status</CardTitle>
              </CardHeader>
              <CardContent>
                {statusRows.length > 0 ? (
                  <BarList rows={statusRows} colorFor={(key) => STATUS_BAR_CLASSES[key] ?? 'bg-gray-400'} />
                ) : (
                  <p className="text-sm text-gray-500">No data yet</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top countries</CardTitle>
              </CardHeader>
              <CardContent>
                {countryRows.length > 0 ? <BarList rows={countryRows} /> : <p className="text-sm text-gray-500">No data yet</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Team registrations (6 months)</CardTitle>
              </CardHeader>
              <CardContent>
                {trendRows.length > 0 ? <BarList rows={trendRows} /> : <p className="text-sm text-gray-500">No data yet</p>}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{action.title}</p>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <p className="text-sm text-gray-500">No recent activity</p>
              ) : (
                <ul className="space-y-3">
                  {activity.map((item, index) => {
                    const style = ACTIVITY_STYLES[item.type] ?? ACTIVITY_STYLES.user;
                    return (
                      <li key={`${item.type}-${item.id}-${index}`} className="pb-3 border-b border-gray-200 last:border-0">
                        <Link href={style.href(item.id)} className="flex items-start gap-3 hover:opacity-80">
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${style.bg}`}>
                            {style.label}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                            {item.subtitle && <p className="text-sm text-gray-500 truncate">{item.subtitle}</p>}
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap">{formatRelativeTime(item.createdAt)}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
