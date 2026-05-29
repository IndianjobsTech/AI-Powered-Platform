import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import api from '../lib/api';
import Card from '../components/Card';
import Badge from '../components/Badge';
import LoadingScreen from '../components/LoadingScreen';
import EmptyState from '../components/EmptyState';

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: string;
  status: string;
  notes?: string;
  createdAt: string;
  lastContactedAt?: string;
}

interface LeadStats {
  total: number;
  new: number;
  contacted: number;
  qualified: number;
  converted: number;
}

export default function LeadsScreen({ navigation }: any) {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.getBusinesses();
      const biz = res.data.data?.[0];
      if (biz) {
        setBusinessId(biz.id);
        const [leadsRes, statsRes] = await Promise.all([
          api.getLeads(biz.id, { status: filter !== 'all' ? filter : undefined }),
          api.getLeadStats(biz.id),
        ]);
        setLeads(leadsRes.data.data || []);
        setStats(statsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filters = ['all', 'new', 'contacted', 'qualified', 'converted'];
  const statusCounts: Record<string, number> = {
    all: stats?.total || 0,
    new: stats?.new || 0,
    contacted: stats?.contacted || 0,
    qualified: stats?.qualified || 0,
    converted: stats?.converted || 0,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return '#2563EB';
      case 'contacted': return '#D97706';
      case 'qualified': return '#059669';
      case 'converted': return '#7C3AED';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leads</Text>
        <Text style={styles.subtitle}>{stats?.total || 0} total leads</Text>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => { setFilter(f); loadData(); }}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
            <Text style={[styles.filterCount, filter === f && styles.filterCountActive]}>
              {statusCounts[f] || 0}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={leads}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.leadCard}>
            <View style={styles.leadHeader}>
              <View style={styles.leadAvatar}>
                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.leadInfo}>
                <Text style={styles.leadName}>{item.name}</Text>
                <Text style={styles.leadPhone}>{item.phone}</Text>
              </View>
              <Badge label={item.status} variant={item.status === 'converted' ? 'success' : item.status === 'qualified' ? 'info' : item.status === 'contacted' ? 'warning' : 'default'} />
            </View>
            {item.notes && (
              <Text style={styles.leadNotes} numberOfLines={2}>{item.notes}</Text>
            )}
            <View style={styles.leadFooter}>
              <Text style={styles.leadSource}>via {item.source}</Text>
              {item.lastContactedAt && (
                <Text style={styles.leadDate}>Last: {formatDate(item.lastContactedAt)}</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="👥"
            title="No Leads Yet"
            message="Leads from your WhatsApp conversations will appear here"
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
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
  },
  filterText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  filterCount: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  filterCountActive: {
    color: '#BFDBFE',
  },
  list: {
    padding: 16,
  },
  leadCard: {
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
  leadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leadAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  leadPhone: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 1,
  },
  leadNotes: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 18,
  },
  leadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  leadSource: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  leadDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});
