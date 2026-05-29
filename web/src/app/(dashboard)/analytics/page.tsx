'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Loader2,
  MessageSquare,
  Users,
  Calendar,
  TrendingUp,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

export default function AnalyticsPage() {
  const [_businessId, setBusinessId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dashboard, setDashboard] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [messageAnalytics, setMessageAnalytics] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [leadAnalytics, setLeadAnalytics] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [appointmentAnalytics, setAppointmentAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const bizRes = await api.getBusinesses();
      const biz = bizRes.data?.[0];
      if (biz) {
        setBusinessId(biz.id);
        const [dash, msgs, leads, apts] = await Promise.all([
          api.getDashboardStats(biz.id),
          api.get(`/businesses/${biz.id}/analytics/messages`),
          api.get(`/businesses/${biz.id}/analytics/leads`),
          api.get(`/businesses/${biz.id}/analytics/appointments`),
        ]);
        setDashboard(dash.data);
        setMessageAnalytics(msgs.data);
        setLeadAnalytics(leads.data);
        setAppointmentAnalytics(apts.data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadData();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const cards = [
    {
      label: 'Response Rate',
      value: `${messageAnalytics?.responseRate || 0}%`,
      subtitle: 'Messages auto-responded',
      icon: MessageSquare,
      trend: 'up',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Lead Conversion',
      value: `${leadAnalytics?.conversionRate || 0}%`,
      subtitle: `${leadAnalytics?.totalLeads || 0} total leads`,
      icon: Users,
      trend: leadAnalytics?.conversionRate > 30 ? 'up' : 'down',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Appointment Completion',
      value: `${appointmentAnalytics?.completionRate || 0}%`,
      subtitle: `${appointmentAnalytics?.completed || 0} completed`,
      icon: Calendar,
      trend: appointmentAnalytics?.completionRate > 70 ? 'up' : 'down',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Total Messages',
      value: String(dashboard?.overview?.totalMessages || 0),
      subtitle: `${dashboard?.overview?.todayMessages || 0} today`,
      icon: TrendingUp,
      trend: 'up',
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-1">Track your business performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={cn('p-2.5 rounded-lg', card.bg)}>
                <card.icon className={cn('h-5 w-5', card.color)} />
              </div>
              <div className={cn(
                'flex items-center gap-0.5 text-xs font-medium',
                card.trend === 'up' ? 'text-green-600' : 'text-red-600'
              )}>
                {card.trend === 'up' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500 mt-1">{card.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Table-based Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Status Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Status</h2>
          {leadAnalytics?.leadsByStatus ? (
            <div className="space-y-3">
              {Object.entries({
                NEW: 'New',
                CONTACTED: 'Contacted',
                QUALIFIED: 'Qualified',
                CONVERTED: 'Converted',
                LOST: 'Lost',
              }).map(([key, label]) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const count = (leadAnalytics.leadsByStatus as any[])?.find((s: any) => s.status === key)?._count || 0;
                const percentage = leadAnalytics.totalLeads > 0 ? (count / leadAnalytics.totalLeads) * 100 : 0;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-24">{label}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          key === 'CONVERTED' ? 'bg-green-500' :
                          key === 'LOST' ? 'bg-red-500' :
                          key === 'QUALIFIED' ? 'bg-purple-500' :
                          key === 'CONTACTED' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-12 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No data available</p>
          )}
        </div>

        {/* Appointment Stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Appointment Overview</h2>
          {appointmentAnalytics ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-700">{appointmentAnalytics.completed || 0}</p>
                  <p className="text-xs text-green-600 mt-1">Completed</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-700">{appointmentAnalytics.cancelled || 0}</p>
                  <p className="text-xs text-red-600 mt-1">Cancelled</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-gray-700">{appointmentAnalytics.noShow || 0}</p>
                  <p className="text-xs text-gray-600 mt-1">No Show</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-700">{appointmentAnalytics.total || 0}</p>
                  <p className="text-xs text-blue-600 mt-1">Total</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
