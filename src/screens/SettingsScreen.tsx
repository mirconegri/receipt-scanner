import React, { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme/tokens';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { SUPPORTED_CURRENCIES } from '../utils/currency';
import { getSettings, setSetting } from '../services/settings/settingsStore';
import { deleteAllReceipts, countReceipts } from '../services/storage/receiptRepository';
import { APP_VERSION, REPO_URL } from '../constants';

export function SettingsScreen() {
  const [currency, setCurrency] = useState('EUR');
  const [receiptCount, setReceiptCount] = useState(0);

  const load = useCallback(() => {
    getSettings().then((settings) => setCurrency(settings.currency));
    countReceipts().then(setReceiptCount);
  }, []);

  useFocusEffect(load);

  async function handleSelectCurrency(code: string) {
    setCurrency(code);
    await setSetting('currency', code);
  }

  function handleClearAll() {
    Alert.alert(
      'Clear all receipts?',
      `This permanently deletes all ${receiptCount} saved receipt${receiptCount === 1 ? '' : 's'} from this device. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear everything',
          style: 'destructive',
          onPress: async () => {
            await deleteAllReceipts();
            setReceiptCount(0);
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        <SectionHeader title="Currency" />
        <Card style={styles.section} padded={false}>
          {SUPPORTED_CURRENCIES.map((code, index) => (
            <Pressable
              key={code}
              onPress={() => handleSelectCurrency(code)}
              accessibilityRole="button"
              accessibilityLabel={`Set currency to ${code}`}
              accessibilityState={{ selected: currency === code }}
              style={[styles.row, index > 0 && styles.rowBorder]}
            >
              <Text style={styles.rowLabel}>{code}</Text>
              {currency === code && <Ionicons name="checkmark" size={20} color={colors.accent} />}
            </Pressable>
          ))}
        </Card>

        <SectionHeader title="Privacy" />
        <Card style={styles.section}>
          <View style={styles.privacyRow}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.accent} />
            <Text style={styles.privacyText}>
              Every scan is processed entirely on this device. Receipt photos and extracted text are never
              uploaded — there is no server for this app to send them to.
            </Text>
          </View>
        </Card>

        <SectionHeader title="Data" />
        <Card style={styles.section} padded={false}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Saved receipts</Text>
            <Text style={styles.rowValue}>{receiptCount}</Text>
          </View>
          <Pressable
            onPress={handleClearAll}
            accessibilityRole="button"
            accessibilityLabel="Clear all receipts"
            style={[styles.row, styles.rowBorder]}
          >
            <Text style={styles.destructiveLabel}>Clear all receipts</Text>
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </Pressable>
        </Card>

        <SectionHeader title="About" />
        <Card style={styles.section}>
          <Text style={styles.aboutTitle}>Receipt Scanner · v{APP_VERSION}</Text>
          <Text style={styles.aboutBody}>
            An open-source, privacy-first receipt scanner. On-device OCR, no account, no tracking, works
            offline. Contributions welcome.
          </Text>
          <Pressable
            onPress={() => Linking.openURL(REPO_URL).catch(() => undefined)}
            accessibilityRole="link"
            style={styles.linkRow}
          >
            <Ionicons name="logo-github" size={16} color={colors.accent} />
            <Text style={styles.linkText}>View source &amp; license</Text>
          </Pressable>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  title: {
    color: colors.textPrimary,
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
    marginBottom: spacing.md,
  },
  section: { marginBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowLabel: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
  },
  rowValue: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    fontFamily: typography.fontFamily.mono,
  },
  destructiveLabel: {
    color: colors.error,
    fontSize: typography.body.fontSize,
  },
  privacyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  privacyText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  aboutTitle: {
    color: colors.textPrimary,
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    marginBottom: spacing.xxs,
  },
  aboutBody: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    marginBottom: spacing.sm,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  linkText: {
    color: colors.accent,
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
});
