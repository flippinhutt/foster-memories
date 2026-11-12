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
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={styles.fill}>{children}</View>
      </View>
    );
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
  fill: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center' },
  // Caps line length on wide screens; no effect on phones.
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl, width: '100%', maxWidth: 720, alignSelf: 'center' },
});
