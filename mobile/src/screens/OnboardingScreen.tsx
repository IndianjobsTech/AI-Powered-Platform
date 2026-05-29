import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import api from '../lib/api';
import Button from '../components/Button';
import Card from '../components/Card';

interface BusinessForm {
  businessName: string;
  businessType: string;
  phone: string;
  address: string;
  city: string;
}

const BUSINESS_TYPES = [
  { value: 'CLINIC', label: 'Clinic' },
  { value: 'SALON', label: 'Salon & Spa' },
  { value: 'COACHING_CENTER', label: 'Coaching Center' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'GYM', label: 'Gym & Fitness' },
  { value: 'REAL_ESTATE', label: 'Real Estate' },
  { value: 'OTHER', label: 'Other' },
];

export default function OnboardingScreen({ navigation }: any) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<BusinessForm>({
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
        name: form.businessName,
        type: form.businessType,
        phone: form.phone,
        address: form.address,
        city: form.city,
      });
      navigation.goBack();
    } catch (err) {
      console.error('Failed to create business:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View>
            <Text style={styles.stepTitle}>Business Details</Text>
            <Text style={styles.stepSubtitle}>Tell us about your business</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business Name</Text>
              <TextInput
                style={styles.input}
                value={form.businessName}
                onChangeText={(text) => setForm({ ...form, businessName: text })}
                placeholder="e.g., Sharma Clinic"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business Type</Text>
              <View style={styles.typeGrid}>
                {BUSINESS_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeChip,
                      form.businessType === type.value && styles.typeChipActive,
                    ]}
                    onPress={() => setForm({ ...form, businessType: type.value })}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        form.businessType === type.value && styles.typeChipTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={form.phone}
                onChangeText={(text) => setForm({ ...form, phone: text })}
                placeholder="+91 9876543210"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>

            <Button title="Continue" onPress={() => setStep(1)} size="lg" style={styles.nextButton} />
          </View>
        );

      case 1:
        return (
          <View>
            <Text style={styles.stepTitle}>Location</Text>
            <Text style={styles.stepSubtitle}>Where is your business located?</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={styles.input}
                value={form.address}
                onChangeText={(text) => setForm({ ...form, address: text })}
                placeholder="Street address"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>City</Text>
              <TextInput
                style={styles.input}
                value={form.city}
                onChangeText={(text) => setForm({ ...form, city: text })}
                placeholder="e.g., Mumbai"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <Button title="Continue" onPress={() => setStep(2)} size="lg" style={styles.nextButton} />
          </View>
        );

      case 2:
        return (
          <View>
            <Text style={styles.stepTitle}>Almost there!</Text>
            <Text style={styles.stepSubtitle}>Review your details and get started</Text>

            <Card variant="outlined" style={styles.reviewCard}>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Business</Text>
                <Text style={styles.reviewValue}>{form.businessName}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Type</Text>
                <Text style={styles.reviewValue}>
                  {BUSINESS_TYPES.find((t) => t.value === form.businessType)?.label || form.businessType}
                </Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Phone</Text>
                <Text style={styles.reviewValue}>{form.phone}</Text>
              </View>
              {form.city && (
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>City</Text>
                  <Text style={styles.reviewValue}>{form.city}</Text>
                </View>
              )}
            </Card>

            <Button
              title="Start Automating"
              onPress={handleSubmit}
              loading={loading}
              size="lg"
              style={styles.nextButton}
            />
          </View>
        );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (step > 0 ? setStep(step - 1) : navigation.goBack())}>
          <Text style={styles.backButton}>{step > 0 ? '← Back' : '← Cancel'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>FB</Text>
          </View>
          <Text style={styles.welcomeText}>Welcome to Freebuff!</Text>
          <Text style={styles.welcomeSubtext}>Let's set up your business automation</Text>
        </View>

        {/* Step Indicator */}
        <View style={styles.stepsRow}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[styles.stepDot, i <= step ? styles.stepDotActive : styles.stepDotInactive]}
            />
          ))}
        </View>

        <Card variant="elevated" style={styles.formCard}>
          {renderStep()}
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingBottom: 8,
  },
  backButton: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepDotActive: {
    width: 32,
    backgroundColor: '#2563EB',
  },
  stepDotInactive: {
    backgroundColor: '#D1D5DB',
  },
  formCard: {
    padding: 24,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#111827',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  typeChipText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  typeChipTextActive: {
    color: '#2563EB',
  },
  nextButton: {
    marginTop: 24,
  },
  reviewCard: {
    marginTop: 16,
    backgroundColor: '#F9FAFB',
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  reviewLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  reviewValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
});
