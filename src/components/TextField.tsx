import type { ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { radius, spacing, touchTarget, typography, useTheme } from '@/src/theme';
import { AppText } from './AppText';

interface Props extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  hint?: string;
  /** Rendered beside the input, e.g. a calendar button. */
  accessory?: ReactNode;
}

export function TextField({ label, error, hint, accessory, multiline, ...rest }: Props) {
  const colors = useTheme();
  return (
    <View style={styles.wrap}>
      <AppText variant="label">{label}</AppText>
      <View style={styles.row}>
        <TextInput
          accessibilityLabel={label}
          accessibilityHint={hint}
          placeholderTextColor={colors.textMuted}
          multiline={multiline}
          style={[
            styles.input,
            typography.body,
            {
              color: colors.text,
              backgroundColor: colors.surface,
              borderColor: error ? colors.danger : colors.border,
            },
            multiline && styles.multiline,
          ]}
          {...rest}
        />
        {accessory}
      </View>
      {error ? (
        <AppText variant="caption" style={{ color: colors.danger }} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" muted>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.sm },
  input: {
    flex: 1,
    minHeight: touchTarget,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
});
