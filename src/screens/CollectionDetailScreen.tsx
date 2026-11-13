import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { Button } from '@/src/components/Button';
import { MemoryCard } from '@/src/components/MemoryCard';
import { Screen } from '@/src/components/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/src/components/StateViews';
import { selectCollectionById, useCollectionStore } from '@/src/stores/collectionStore';
import { useMemoryStore } from '@/src/stores/memoryStore';
import { confirmDestructive } from '@/src/utils/confirm';
import { spacing, touchTarget, useTheme } from '@/src/theme';

type Busy = 'remove' | 'delete' | null;

export function CollectionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const collection = useCollectionStore(selectCollectionById(id));
  const { links, status, error, load, remove, removeMemory } = useCollectionStore();
  const allMemories = useMemoryStore((state) => state.memories);
  const colors = useTheme();
  const [busy, setBusy] = useState<Busy>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (status === 'idle' || status === 'loading') return <LoadingState />;
  if (status === 'error') return <ErrorState message={error ?? 'Could not load this collection.'} onRetry={load} />;
  if (!collection) return <EmptyState title="Collection not found" message="It may have been deleted." />;

  const memories = links
    .filter((link) => link.collectionId === collection.id)
    .flatMap((link) => allMemories.filter((memory) => memory.id === link.memoryId));

  const takeOut = async (memoryId: string) => {
    setActionError(null);
    setBusy('remove');
    try {
      await removeMemory(collection.id, memoryId);
    } catch {
      setActionError('Could not remove that memory. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const confirmDelete = async () => {
    setActionError(null);
    const confirmed = await confirmDestructive(
      `Delete “${collection.name}”?`,
      'The memories in it are kept.',
      'Delete',
    );
    if (!confirmed) return;
    setBusy('delete');
    try {
      await remove(collection.id);
      router.back();
    } catch {
      setActionError('Could not delete this collection. Please try again.');
      setBusy(null);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: collection.name }} />
      <AppText variant="title">{collection.name}</AppText>
      {collection.description ? <AppText muted>{collection.description}</AppText> : null}
      {memories.length === 0 ? (
        <AppText muted>No memories here yet. Open a memory and add it to this collection.</AppText>
      ) : (
        memories.map((memory) => (
          <View key={memory.id} style={styles.row}>
            <View style={styles.card}>
              <MemoryCard
                memory={memory}
                onPress={() => router.push({ pathname: '/memories/[id]', params: { id: memory.id } })}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove ${memory.title ?? 'memory'} from ${collection.name}`}
              disabled={busy !== null}
              onPress={() => takeOut(memory.id)}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            >
              <Ionicons name="remove-circle-outline" size={24} color={colors.danger} />
            </Pressable>
          </View>
        ))
      )}
      <Button
        label="Rename"
        variant="secondary"
        onPress={() => router.push({ pathname: '/collections/[id]/edit', params: { id: collection.id } })}
      />
      {actionError ? (
        <AppText accessibilityRole="alert" style={{ color: colors.danger }}>
          {actionError}
        </AppText>
      ) : null}
      <Button
        label="Delete collection"
        variant="danger"
        onPress={confirmDelete}
        loading={busy === 'delete'}
        disabled={busy !== null}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  card: { flex: 1 },
  iconButton: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
});
