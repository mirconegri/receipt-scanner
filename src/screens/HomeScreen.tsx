import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii, spacing, typography } from '../theme/tokens';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Amount } from '../components/ui/Amount';
import { ReceiptCard } from '../components/receipt/ReceiptCard';
import { useReceipts } from '../hooks/useReceipts';
import { getMonthSpend } from '../services/storage/receiptRepository';
import { getSettings } from '../services/settings/settingsStore';
import { currentYearMonth } from '../utils/date';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';

type HomeNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();
  const { receipts, loading, refresh } = useReceipts({ sortBy: 'date', sortDirection: 'desc' });
  const [monthSpend, setMonthSpend] = useState<number | null>(null);
  const [currency, setCurrency] = useState('EUR');

  useFocusEffect(
    useCallback(() => {
      refresh();
      let cancelled = false;
      Promise.all([getMonthSpend(currentYearMonth()), getSettings()]).then(([spend, settings]) => {
        if (!cancelled) {
          setMonthSpend(spend);
          setCurrency(settings.currency);
        }
      });
      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const recent = receipts.slice(0, 5);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Receipt Scanner</Text>
          <Text style={styles.title}>Scan, and forget the pile of paper.</Text>
        </View>

        <Card raised style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Spent this month</Text>
          <Amount value={monthSpend} currency={currency} size="large" />
        </Card>

        <Button
          label="Scan Receipt"
          onPress={() => navigation.navigate('Scanner')}
          icon={<Ionicons name="scan" size={20} color={colors.textOnAccent} />}
          fullWidth
          style={styles.scanButton}
          accessibilityHint="Opens the camera to scan a new receipt"
        />

        <View style={styles.section}>
          <SectionHeader
            title="Recent receipts"
            actionLabel={recent.length > 0 ? 'See all' : undefined}
            onAction={recent.length > 0 ? () => navigation.navigate('Main', { screen: 'History' }) : undefined}
          />
          {!loading && recent.length === 0 && (
            <EmptyState
              icon={<Ionicons name="receipt-outline" size={40} color={colors.textTertiary} />}
              title="No receipts yet"
              message="Scan your first receipt and it will show up here."
            />
          )}
          <View style={styles.list}>
            {recent.map((receipt) => (
              <ReceiptCard
                key={receipt.id}
                receipt={receipt}
                onPress={() => navigation.navigate('ReceiptDetails', { receiptId: receipt.id })}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: typography.label.fontSize,
    fontWeight: typography.label.fontWeight,
    marginBottom: spacing.xxs,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
    lineHeight: typography.title.lineHeight,
  },
  summaryCard: {
    marginBottom: spacing.md,
    borderRadius: radii.xl,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    marginBottom: spacing.xxs,
  },
  scanButton: {
    marginBottom: spacing.xl,
  },
  section: {
    marginTop: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
});
