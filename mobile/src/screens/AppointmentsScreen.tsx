import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import api from '../lib/api';
import Badge from '../components/Badge';
import LoadingScreen from '../components/LoadingScreen';
import EmptyState from '../components/EmptyState';

interface Appointment {
  id: string;
  customerName: string;
  title: string;
  date: string;
  status: string;
  notes?: string;
}

export default function AppointmentsScreen() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('upcoming');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      const res = await api.getBusinesses();
      const biz = res.data.data?.[0];
      if (biz) {
        setBusinessId(biz.id);
        const params: any = {};
        if (filter === 'upcoming') params.status = 'CONFIRMED';
        else if (filter === 'pending') params.status = 'PENDING';
        else if (filter === 'completed') params.status = 'COMPLETED';
        const aptRes = await api.getAppointments(biz.id, params);
        setAppointments(aptRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'success' as const;
      case 'PENDING': return 'warning' as const;
      case 'COMPLETED': return 'info' as const;
      case 'CANCELLED': return 'danger' as const;
      default: return 'default' as const;
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Appointments</Text>
        <Text style={styles.subtitle}>{appointments.length} appointments</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {['upcoming', 'pending', 'completed'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.appointmentCard}>
            <View style={styles.dateIndicator}>
              <Text style={styles.dateDay}>
                {new Date(item.date).getDate()}
              </Text>
              <Text style={styles.dateMonth}>
                {new Date(item.date).toLocaleDateString([], { month: 'short' })}
              </Text>
            </View>
            <View style={styles.appointmentContent}>
              <Text style={styles.customerName}>{item.customerName}</Text>
              <Text style={styles.appointmentTitle}>{item.title}</Text>
              <Text style={styles.appointmentTime}>{formatDate(item.date)}</Text>
            </View>
            <Badge label={item.status} variant={getBadgeVariant(item.status)} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="📅"
            title="No Appointments"
            message={`No ${filter} appointments found`}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 12,
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  filterTabActive: {
    backgroundColor: '#2563EB',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  list: {
    padding: 16,
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  dateIndicator: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  dateDay: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563EB',
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: '600',
    color: '#60A5FA',
    textTransform: 'uppercase',
  },
  appointmentContent: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  appointmentTitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 1,
  },
  appointmentTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
