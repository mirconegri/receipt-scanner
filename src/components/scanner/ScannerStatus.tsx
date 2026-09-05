import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../../theme/tokens';

interface ScannerStatusProps {
  message: string;
  showPrivacyBadge?: boolean;
}

export function ScannerStatus({ message, showPrivacyBadge = true }: ScannerStatusProps) {
  return (
    <View style={styles.container}>
      <View style={styles.pill} accessibilityLiveRegion="polite">
        <Text style={styles.text}>{message}</Text>
      </View>
      {showPrivacyBadge && (
        <View style={styles.privacyRow}>
          <Ionicons name="lock-closed-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.privacyText}>Processed on device — nothing is uploaded</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  pill: {
    backgroundColor: colors.surfaceOverlay,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  text: {
    color: colors.textPrimary,
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    textAlign: 'center',
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  privacyText: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
  },
});
