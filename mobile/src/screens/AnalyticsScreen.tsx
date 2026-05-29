import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import api from '../lib/api';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import LoadingScreen from '../components/LoadingScreen';

interface AnalyticsData {
  overview: {
    totalMessages: number;
    todayMessages: number;
    totalLeads: number;
    newLeadsThisMonth: number;
    totalAppointments: number;
    todayAppointments: number;
    conversionRate: number;
  };
  messageTrend: { date: string; count: number }[];
  leadSources: { source: string; count: number }[];
  appointmentStats: { status: string; count: number }[];
}

export default function AnalyticsScreen() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.getBusinesses();
      const biz = res.data.data?.[0];
      if (biz) {
        setBusinessId(biz.id);
        const statsRes = await api.getDashboardStats(biz.id);
        setData(statsRes.data.data);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const chartConfig = {
    backgroundColor: '#fff',
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalCount: 0,
    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: { borderRadius: 12 },
    propsForDots: { r: '4', strokeWidth: '2', stroke: '#2563EB' },
    barPercentage: 0.6,
  };

  const screenWidth = Dimensions.get('window').width - 64;

  if (loading) return <LoadingScreen message="Loading analytics..." />;

  if (!businessId) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Analytics</Text>
        <Text style={styles.emptyText}>Set up your business to see analytics</Text>
      </View>
    );
  }

  const trendData = data?.messageTrend?.slice(-7)?.length
    ? {
        labels: data.messageTrend.slice(-7).map((d) => {
          const date = new Date(d.date);
          return date.toLocaleDateString([], { weekday: 'short' });
        }),
        datasets: [{ data: data.messageTrend.slice(-7).map((d) => d.count) }],
      }
    : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Your business performance</Text>
      </View>

      {/* Overview Stats */}
      <View style={styles.statsSection}>
        <StatCard
          label="Messages Today"
          value={data?.overview?.todayMessages || 0}
          subtitle={`${data?.overview?.totalMessages || 0} total`}
          color="#2563EB"
          icon="💬"
        />
        <StatCard
          label="New Leads This Month"
          value={data?.overview?.newLeadsThisMonth || 0}
          subtitle={`${data?.overview?.totalLeads || 0} total leads`}
          color="#7C3AED"
          icon="👥"
        />
        <StatCard
          label="Appointments Today"
          value={data?.overview?.todayAppointments || 0}
          subtitle={`${data?.overview?.totalAppointments || 0} total`}
          color="#059669"
          icon="📅"
        />
        <StatCard
          label="Conversion Rate"
          value={data?.overview?.conversionRate ? `${data.overview.conversionRate}%` : '0%'}
          color="#EA580C"
          icon="📈"
        />
      </View>

      {/* Message Trend Chart */}
      {trendData && (
        <Card style={styles.chartCard} variant="outlined">
          <Text style={styles.chartTitle}>Message Trend (7 days)</Text>
          <LineChart
            data={trendData}
            width={screenWidth}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </Card>
      )}

      {/* Lead Sources */}
      {data?.leadSources && data.leadSources.length > 0 && (
        <Card style={styles.chartCard} variant="outlined">
          <Text style={styles.chartTitle}>Lead Sources</Text>
          {data.leadSources.map((source, index) => {
            const maxCount = Math.max(...data!.leadSources!.map((s) => s.count));
            return (
              <View key={index} style={styles.sourceRow}>
                <Text style={styles.sourceLabel}>{source.source}</Text>
                <View style={styles.sourceBarContainer}>
                  <View
                    style={[
                      styles.sourceBar,
                      {
                        width: `${maxCount > 0 ? (source.count / maxCount) * 100 : 0}%`,
                        backgroundColor: ['#2563EB', '#7C3AED', '#059669', '#EA580C'][index % 4],
                      },
                    ]}
                  />
                </View>
                <Text style={styles.sourceCount}>{source.count}</Text>
              </View>
            );
          })}
        </Card>
      )}

      {/* Appointment Status Distribution */}
      {data?.appointmentStats && data.appointmentStats.length > 0 && (
        <Card style={styles.chartCard} variant="outlined">
          <Text style={styles.chartTitle}>Appointment Status</Text>
          <View style={styles.statusGrid}>
            {data.appointmentStats.map((stat, index) => (
              <View key={index} style={styles.statusItem}>
                <Text style={styles.statusValue}>{stat.count}</Text>
                <Text style={styles.statusLabel}>{stat.status}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
  },
  statsSection: {
    padding: 16,
  },
  chartCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 12,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sourceLabel: {
    width: 80,
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  sourceBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  sourceBar: {
    height: '100%',
    borderRadius: 4,
  },
  sourceCount: {
    width: 30,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'right',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusItem: {
    flex: 1,
    minWidth: 60,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  statusValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  statusLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    textTransform: 'capitalize',
  },
});
