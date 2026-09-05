import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import type { FieldConfidence } from '../../types/receipt';

interface BadgeProps {
  tone: 'accent' | 'success' | 'warning' | 'error' | 'neutral';
  label: string;
}

export function Badge({ tone, label }: BadgeProps) {
  const palette = toneStyles[tone];
  return (
    <View style={[styles.base, { backgroundColor: palette.background }]}>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const CONFIDENCE_LABEL: Record<FieldConfidence, string> = {
  detected: 'Detected',
  uncertain: 'Needs review',
  manual: 'Edited',
};

const CONFIDENCE_TONE: Record<FieldConfidence, BadgeProps['tone']> = {
  detected: 'success',
  uncertain: 'warning',
  manual: 'accent',
};

export function ConfidenceBadge({ confidence }: { confidence: FieldConfidence }) {
  return <Badge tone={CONFIDENCE_TONE[confidence]} label={CONFIDENCE_LABEL[confidence]} />;
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: typography.label.fontSize,
    fontWeight: typography.label.fontWeight,
  },
});

const toneStyles: Record<BadgeProps['tone'], { background: string; text: string }> = {
  accent: { background: colors.accentSoft, text: colors.accent },
  success: { background: colors.successSoft, text: colors.success },
  warning: { background: colors.warningSoft, text: colors.warning },
  error: { background: colors.errorSoft, text: colors.error },
  neutral: { background: colors.surfaceRaised, text: colors.textSecondary },
};
