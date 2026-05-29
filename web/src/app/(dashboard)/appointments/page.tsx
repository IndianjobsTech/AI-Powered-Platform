'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatTime } from '@/lib/utils';
import {
  Loader2,
  Plus,
  Clock,
  User,
  Phone,
  CheckCircle2,
  XCircle,
  Calendar,
} from 'lucide-react';

export default function AppointmentsPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const loadData = async () => {
    try {
      const bizRes = await api.getBusinesses();
      const biz = bizRes.data?.[0];
      if (biz) {
        setBusinessId(biz.id);
        const aptRes = await api.getAppointments(biz.id);
        setAppointments(aptRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadData();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const updateStatus = async (id: string, status: string) => {
    try {
      if (!businessId) return;
      await api.put(`/businesses/${businessId}/appointments/${id}`, { status });
      setAppointments(appointments.map(apt => apt.id === id ? { ...apt, status } : apt));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const filteredAppointments = filter
    ? appointments.filter(apt => apt.status === filter)
    : appointments;

  const todayAppointments = appointments.filter(apt => {
    const today = new Date().toDateString();
    return new Date(apt.date).toDateString() === today;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500 mt-1">{todayAppointments.length} today</p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          New Appointment
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(filter === status ? '' : status)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              filter === status
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            )}
          >
            {status || 'All'}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      <div className="space-y-3">
        {filteredAppointments.map((apt) => (
          <div
            key={apt.id}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                {/* Date Badge */}
                <div className="w-14 h-14 rounded-xl bg-blue-50 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-blue-600 uppercase">
                    {new Date(apt.date).toLocaleDateString('en-IN', { month: 'short' })}
                  </span>
                  <span className="text-lg font-bold text-blue-700">
                    {new Date(apt.date).getDate()}
                  </span>
                </div>

                {/* Details */}
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{apt.title}</h3>
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {apt.customerName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(apt.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {apt.customerPhone}
                    </span>
                  </div>
                  {apt.description && (
                    <p className="text-sm text-gray-400 mt-2">{apt.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    apt.status === 'CONFIRMED' ? 'success' :
                    apt.status === 'COMPLETED' ? 'primary' :
                    apt.status === 'CANCELLED' ? 'danger' :
                    apt.status === 'NO_SHOW' ? 'default' :
                    'warning'
                  }
                  size="sm"
                >
                  {apt.status}
                </Badge>

                {apt.status === 'PENDING' && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => updateStatus(apt.id, 'CONFIRMED')}
                      className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100"
                      title="Confirm"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => updateStatus(apt.id, 'CANCELLED')}
                      className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                      title="Cancel"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredAppointments.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Calendar className="h-12 w-12 mx-auto mb-3" />
            <p className="text-sm">No appointments found</p>
          </div>
        )}
      </div>
    </div>
  );
}
