import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { spacing, useTheme } from '@/src/theme';
import { AppText } from './AppText';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.center}>
      <AppText variant="heading" style={styles.text}>
        {title}
      </AppText>
      <AppText muted style={styles.text}>
        {message}
      </AppText>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  const colors = useTheme();
  return (
    <View style={styles.center} accessibilityLabel={label} accessible>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const colors = useTheme();
  return (
    <View style={styles.center} accessibilityRole="alert">
      <AppText variant="heading" style={styles.text}>
        Something went wrong
      </AppText>
      <AppText style={[styles.text, { color: colors.danger }]}>{message}</AppText>
      {onRetry ? <Button label="Try again" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  text: { textAlign: 'center' },
});
