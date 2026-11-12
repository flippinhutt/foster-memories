import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { Milestone } from '@/src/types/milestone';
import { formatDate } from '@/src/utils/dates';
import { radius, spacing, touchTarget, useTheme } from '@/src/theme';
import { AppText } from './AppText';

interface Props {
  milestone: Milestone;
  /** Title of the linked memory, if any. */
  memoryTitle?: string;
  /** Opens the linked memory; card is static without it. */
  onPress?: () => void;
  /** Trailing control, e.g. a delete button. */
  action?: ReactNode;
}

/** One milestone: flag, name, date, linked memory. */
export function MilestoneCard({ milestone, memoryTitle, onPress, action }: Props) {
  const colors = useTheme();
  const meta = [formatDate(milestone.occurredAt), memoryTitle ? `Memory: ${memoryTitle}` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
      <Pressable
        accessibilityRole={onPress ? 'button' : 'text'}
        accessibilityLabel={`Milestone: ${milestone.label}, ${meta}`}
        disabled={!onPress}
        onPress={onPress}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <Ionicons name="flag" size={24} color={colors.primary} />
        <View style={styles.body}>
          <AppText variant="label">{milestone.label}</AppText>
          <AppText variant="caption" muted>
            {meta}
          </AppText>
          {milestone.notes ? <AppText variant="caption">{milestone.notes}</AppText> : null}
        </View>
      </Pressable>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: touchTarget,
  },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pressed: { opacity: 0.8 },
  body: { flex: 1, gap: spacing.xs },
});
