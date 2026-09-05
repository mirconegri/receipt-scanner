import React from 'react';
import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import type { FieldConfidence } from '../../types/receipt';
import { ConfidenceBadge } from './Badge';

interface EditableFieldProps {
  label: string;
  value: string;
  confidence: FieldConfidence;
  onChangeValue: (value: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  monospace?: boolean;
}

export function EditableField({
  label,
  value,
  confidence,
  onChangeValue,
  placeholder,
  keyboardType = 'default',
  monospace = false,
}: EditableFieldProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <ConfidenceBadge confidence={confidence} />
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeValue}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        keyboardType={keyboardType}
        style={[styles.input, monospace && styles.mono]}
        accessibilityLabel={label}
        accessibilityHint={`Editable field, currently ${confidence === 'detected' ? 'detected from the receipt' : 'unconfirmed'}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxs,
  },
  label: {
    fontSize: typography.label.fontSize,
    fontWeight: typography.label.fontWeight,
    color: colors.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
    minHeight: 44,
  },
  mono: {
    fontFamily: typography.fontFamily.mono,
  },
});
