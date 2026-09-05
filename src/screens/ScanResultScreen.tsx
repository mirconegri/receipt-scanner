import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii, spacing, typography } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/types';
import type { FieldConfidence, ParsedField, Receipt, ReceiptItem } from '../types/receipt';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EditableField } from '../components/ui/EditableField';
import { SectionHeader } from '../components/ui/SectionHeader';
import { saveReceipt } from '../services/storage/receiptRepository';
import { generateId } from '../utils/id';
import { nowIso } from '../utils/date';
import { getFriendlyErrorMessage, AppError } from '../utils/errors';

type ScanResultRouteProp = RouteProp<RootStackParamList, 'ScanResult'>;
type ScanResultNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ScanResult'>;

interface TextDraft {
  text: string;
  confidence: FieldConfidence;
}

function toDraft<T>(field: ParsedField<T>, format: (value: T) => string): TextDraft {
  return { text: field.value !== null ? format(field.value) : '', confidence: field.confidence };
}

function edited(draft: TextDraft, text: string): TextDraft {
  return { text, confidence: draft.confidence === 'detected' ? 'manual' : draft.confidence };
}

function parseNumberOrNull(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  if (normalized.length === 0) return null;
  const value = Number.parseFloat(normalized);
  return Number.isNaN(value) ? null : value;
}

export function ScanResultScreen() {
  const navigation = useNavigation<ScanResultNavigationProp>();
  const route = useRoute<ScanResultRouteProp>();
  const { parsedReceipt } = route.params;

  const [merchant, setMerchant] = useState(() => toDraft(parsedReceipt.merchant, (v) => v));
  const [date, setDate] = useState(() => toDraft(parsedReceipt.date, (v) => v));
  const [currency, setCurrency] = useState(() => toDraft(parsedReceipt.currency, (v) => v));
  const [subtotal, setSubtotal] = useState(() => toDraft(parsedReceipt.subtotal, (v) => v.toFixed(2)));
  const [tax, setTax] = useState(() => toDraft(parsedReceipt.tax, (v) => v.toFixed(2)));
  const [total, setTotal] = useState(() => toDraft(parsedReceipt.total, (v) => v.toFixed(2)));
  const [items, setItems] = useState<ReceiptItem[]>(parsedReceipt.items);
  const [saving, setSaving] = useState(false);

  const resolvedCurrency = currency.text.trim().length > 0 ? currency.text.trim().toUpperCase() : 'EUR';

  const computedItemsTotal = useMemo(
    () => items.reduce((sum, item) => sum + (item.totalPrice ?? 0), 0),
    [items],
  );

  function updateItem(id: string, patch: Partial<ReceiptItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const now = nowIso();
      const receipt: Receipt = {
        id: generateId('receipt'),
        merchant: merchant.text.trim() || null,
        address: parsedReceipt.address.value,
        date: date.text.trim() || null,
        time: parsedReceipt.time.value,
        receiptNumber: parsedReceipt.receiptNumber.value,
        currency: resolvedCurrency,
        items,
        subtotal: parseNumberOrNull(subtotal.text),
        tax: parseNumberOrNull(tax.text),
        discount: parsedReceipt.discount.value,
        total: parseNumberOrNull(total.text),
        rawText: parsedReceipt.rawText,
        createdAt: now,
        updatedAt: now,
      };

      await saveReceipt(receipt);
      navigation.getParent()?.goBack();
      navigation.getParent()?.navigate('ReceiptDetails', { receiptId: receipt.id });
    } catch (error) {
      Alert.alert('Save failed', getFriendlyErrorMessage(new AppError('storage_failed', 'Save failed', error)));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Review receipt</Text>
          <Text style={styles.subtitle}>Check the details below — anything OCR wasn&apos;t sure about is flagged.</Text>

          <Card style={styles.section}>
            <EditableField
              label="Merchant"
              value={merchant.text}
              confidence={merchant.confidence}
              onChangeValue={(text) => setMerchant((d) => edited(d, text))}
              placeholder="Store name"
            />
            <EditableField
              label="Date"
              value={date.text}
              confidence={date.confidence}
              onChangeValue={(text) => setDate((d) => edited(d, text))}
              placeholder="YYYY-MM-DD"
            />
            <EditableField
              label="Currency"
              value={currency.text}
              confidence={currency.confidence}
              onChangeValue={(text) => setCurrency((d) => edited(d, text))}
              placeholder="EUR"
              monospace
            />
          </Card>

          <View style={styles.itemsHeader}>
            <SectionHeader title={`Items (${items.length})`} />
          </View>
          <Card style={styles.section}>
            {items.length === 0 && <Text style={styles.emptyItems}>No items were detected. You can add totals manually below.</Text>}
            {items.map((item, index) => (
              <View key={item.id} style={[styles.itemRow, index > 0 && styles.itemRowBorder]}>
                <TextInput
                  value={item.name}
                  onChangeText={(text) => updateItem(item.id, { name: text })}
                  style={styles.itemNameInput}
                  placeholder="Item name"
                  placeholderTextColor={colors.textTertiary}
                  accessibilityLabel={`Item ${index + 1} name`}
                />
                <TextInput
                  value={item.totalPrice !== null ? String(item.totalPrice) : ''}
                  onChangeText={(text) => updateItem(item.id, { totalPrice: parseNumberOrNull(text) })}
                  style={styles.itemPriceInput}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textTertiary}
                  accessibilityLabel={`Item ${index + 1} price`}
                />
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.textTertiary}
                  onPress={() => removeItem(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${item.name || 'item'}`}
                />
              </View>
            ))}
            {Math.abs(computedItemsTotal - (parseNumberOrNull(total.text) ?? computedItemsTotal)) > 0.01 &&
              items.length > 0 && <Text style={styles.itemsMismatch}>Items add up to {computedItemsTotal.toFixed(2)} — double-check the total below.</Text>}
          </Card>

          <Card style={styles.section}>
            <EditableField
              label="Subtotal"
              value={subtotal.text}
              confidence={subtotal.confidence}
              onChangeValue={(text) => setSubtotal((d) => edited(d, text))}
              placeholder="0.00"
              keyboardType="decimal-pad"
              monospace
            />
            <EditableField
              label="Tax"
              value={tax.text}
              confidence={tax.confidence}
              onChangeValue={(text) => setTax((d) => edited(d, text))}
              placeholder="0.00"
              keyboardType="decimal-pad"
              monospace
            />
            <EditableField
              label="Total"
              value={total.text}
              confidence={total.confidence}
              onChangeValue={(text) => setTotal((d) => edited(d, text))}
              placeholder="0.00"
              keyboardType="decimal-pad"
              monospace
            />
          </Card>

          <Button label="Save Receipt" onPress={handleSave} loading={saving} fullWidth style={styles.saveButton} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  title: {
    color: colors.textPrimary,
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    marginTop: spacing.xxs,
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
  },
  itemsHeader: {
    marginBottom: -spacing.xxs,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  itemRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemNameInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    paddingVertical: spacing.xxs,
  },
  itemPriceInput: {
    width: 84,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.mono.fontSize,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 6,
  },
  emptyItems: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
  },
  itemsMismatch: {
    color: colors.warning,
    fontSize: typography.caption.fontSize,
    marginTop: spacing.xs,
  },
  saveButton: {
    marginTop: spacing.sm,
  },
});
