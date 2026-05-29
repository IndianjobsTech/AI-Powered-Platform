'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
import {
  Loader2,
  CheckCircle2,
  Crown,
  Zap,
  Building2,
} from 'lucide-react';

const PLANS_DATA = [
  {
    id: 'starter',
    name: 'Starter',
    price: 499,
    description: 'Perfect for small businesses starting their automation journey',
    features: ['AI auto-replies', 'Basic analytics', 'WhatsApp integration', 'FAQ management'],
    icon: Zap,
    popular: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 999,
    description: 'For growing businesses that need more power',
    features: ['Everything in Starter', 'Advanced analytics', 'Lead scoring', 'Appointment booking', 'Multi-language support', 'Payment reminders'],
    icon: Crown,
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 2499,
    description: 'For large businesses with advanced needs',
    features: ['Everything in Growth', 'Unlimited messages', 'Custom workflows', 'Dedicated support', 'Custom AI training', 'API access', 'CRM integration'],
    icon: Building2,
    popular: false,
  },
];

export default function BillingPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('growth');

  const loadData = async () => {
    try {
      const bizRes = await api.getBusinesses();
      const biz = bizRes.data?.[0];
      if (biz) {
        setBusinessId(biz.id);
        const subRes = await api.get(`/businesses/${biz.id}/subscription`).catch(() => null);
        setSubscription(subRes?.data || null);
      }
    } catch (err) {
      console.error('Failed to load billing info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const handleSubscribe = async (planId: string) => {
    if (!businessId) return;
    try {
      const res = await api.createSubscription(businessId, planId);
      if (res.data?.shortUrl) {
        window.open(res.data.shortUrl, '_blank');
      }
    } catch (err) {
      console.error('Failed to subscribe:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-500 mt-1">Manage your subscription and billing</p>
      </div>

      {/* Current Plan */}
      {subscription && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-200">Current Plan</p>
              <h2 className="text-2xl font-bold mt-1">{subscription.planName}</h2>
              <p className="text-blue-200 mt-1">
                {subscription.status} • {subscription.amount > 0 ? formatCurrency(subscription.amount) + '/month' : 'Free'}
              </p>
            </div>
            <Badge variant="primary" size="lg" className="bg-white/20 text-white border-0">
              {subscription.status}
            </Badge>
          </div>
        </div>
      )}

      {/* Plans */}
      <h2 className="text-lg font-semibold text-gray-900">Choose a Plan</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS_DATA.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          const isCurrentPlan = subscription?.planId === plan.id;

          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={cn(
                'relative bg-white rounded-2xl border-2 p-6 cursor-pointer transition-all hover:shadow-lg',
                isSelected ? 'border-blue-500 shadow-md' : 'border-gray-200',
                plan.popular && 'ring-2 ring-blue-500'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              <div className="text-center mb-6">
                <div className={cn(
                  'inline-flex p-3 rounded-xl mb-3',
                  isSelected ? 'bg-blue-100' : 'bg-gray-100'
                )}>
                  <plan.icon className={cn('h-6 w-6', isSelected ? 'text-blue-600' : 'text-gray-600')} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900">₹{plan.price}</span>
                  <span className="text-gray-500 text-sm">/month</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={isSelected ? 'default' : 'outline'}
                onClick={() => handleSubscribe(plan.id)}
                disabled={isCurrentPlan}
              >
                {isCurrentPlan ? 'Current Plan' : isSelected ? 'Subscribe Now' : 'Select Plan'}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
