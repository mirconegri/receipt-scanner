import React from 'react';
import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import { colors, typography } from '../../theme/tokens';
import { formatMoney } from '../../utils/currency';

interface AmountProps {
  value: number | null;
  currency: string;
  size?: 'regular' | 'large';
  color?: string;
  style?: StyleProp<TextStyle>;
}

export function Amount({ value, currency, size = 'regular', color, style }: AmountProps) {
  return (
    <Text
      style={[
        styles.base,
        size === 'large' ? styles.large : styles.regular,
        { color: color ?? colors.textPrimary },
        style,
      ]}
      accessibilityLabel={value === null ? 'amount not available' : `${formatMoney(value, currency)}`}
    >
      {formatMoney(value, currency)}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: typography.fontFamily.mono,
  },
  regular: {
    fontSize: typography.mono.fontSize,
    fontWeight: typography.mono.fontWeight,
  },
  large: {
    fontSize: typography.monoLarge.fontSize,
    fontWeight: typography.monoLarge.fontWeight,
  },
});
