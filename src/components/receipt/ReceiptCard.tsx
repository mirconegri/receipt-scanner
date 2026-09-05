import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import type { ReceiptSummary } from '../../types/receipt';
import { formatDisplayDate } from '../../utils/date';
import { Amount } from '../ui/Amount';
import { Card } from '../ui/Card';

interface ReceiptCardProps {
  receipt: ReceiptSummary;
  onPress: () => void;
}

export function ReceiptCard({ receipt, onPress }: ReceiptCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${receipt.merchant ?? 'Unknown merchant'}, ${formatDisplayDate(receipt.date)}, ${receipt.total ?? 'no total'}`}
    >
      {({ pressed }) => (
        <Card style={pressed ? styles.pressed : undefined}>
          <View style={styles.row}>
            <View style={styles.iconWrap}>
              <Ionicons name="receipt-outline" size={20} color={colors.accent} />
            </View>
            <View style={styles.info}>
              <Text style={styles.merchant} numberOfLines={1}>
                {receipt.merchant ?? 'Unknown merchant'}
              </Text>
              <Text style={styles.meta}>
                {formatDisplayDate(receipt.date)} · {receipt.itemCount} {receipt.itemCount === 1 ? 'item' : 'items'}
              </Text>
            </View>
            <Amount value={receipt.total} currency={receipt.currency} />
          </View>
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  merchant: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    color: colors.textPrimary,
  },
  meta: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.85,
  },
});
