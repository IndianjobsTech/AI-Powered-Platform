'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn, formatDateTime, getBusinessTypeLabel } from '@/lib/utils';
import {
  MessageSquare,
  Users,
  Calendar,
  Bot,
  TrendingUp,
  ArrowRight,
  Building2,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardData {
  overview: {
    totalMessages: number;
    todayMessages: number;
    totalLeads: number;
    newLeadsThisMonth: number;
    totalAppointments: number;
    todayAppointments: number;
    activeWorkflows: number;
  };
  upcomingAppointments: Array<{
    id: string;
    customerName: string;
    title: string;
    date: string;
    status: string;
  }>;
}

export default function DashboardPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [business, setBusiness] = useState<any>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      const bizRes = await api.getBusinesses();
      const businesses = bizRes.data;
      if (businesses && businesses.length > 0) {
        const biz = businesses[0];
        setBusiness(biz);
        setBusinessId(biz.id);
        const statsRes = await api.getDashboardStats(biz.id);
        setData(statsRes.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!businessId) {
    return <OnboardingWizard />;
  }

  const stats = [
    {
      label: 'Messages Today',
      value: data?.overview.todayMessages || 0,
      total: data?.overview.totalMessages || 0,
      icon: MessageSquare,
      color: 'bg-blue-500',
      bg: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: 'Total Leads',
      value: data?.overview.totalLeads || 0,
      subtitle: `${data?.overview.newLeadsThisMonth || 0} this month`,
      icon: Users,
      color: 'bg-purple-500',
      bg: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      label: "Today's Appointments",
      value: data?.overview.todayAppointments || 0,
      total: data?.overview.totalAppointments || 0,
      icon: Calendar,
      color: 'bg-green-500',
      bg: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      label: 'Active Workflows',
      value: data?.overview.activeWorkflows || 0,
      icon: Bot,
      color: 'bg-orange-500',
      bg: 'bg-orange-50',
      textColor: 'text-orange-600',
      href: '/settings',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">{business?.name || 'Your Business'}</p>
        </div>
        <Link href="/settings">
          <Button variant="outline" size="sm">
            <Building2 className="h-4 w-4" />
            Settings
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn('p-2.5 rounded-lg', stat.bg)}>
                <stat.icon className={cn('h-5 w-5', stat.textColor)} />
              </div>
              <span className={cn('text-xs font-medium', stat.textColor)}>
                {stat.total !== undefined ? `${Math.round((stat.value / Math.max(stat.total, 1)) * 100)}%` : ''}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">
              {stat.label}
              {stat.subtitle && <span className="block text-xs text-gray-400">{stat.subtitle}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions & Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/whatsapp"
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <MessageSquare className="h-6 w-6 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Send Message</span>
            </Link>
            <Link
              href="/leads"
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"
            >
              <Users className="h-6 w-6 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">View Leads</span>
            </Link>
            <Link
              href="/appointments"
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
            >
              <Calendar className="h-6 w-6 text-green-600" />
              <span className="text-sm font-medium text-green-700">Appointments</span>
            </Link>
            <Link
              href="/analytics"
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors"
            >
              <TrendingUp className="h-6 w-6 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">Analytics</span>
            </Link>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h2>
            <Link href="/appointments" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all
            </Link>
          </div>
          {data?.upcomingAppointments && data.upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {data.upcomingAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{apt.customerName}</p>
                    <p className="text-xs text-gray-500">{apt.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{formatDateTime(apt.date)}</p>
                    <Badge
                      variant={
                        apt.status === 'CONFIRMED' ? 'success' :
                        apt.status === 'PENDING' ? 'warning' : 'default'
                      }
                      size="sm"
                    >
                      {apt.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Calendar className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No upcoming appointments</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Onboarding Wizard for new users
function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const { user: _user } = useAuth();

  return (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-2xl font-bold shadow-lg mb-4">
          FB
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome to Freebuff!</h1>
        <p className="text-gray-500 mt-2">Let&apos;s set up your business automation</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="flex items-center justify-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === step ? 'w-8 bg-blue-600' : 'w-2 bg-gray-300'
              )}
            />
          ))}
        </div>

        <OnboardingForm step={step} onNext={() => setStep(step + 1)} onComplete={() => window.location.reload()} />
      </div>
    </div>
  );
}

function OnboardingForm({ step, onNext, onComplete }: { step: number; onNext: () => void; onComplete: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'OTHER',
    phone: '',
    address: '',
    city: '',
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.createBusiness({
        name: formData.businessName,
        type: formData.businessType,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
      });
      onComplete();
    } catch (err) {
      console.error('Failed to create business:', err);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    // Step 1: Business Info
    <div key={0} className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Business Details</h2>
      <p className="text-sm text-gray-500">Tell us about your business</p>
      <div className="space-y-4 mt-4">
        <Input
          label="Business Name"
          value={formData.businessName}
          onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
          placeholder="e.g., Sharma Clinic"
          required
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Type</label>
          <select
            className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.businessType}
            onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
          >
            <option value="CLINIC">Clinic</option>
            <option value="SALON">Salon & Spa</option>
            <option value="COACHING_CENTER">Coaching Center</option>
            <option value="RESTAURANT">Restaurant</option>
            <option value="GYM">Gym & Fitness</option>
            <option value="REAL_ESTATE">Real Estate</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <Input
          label="Phone Number"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+91 9876543210"
        />
      </div>
      <Button onClick={onNext} className="w-full mt-4">
        Continue <ArrowRight className="h-4 w-4" />
      </Button>
    </div>,

    // Step 2: Address
    <div key={1} className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Location</h2>
      <p className="text-sm text-gray-500">Where is your business located?</p>
      <div className="space-y-4 mt-4">
        <Input
          label="Address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Street address"
        />
        <Input
          label="City"
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          placeholder="e.g., Mumbai"
        />
      </div>
      <Button onClick={onNext} className="w-full mt-4">
        Continue <ArrowRight className="h-4 w-4" />
      </Button>
    </div>,

    // Step 3: Confirmation
    <div key={2} className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Almost there!</h2>
      <p className="text-sm text-gray-500">Review your details and get started</p>
      <div className="bg-gray-50 rounded-lg p-4 space-y-2 mt-4">
        <p className="text-sm"><strong>Business:</strong> {formData.businessName}</p>
        <p className="text-sm"><strong>Type:</strong> {getBusinessTypeLabel(formData.businessType)}</p>
        <p className="text-sm"><strong>Phone:</strong> {formData.phone}</p>
        {formData.city && <p className="text-sm"><strong>City:</strong> {formData.city}</p>}
      </div>
      <Button onClick={handleSubmit} className="w-full mt-4" loading={loading}>
        Start Automating <ArrowRight className="h-4 w-4" />
      </Button>
    </div>,
  ];

  return <>{steps[step]}</>;
}
