import { useRouter } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { PetCard } from '@/src/components/PetCard';
import { Screen } from '@/src/components/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/src/components/StateViews';
import { usePetStore } from '@/src/stores/petStore';
import { greeting } from '@/src/utils/dates';

export function HomeScreen() {
  const router = useRouter();
  const { pets, status, error, load } = usePetStore();
  const activePets = pets.filter((pet) => pet.status === 'active');

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
          <Button label="Search memories" variant="secondary" onPress={() => router.push('/search')} />
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
