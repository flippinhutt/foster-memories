import { Pressable, StyleSheet, View } from 'react-native';
import { mediaUri } from '@/src/services/mediaFiles';
import type { MemorySummary } from '@/src/types/memory';
import { formatDate } from '@/src/utils/dates';
import { MOOD_LABELS } from '@/src/utils/memoryLabels';
import { radius, spacing, touchTarget, useTheme } from '@/src/theme';
import { AppText } from './AppText';
import { MediaImage } from './MediaImage';

interface Props {
  memory: MemorySummary;
  onPress: () => void;
}

/** One timeline entry: first photo, headline, date, mood, favorite. */
export function MemoryCard({ memory, onPress }: Props) {
  const colors = useTheme();
  const headline = memory.title ?? memory.body ?? 'Photo memory';
  const meta = [
    formatDate(memory.occurredAt),
    memory.mood ? MOOD_LABELS[memory.mood] : null,
    memory.photoCount > 1 ? `${memory.photoCount} photos` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${memory.isFavorite ? 'Favorite. ' : ''}${headline}, ${meta}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      {memory.photoPath ? (
        <MediaImage uri={mediaUri(memory.photoPath)} label="" style={styles.photo} />
      ) : null}
      <View style={styles.body}>
        <AppText variant="label" numberOfLines={2}>
          {memory.isFavorite ? '★ ' : ''}
          {headline}
        </AppText>
        <AppText variant="caption" muted>
          {meta}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: touchTarget,
  },
  pressed: { opacity: 0.8 },
  photo: { width: 64, height: 64 },
  body: { flex: 1, gap: spacing.xs },
});
