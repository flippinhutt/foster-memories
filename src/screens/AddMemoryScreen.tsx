import { useRouter } from 'expo-router';
import { Screen } from '@/src/components/Screen';
import { EmptyState } from '@/src/components/StateViews';
import { usePetStore } from '@/src/stores/petStore';

export function AddMemoryScreen() {
  const router = useRouter();
  const hasPets = usePetStore((state) => state.pets.length > 0);

  return (
    <Screen scroll={false}>
      {hasPets ? (
        <EmptyState
          title="Memories are on the way"
          message="Soon you’ll add photos and notes here in a few taps."
        />
      ) : (
        <EmptyState
          title="Add a pet first"
          message="Every memory belongs to a foster. Add your first one to begin their story."
          actionLabel="Add pet"
          onAction={() => router.push('/pets/new')}
        />
      )}
    </Screen>
  );
}
