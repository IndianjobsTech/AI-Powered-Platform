import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  TextInput,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingScreen from '../components/LoadingScreen';

interface AiSettings {
  autoReplyEnabled: boolean;
  greetingMessage: string;
  workingHours: {
    start: string;
    end: string;
  };
  keywords: string[];
}

export default function SettingsScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [business, setBusiness] = useState<any>(null);
  const [aiSettings, setAiSettings] = useState<AiSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.getBusinesses();
      const biz = res.data.data?.[0];
      if (biz) {
        setBusinessId(biz.id);
        setBusiness(biz);
        const aiRes = await api.getAiSettings(biz.id);
        setAiSettings(aiRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateAiSettings = async (updates: Partial<AiSettings>) => {
    if (!businessId || !aiSettings) return;
    setSaving(true);
    try {
      const newSettings = { ...aiSettings, ...updates };
      await api.updateAiSettings(businessId, newSettings);
      setAiSettings(newSettings);
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  if (loading) return <LoadingScreen />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* Profile Section */}
      <Card variant="outlined" style={styles.card}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.displayName || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
        </View>
      </Card>

      {/* Business Info */}
      {business && (
        <Card variant="outlined" style={styles.card}>
          <Text style={styles.sectionTitle}>Business</Text>
          <View style={styles.businessRow}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{business.name}</Text>
          </View>
          <View style={styles.businessRow}>
            <Text style={styles.label}>Type</Text>
            <Text style={styles.value}>{business.type || 'Other'}</Text>
          </View>
          {business.phone && (
            <View style={styles.businessRow}>
              <Text style={styles.label}>Phone</Text>
              <Text style={styles.value}>{business.phone}</Text>
            </View>
          )}
        </Card>
      )}

      {/* AI Settings */}
      {aiSettings && (
        <Card variant="outlined" style={styles.card}>
          <Text style={styles.sectionTitle}>AI Assistant</Text>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Auto-Reply</Text>
            <Switch
              value={aiSettings.autoReplyEnabled}
              onValueChange={(value) => updateAiSettings({ autoReplyEnabled: value })}
              trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
              thumbColor={aiSettings.autoReplyEnabled ? '#2563EB' : '#9CA3AF'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Greeting Message</Text>
            <TextInput
              style={styles.textArea}
              value={aiSettings.greetingMessage}
              onChangeText={(text) => updateAiSettings({ greetingMessage: text })}
              multiline
              numberOfLines={3}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.workingHoursRow}>
            <View style={styles.timeInput}>
              <Text style={styles.inputLabel}>Start</Text>
              <TextInput
                style={styles.input}
                value={aiSettings.workingHours?.start || '09:00'}
                onChangeText={(text) =>
                  updateAiSettings({
                    workingHours: { ...aiSettings.workingHours, start: text },
                  })
                }
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={styles.timeInput}>
              <Text style={styles.inputLabel}>End</Text>
              <TextInput
                style={styles.input}
                value={aiSettings.workingHours?.end || '18:00'}
                onChangeText={(text) =>
                  updateAiSettings({
                    workingHours: { ...aiSettings.workingHours, end: text },
                  })
                }
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        </Card>
      )}

      {/* Billing */}
      <Card variant="outlined" style={styles.card}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <TouchableOpacity
          style={styles.navLink}
          onPress={() => navigation.navigate('Billing')}
        >
          <Text style={styles.navLinkText}>View Billing & Plans</Text>
          <Text style={styles.chevron}>→</Text>
        </TouchableOpacity>
      </Card>

      {/* Logout */}
      <Button
        title="Sign Out"
        onPress={handleLogout}
        variant="danger"
        size="md"
        style={styles.logoutButton}
      />

      <Text style={styles.version}>Freebuff v1.0.0</Text>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  profileEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  businessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
  },
  value: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 15,
    color: '#374151',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
    fontWeight: '500',
  },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#111827',
  },
  workingHoursRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInput: {
    flex: 1,
  },
  navLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  navLinkText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  chevron: {
    fontSize: 16,
    color: '#2563EB',
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  version: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 24,
  },
});
