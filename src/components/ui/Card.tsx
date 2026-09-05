import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radii, shadow, spacing } from '../../theme/tokens';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  raised?: boolean;
  padded?: boolean;
}

export function Card({ children, style, raised = false, padded = true }: CardProps) {
  return (
    <View
      style={[
        styles.base,
        raised ? styles.raised : styles.flat,
        raised ? shadow.raised : shadow.card,
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  flat: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  raised: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
  },
  padded: {
    padding: spacing.md,
  },
});
