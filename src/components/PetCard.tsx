import { Pressable, StyleSheet, View } from 'react-native';
import type { Pet } from '@/src/types/pet';
import { formatDate } from '@/src/utils/dates';
import { petSummary } from '@/src/utils/petLabels';
import { radius, spacing, touchTarget, useTheme } from '@/src/theme';
import { AppText } from './AppText';
import { StatusBadge } from './StatusBadge';

interface Props {
  pet: Pet;
  onPress: () => void;
}

export function PetCard({ pet, onPress }: Props) {
  const colors = useTheme();
  const summary = petSummary(pet);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${pet.name}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[styles.avatar, { backgroundColor: colors.surfaceMuted }]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <AppText variant="heading" style={{ color: colors.primary }}>
          {pet.name.charAt(0).toUpperCase()}
        </AppText>
      </View>
      <View style={styles.body}>
        <AppText variant="heading" numberOfLines={1}>
          {pet.name}
        </AppText>
        {summary ? (
          <AppText muted numberOfLines={1}>
            {summary}
          </AppText>
        ) : null}
        {pet.arrivalDate ? (
          <AppText variant="caption" muted>
            Arrived {formatDate(pet.arrivalDate)}
          </AppText>
        ) : null}
        <StatusBadge status={pet.status} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: touchTarget,
  },
  pressed: { opacity: 0.8 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: spacing.xs },
});
