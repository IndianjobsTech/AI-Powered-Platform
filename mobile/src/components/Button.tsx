import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';

const variantConfig: Record<string, { bg: string; textColor: string; border?: string }> = {
  primary: { bg: '#2563EB', textColor: '#fff' },
  secondary: { bg: '#F3F4F6', textColor: '#374151' },
  outline: { bg: 'transparent', textColor: '#374151', border: '#D1D5DB' },
  danger: { bg: '#DC2626', textColor: '#fff' },
  ghost: { bg: 'transparent', textColor: '#2563EB' },
};

const sizeConfig: Record<string, { py: number; px: number; fontSize: number }> = {
  sm: { py: 8, px: 16, fontSize: 13 },
  md: { py: 12, px: 20, fontSize: 15 },
  lg: { py: 16, px: 24, fontSize: 17 },
};

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: keyof typeof variantConfig;
  size?: keyof typeof sizeConfig;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const vConfig = variantConfig[variant];
  const sConfig = sizeConfig[size];

  return (
    <TouchableOpacity
      style={[
        styles.base,
        {
          backgroundColor: vConfig.bg,
          paddingVertical: sConfig.py,
          paddingHorizontal: sConfig.px,
          borderWidth: vConfig.border ? 1.5 : 0,
          borderColor: vConfig.border || 'transparent',
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? '#2563EB' : '#fff'}
        />
      ) : (
        <Text
          style={[
            styles.text,
            { color: vConfig.textColor, fontSize: sConfig.fontSize },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: '600',
  },
});
