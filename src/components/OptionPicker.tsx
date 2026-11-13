import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { radius, spacing, touchTarget, useTheme } from '@/src/theme';
import { AppText } from './AppText';

interface Props<T extends string> {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** Single-choice chips; the selected chip shows a check so color is not the only cue. */
export function OptionPicker<T extends string>({ label, options, value, onChange }: Props<T>) {
  const colors = useTheme();
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <AppText variant="label">{label}</AppText>
      <View style={styles.row}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ checked: selected }}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.chip,
                {
                  borderColor: selected ? colors.primary : colors.outline,
                  backgroundColor: selected ? colors.surfaceMuted : colors.surface,
                },
                pressed && styles.pressed,
              ]}
            >
              {selected ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
              <AppText style={selected ? { color: colors.primary, fontWeight: '600' } : undefined}>
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.6 },
  wrap: { gap: spacing.xs },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: touchTarget,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    justifyContent: 'center',
  },
});
