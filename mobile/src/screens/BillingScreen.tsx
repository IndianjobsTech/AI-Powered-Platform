import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import api from '../lib/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import LoadingScreen from '../components/LoadingScreen';

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  popular?: boolean;
}

interface Subscription {
  planId: string;
  status: string;
  currentPeriodEnd: string;
  plan: Plan;
}

export default function BillingScreen({ navigation }: any) {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [managing, setManaging] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.getBusinesses();
      const biz = res.data.data?.[0];
      if (biz) {
        setBusinessId(biz.id);
        const [plansRes, subRes] = await Promise.all([
          api.getPlans(),
          api.getSubscription(biz.id),
        ]);
        setPlans(plansRes.data.data || []);
        setSubscription(subRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load billing:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading plans..." />;

  const currentPlanId = subscription?.planId;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Settings</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Billing</Text>
        <Text style={styles.subtitle}>Choose the plan that fits your needs</Text>
      </View>

      {/* Current Plan Info */}
      {subscription && (
        <Card variant="outlined" style={styles.currentPlanCard}>
          <Text style={styles.currentPlanLabel}>Current Plan</Text>
          <View style={styles.currentPlanRow}>
            <Text style={styles.currentPlanName}>
              {subscription.plan?.name || 'Free'}
            </Text>
            <Badge
              label={subscription.status}
              variant={subscription.status === 'ACTIVE' ? 'success' : 'warning'}
              size="md"
            />
          </View>
          {subscription.currentPeriodEnd && (
            <Text style={styles.periodEnd}>
              Renews on{' '}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString([], {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          )}
        </Card>
      )}

      {/* Plan Cards */}
      <View style={styles.plansSection}>
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const isPopular = plan.popular;

          return (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                isCurrent && styles.planCardCurrent,
                isPopular && !isCurrent && styles.planCardPopular,
              ]}
              activeOpacity={0.8}
            >
              {isPopular && !isCurrent && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Most Popular</Text>
                </View>
              )}
              {isCurrent && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>Current</Text>
                </View>
              )}

              <Text style={styles.planName}>{plan.name}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>₹{plan.price}</Text>
                <Text style={styles.interval}>/{plan.interval}</Text>
              </View>

              <View style={styles.featuresList}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Text style={styles.checkmark}>✓</Text>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <Button
                title={isCurrent ? 'Current Plan' : plan.price === 0 ? 'Get Started' : 'Upgrade'}
                onPress={() => {}}
                variant={isCurrent ? 'secondary' : 'primary'}
                disabled={isCurrent}
                style={styles.planButton}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    fontSize: 15,
    color: '#2563EB',
    fontWeight: '500',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  currentPlanCard: {
    margin: 16,
  },
  currentPlanLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  currentPlanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentPlanName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  periodEnd: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
  },
  plansSection: {
    padding: 16,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  planCardCurrent: {
    borderColor: '#2563EB',
    backgroundColor: '#F8FAFF',
  },
  planCardPopular: {
    borderColor: '#7C3AED',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#7C3AED',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  popularText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  currentBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#2563EB',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  price: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
  },
  interval: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 4,
  },
  featuresList: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkmark: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '700',
    marginRight: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  planButton: {
    marginTop: 8,
  },
});
