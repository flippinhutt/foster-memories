import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { Button } from '@/src/components/Button';
import { Screen } from '@/src/components/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/src/components/StateViews';
import { useCollectionStore } from '@/src/stores/collectionStore';
import { useMemoryStore } from '@/src/stores/memoryStore';
import { radius, spacing, touchTarget, useTheme } from '@/src/theme';

export function CollectionsScreen() {
  const router = useRouter();
  const colors = useTheme();
  const { collections, links, status, error, load } = useCollectionStore();
  const memories = useMemoryStore((state) => state.memories);
  const addCollection = () => router.push('/collections/new');

  if (status === 'idle' || status === 'loading') return <LoadingState label="Loading collections" />;
  if (status === 'error') return <ErrorState message={error ?? 'Could not load collections.'} onRetry={load} />;

  if (collections.length === 0) {
    return (
      <Screen scroll={false}>
        <EmptyState
          title="No collections yet"
          message="Create a collection such as ‘First Week’ or ‘Farewell.’"
          actionLabel="New collection"
          onAction={addCollection}
        />
      </Screen>
    );
  }

  const memoryIds = new Set(memories.map((memory) => memory.id));
  const count = (collectionId: string) =>
    links.filter((link) => link.collectionId === collectionId && memoryIds.has(link.memoryId)).length;

  return (
    <Screen scroll={false}>
      <FlatList
        data={collections}
        keyExtractor={(collection) => collection.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Button label="New collection" onPress={addCollection} />
          </View>
        }
        renderItem={({ item }) => {
          const n = count(item.id);
          const meta = `${n} ${n === 1 ? 'memory' : 'memories'}`;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${meta}`}
              onPress={() => router.push({ pathname: '/collections/[id]', params: { id: item.id } })}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && styles.pressed,
              ]}
            >
              <AppText variant="heading">{item.name}</AppText>
              {item.description ? <AppText muted numberOfLines={2}>{item.description}</AppText> : null}
              <AppText variant="caption" muted>
                {meta}
              </AppText>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, gap: spacing.md },
  header: { alignItems: 'flex-start' },
  card: { padding: spacing.md, borderRadius: radius.md, borderWidth: 1, gap: spacing.xs, minHeight: touchTarget },
  pressed: { opacity: 0.8 },
});
