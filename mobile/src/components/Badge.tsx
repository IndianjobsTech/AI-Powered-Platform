import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const variantColors: Record<string, { bg: string; text: string }> = {
  default: { bg: '#F3F4F6', text: '#6B7280' },
  success: { bg: '#ECFDF5', text: '#059669' },
  warning: { bg: '#FFFBEB', text: '#D97706' },
  danger: { bg: '#FEF2F2', text: '#DC2626' },
  info: { bg: '#EFF6FF', text: '#2563EB' },
};

const sizeConfig: Record<string, { py: number; px: number; fontSize: number }> = {
  sm: { py: 3, px: 8, fontSize: 11 },
  md: { py: 4, px: 10, fontSize: 13 },
};

interface BadgeProps {
  label: string;
  variant?: keyof typeof variantColors;
  size?: keyof typeof sizeConfig;
}

export default function Badge({ label, variant = 'default', size = 'sm' }: BadgeProps) {
  const colors = variantColors[variant];
  const config = sizeConfig[size];
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.bg,
          paddingVertical: config.py,
          paddingHorizontal: config.px,
        },
      ]}
    >
      <Text style={[styles.text, { color: colors.text, fontSize: config.fontSize }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
});
