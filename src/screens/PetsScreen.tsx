import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button } from '@/src/components/Button';
import { PetCard } from '@/src/components/PetCard';
import { Screen } from '@/src/components/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/src/components/StateViews';
import { usePetStore } from '@/src/stores/petStore';
import { spacing } from '@/src/theme';

export function PetsScreen() {
  const router = useRouter();
  const { pets, status, error, load } = usePetStore();
  const addPet = () => router.push('/pets/new');

  if (status === 'idle' || status === 'loading') return <LoadingState label="Loading pets" />;
  if (status === 'error') return <ErrorState message={error ?? 'Could not load pets.'} onRetry={load} />;

  if (pets.length === 0) {
    return (
      <Screen scroll={false}>
        <EmptyState
          title="No foster pets yet"
          message="Add your first foster to begin their story."
          actionLabel="Add pet"
          onAction={addPet}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <FlatList
        data={pets}
        keyExtractor={(pet) => pet.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Button label="Add pet" onPress={addPet} />
          </View>
        }
        renderItem={({ item }) => (
          <PetCard pet={item} onPress={() => router.push({ pathname: '/pets/[id]', params: { id: item.id } })} />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, gap: spacing.md },
  header: { alignItems: 'flex-start' },
});
