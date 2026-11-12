import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { DetailRow } from '@/src/components/DetailRow';
import { MediaImage } from '@/src/components/MediaImage';
import { Screen } from '@/src/components/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/src/components/StateViews';
import { mediaUri } from '@/src/services/mediaFiles';
import { useMemoryDetail, useMemoryStore } from '@/src/stores/memoryStore';
import { selectPetById, usePetStore } from '@/src/stores/petStore';
import { confirmDestructive } from '@/src/utils/confirm';
import { formatDate } from '@/src/utils/dates';
import { MOOD_LABELS } from '@/src/utils/memoryLabels';
import { spacing, useTheme } from '@/src/theme';

type Busy = 'favorite' | 'delete' | null;

export function MemoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, retry } = useMemoryDetail(id);
  const petId = state.status === 'ready' ? state.detail.memory.petId : undefined;
  const pet = usePetStore(selectPetById(petId));
  const { toggleFavorite, remove } = useMemoryStore();
  const colors = useTheme();
  const [busy, setBusy] = useState<Busy>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (state.status === 'loading') return <LoadingState />;
  if (state.status === 'error') return <ErrorState message={state.message} onRetry={retry} />;
  if (state.status === 'missing') {
    return <EmptyState title="Memory not found" message="This memory may have been removed." />;
  }

  const { memory, photos, tags } = state.detail;
  const headline = memory.title ?? (pet ? `A memory of ${pet.name}` : 'Memory');

  const favorite = async () => {
    setActionError(null);
    setBusy('favorite');
    try {
      await toggleFavorite(memory);
    } catch {
      setActionError('Could not update this memory. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const confirmDelete = async () => {
    setActionError(null);
    const confirmed = await confirmDestructive(
      'Delete this memory?',
      'This removes the memory and its photos saved in this app. Photos in your gallery are not touched. This can’t be undone.',
      'Delete',
    );
    if (!confirmed) return;
    setBusy('delete');
    try {
      await remove(memory.id);
      router.back();
    } catch {
      setActionError('Could not delete this memory. Please try again.');
      setBusy(null);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: formatDate(memory.occurredAt) }} />
      {photos.map((photo, index) => (
        <MediaImage
          key={photo.id}
          uri={mediaUri(photo.localUri)}
          label={`Photo ${index + 1} of ${photos.length}`}
          style={[styles.photo, { aspectRatio: photo.width && photo.height ? photo.width / photo.height : 1 }]}
        />
      ))}
      <View style={styles.header}>
        <AppText variant="title">
          {memory.isFavorite ? '★ ' : ''}
          {headline}
        </AppText>
        <AppText muted>
          {[pet?.name, formatDate(memory.occurredAt)].filter(Boolean).join(' · ')}
        </AppText>
      </View>
      {memory.body ? <AppText>{memory.body}</AppText> : null}
      {memory.mood || memory.location || tags.length > 0 ? (
        <Card>
          <DetailRow label="Mood" value={memory.mood ? MOOD_LABELS[memory.mood] : null} />
          <DetailRow label="Location" value={memory.location} />
          <DetailRow label="Tags" value={tags.length > 0 ? tags.join(', ') : null} />
        </Card>
      ) : null}
      <Button
        label={memory.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        variant="secondary"
        onPress={favorite}
        loading={busy === 'favorite'}
        disabled={busy !== null}
      />
      <Button
        label="Edit memory"
        variant="secondary"
        onPress={() => router.push({ pathname: '/memories/[id]/edit', params: { id: memory.id } })}
      />
      {actionError ? (
        <AppText accessibilityRole="alert" style={{ color: colors.danger }}>
          {actionError}
        </AppText>
      ) : null}
      <Button
        label="Delete memory"
        variant="danger"
        onPress={confirmDelete}
        loading={busy === 'delete'}
        disabled={busy !== null}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  photo: { width: '100%' },
});
