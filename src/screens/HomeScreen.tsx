import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { MemoryCard } from '@/src/components/MemoryCard';
import { PetCard } from '@/src/components/PetCard';
import { Screen } from '@/src/components/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/src/components/StateViews';
import { useMemoryStore } from '@/src/stores/memoryStore';
import { usePetStore } from '@/src/stores/petStore';
import { greeting } from '@/src/utils/dates';
import { onThisDay } from '@/src/utils/timeline';
import { spacing } from '@/src/theme';

const ago = (years: number) => `${years} ${years === 1 ? 'year' : 'years'} ago`;

export function HomeScreen() {
  const router = useRouter();
  const { pets, status, error, load } = usePetStore();
  const memories = useMemoryStore((state) => state.memories);
  const activePets = pets.filter((pet) => pet.status === 'active');
  const past = onThisDay(memories, pets);
  const petName = (petId: string) => pets.find((pet) => pet.id === petId)?.name;

  if (status === 'idle' || status === 'loading') return <LoadingState />;
  if (status === 'error') return <ErrorState message={error ?? 'Could not load pets.'} onRetry={load} />;

  return (
    <Screen>
      <AppText variant="title">{greeting()}</AppText>
      {pets.length === 0 ? (
        <EmptyState
          title="Welcome to Foster Memories"
          message="Add your first foster to begin their story."
          actionLabel="Add pet"
          onAction={() => router.push('/pets/new')}
        />
      ) : (
        <>
          {activePets[0] ? (
            <Card>
              <AppText variant="heading">Add a memory about {activePets[0].name}</AppText>
              <Button
                label="Add memory"
                onPress={() => router.push({ pathname: '/add-memory', params: { petId: activePets[0].id } })}
              />
            </Card>
          ) : null}
          {past.memories.length > 0 || past.departures.length > 0 ? (
            <Card>
              <AppText variant="heading">On this day</AppText>
              {past.departures.map(({ pet, yearsAgo }) => (
                <AppText key={pet.id}>
                  {pet.name} left your care {ago(yearsAgo)} today.
                </AppText>
              ))}
              {past.memories.map(({ item, yearsAgo }) => (
                <View key={item.id} style={{ gap: spacing.xs }}>
                  <AppText variant="caption" muted>
                    {[petName(item.petId), ago(yearsAgo)].filter(Boolean).join(' · ')}
                  </AppText>
                  <MemoryCard
                    memory={item}
                    onPress={() => router.push({ pathname: '/memories/[id]', params: { id: item.id } })}
                  />
                </View>
              ))}
            </Card>
          ) : null}
          <Button label="Search memories"variant="secondary" onPress={() => router.push('/search')} />
          <AppText variant="heading">In your care</AppText>
          {activePets.length === 0 ? (
            <AppText muted>No pets in your care right now.</AppText>
          ) : (
            activePets.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                onPress={() => router.push({ pathname: '/pets/[id]', params: { id: pet.id } })}
              />
            ))
          )}
        </>
      )}
    </Screen>
  );
}
