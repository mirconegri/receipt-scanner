import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/types';
import type { Receipt, ReceiptItem } from '../types/receipt';
import { Card } from '../components/ui/Card';
import { Amount } from '../components/ui/Amount';
import { ReceiptItemRow } from '../components/receipt/ReceiptItemRow';
import { useReceipt } from '../hooks/useReceipt';
import { deleteReceipt, saveReceipt } from '../services/storage/receiptRepository';
import { formatDisplayDate, formatDisplayTime, nowIso } from '../utils/date';
import { AppError, getFriendlyErrorMessage } from '../utils/errors';

type DetailsRouteProp = RouteProp<RootStackParamList, 'ReceiptDetails'>;
type DetailsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ReceiptDetails'>;

function parseNumberOrNull(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  if (normalized.length === 0) return null;
  const value = Number.parseFloat(normalized);
  return Number.isNaN(value) ? null : value;
}

export function ReceiptDetailsScreen() {
  const navigation = useNavigation<DetailsNavigationProp>();
  const route = useRoute<DetailsRouteProp>();
  const { receipt, loading, refresh } = useReceipt(route.params.receiptId);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Receipt | null>(null);
  const [saving, setSaving] = useState(false);

  // Draft is created the moment editing starts (an event handler, not an
  // effect) rather than kept continuously in sync with `receipt` — there's
  // nothing to reconcile since `current` below only reads `draft` while
  // `editing` is true.
  function startEditing() {
    if (!receipt) return;
    setDraft(receipt);
    setEditing(true);
  }

  function updateItem(id: string, patch: Partial<ReceiptItem>) {
    setDraft((current) =>
      current
        ? { ...current, items: current.items.map((item) => (item.id === id ? { ...item, ...patch } : item)) }
        : current,
    );
  }

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    try {
      await saveReceipt({ ...draft, updatedAt: nowIso() });
      setEditing(false);
      refresh();
    } catch (error) {
      Alert.alert('Save failed', getFriendlyErrorMessage(new AppError('storage_failed', 'Save failed', error)));
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (!receipt) return;
    Alert.alert('Delete receipt?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteReceipt(receipt.id);
          navigation.goBack();
        },
      },
    ]);
  }

  if (loading || !receipt) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingState} />
      </SafeAreaView>
    );
  }

  const current = editing && draft ? draft : receipt;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {current.merchant ?? 'Receipt'}
          </Text>
          <View style={styles.headerActions}>
            {saving ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <Ionicons
                name={editing ? 'checkmark' : 'create-outline'}
                size={22}
                color={colors.accent}
                onPress={editing ? handleSave : startEditing}
                accessibilityRole="button"
                accessibilityLabel={editing ? 'Save changes' : 'Edit receipt'}
              />
            )}
            <Ionicons
              name="trash-outline"
              size={22}
              color={colors.error}
              onPress={handleDelete}
              accessibilityRole="button"
              accessibilityLabel="Delete receipt"
            />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Card style={styles.section}>
            <View style={styles.metaRow}>
              <Ionicons name="storefront-outline" size={16} color={colors.textSecondary} />
              {editing ? (
                <TextInput
                  value={current.merchant ?? ''}
                  onChangeText={(text) => setDraft((d) => (d ? { ...d, merchant: text } : d))}
                  style={styles.metaInput}
                  placeholder="Merchant"
                  placeholderTextColor={colors.textTertiary}
                />
              ) : (
                <Text style={styles.metaText}>{current.merchant ?? 'Unknown merchant'}</Text>
              )}
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              {editing ? (
                <TextInput
                  value={current.date ?? ''}
                  onChangeText={(text) => setDraft((d) => (d ? { ...d, date: text } : d))}
                  style={styles.metaInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textTertiary}
                />
              ) : (
                <Text style={styles.metaText}>
                  {formatDisplayDate(current.date)}
                  {current.time ? ` · ${formatDisplayTime(current.time)}` : ''}
                </Text>
              )}
            </View>
            {current.address ? (
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.metaText}>{current.address}</Text>
              </View>
            ) : null}
          </Card>

          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Items</Text>
            {current.items.length === 0 && <Text style={styles.emptyItems}>No items recorded.</Text>}
            {current.items.map((item) =>
              editing ? (
                <View key={item.id} style={styles.editItemRow}>
                  <TextInput
                    value={item.name}
                    onChangeText={(text) => updateItem(item.id, { name: text })}
                    style={styles.editItemName}
                    placeholderTextColor={colors.textTertiary}
                  />
                  <TextInput
                    value={item.totalPrice !== null ? String(item.totalPrice) : ''}
                    onChangeText={(text) => updateItem(item.id, { totalPrice: parseNumberOrNull(text) })}
                    style={styles.editItemPrice}
                    keyboardType="decimal-pad"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
              ) : (
                <ReceiptItemRow key={item.id} item={item} currency={current.currency} />
              ),
            )}
          </Card>

          <Card style={styles.section}>
            <SummaryLine label="Subtotal" value={current.subtotal} currency={current.currency} />
            <SummaryLine label="Tax" value={current.tax} currency={current.currency} />
            <SummaryLine label="Discount" value={current.discount} currency={current.currency} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Amount value={current.total} currency={current.currency} size="large" />
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SummaryLine({ label, value, currency }: { label: string; value: number | null; currency: string }) {
  if (value === null) return null;
  return (
    <View style={styles.summaryLine}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Amount value={value} currency={currency} color={colors.textSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  loadingState: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
    marginRight: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  content: { padding: spacing.md, paddingTop: 0, paddingBottom: spacing.xxl },
  section: { marginBottom: spacing.md },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  metaText: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    flexShrink: 1,
  },
  metaInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 2,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: typography.label.fontSize,
    fontWeight: typography.label.fontWeight,
    marginBottom: spacing.xs,
  },
  emptyItems: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
  },
  editItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  editItemName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  editItemPrice: {
    width: 80,
    textAlign: 'right',
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.mono,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderStrong,
  },
  totalLabel: {
    color: colors.textPrimary,
    fontSize: typography.heading.fontSize,
    fontWeight: typography.heading.fontWeight,
  },
});
