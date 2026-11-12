import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { spacing, useTheme } from '@/src/theme';

interface Props {
  children: ReactNode;
  /** Set false for screens that render their own list. */
  scroll?: boolean;
}

export function Screen({ children, scroll = true }: Props) {
  const colors = useTheme();
  if (!scroll) {
    return <View style={[styles.fill, { backgroundColor: colors.background }]}>{children}</View>;
  }
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
});
