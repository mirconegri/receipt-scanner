import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme/tokens';
import type { ReceiptItem } from '../../types/receipt';
import { formatQuantity } from '../../utils/currency';
import { Amount } from '../ui/Amount';

interface ReceiptItemRowProps {
  item: ReceiptItem;
  currency: string;
}

export function ReceiptItemRow({ item, currency }: ReceiptItemRowProps) {
  const hasQuantity = item.quantity !== null && item.quantity !== 1;
  return (
    <View style={styles.row}>
      <View style={styles.nameColumn}>
        <Text style={styles.name}>{item.name}</Text>
        {hasQuantity && (
          <Text style={styles.subline}>
            {formatQuantity(item.quantity)} × <Amount value={item.unitPrice} currency={currency} color={colors.textTertiary} />
          </Text>
        )}
      </View>
      <Amount value={item.totalPrice} currency={currency} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  nameColumn: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
  },
  subline: {
    fontSize: typography.caption.fontSize,
    color: colors.textTertiary,
    marginTop: 2,
  },
});
