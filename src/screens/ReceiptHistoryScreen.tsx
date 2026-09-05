import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii, spacing, typography } from '../theme/tokens';
import { EmptyState } from '../components/ui/EmptyState';
import { ReceiptCard } from '../components/receipt/ReceiptCard';
import { useReceipts } from '../hooks/useReceipts';
import type { SortField } from '../services/storage/receiptRepository';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';

type HistoryNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'History'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const SORT_OPTIONS: { field: SortField; label: string }[] = [
  { field: 'date', label: 'Date' },
  { field: 'total', label: 'Total' },
  { field: 'merchant', label: 'Merchant' },
];

export function ReceiptHistoryScreen() {
  const navigation = useNavigation<HistoryNavigationProp>();
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('date');
  const { receipts, loading, refresh } = useReceipts({ searchQuery: query, sortBy, sortDirection: 'desc' });

  useFocusEffect(
    useCallback(() => {
      refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by merchant"
            placeholderTextColor={colors.textTertiary}
            style={styles.searchInput}
            accessibilityLabel="Search receipts"
          />
        </View>
        <View style={styles.sortRow}>
          {SORT_OPTIONS.map((option) => (
            <Pressable
              key={option.field}
              onPress={() => setSortBy(option.field)}
              accessibilityRole="button"
              accessibilityLabel={`Sort by ${option.label}`}
              accessibilityState={{ selected: sortBy === option.field }}
              style={[styles.sortPill, sortBy === option.field && styles.sortPillActive]}
            >
              <Text style={[styles.sortLabel, sortBy === option.field && styles.sortLabelActive]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={receipts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.accent} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <ReceiptCard receipt={item} onPress={() => navigation.navigate('ReceiptDetails', { receiptId: item.id })} />
        )}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon={<Ionicons name="search-outline" size={40} color={colors.textTertiary} />}
              title={query ? 'No matches' : 'No receipts yet'}
              message={query ? 'Try a different search term.' : 'Scanned receipts will show up here.'}
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
  },
  sortRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  sortPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortPillActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  sortLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  sortLabelActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  separator: {
    height: spacing.sm,
  },
});
