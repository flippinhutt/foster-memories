import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { radius, spacing, useTheme } from '@/src/theme';

export function Card({ children }: { children: ReactNode }) {
  const colors = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md, borderRadius: radius.md, borderWidth: 1, gap: spacing.sm },
});
