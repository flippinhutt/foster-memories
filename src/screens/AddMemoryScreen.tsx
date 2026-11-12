import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { MemoryForm } from '@/src/components/MemoryForm';
import { Screen } from '@/src/components/Screen';
import { EmptyState } from '@/src/components/StateViews';
import { emptyMemoryForm } from '@/src/services/memoryService';
import { useMemoryStore } from '@/src/stores/memoryStore';
import { usePetStore } from '@/src/stores/petStore';
import { toDisplayDate } from '@/src/utils/dates';

export function AddMemoryScreen() {
  const router = useRouter();
  const { petId } = useLocalSearchParams<{ petId?: string }>();
  const pets = usePetStore((state) => state.pets);
  const create = useMemoryStore((state) => state.create);
  // Bumped after each save so the tab shows a fresh form next time.
  const [saved, setSaved] = useState(0);

  if (pets.length === 0) {
    return (
      <Screen scroll={false}>
        <EmptyState
          title="Add a pet first"
          message="Every memory belongs to a foster. Add your first one to begin their story."
          actionLabel="Add pet"
          onAction={() => router.push('/pets/new')}
        />
      </Screen>
    );
  }

  const defaultPet =
    pets.find((pet) => pet.id === petId) ?? pets.find((pet) => pet.status === 'active') ?? pets[0];

  return (
    <Screen>
      <MemoryForm
        key={`${defaultPet.id}-${saved}`}
        pets={pets}
        initialValues={{ ...emptyMemoryForm, petId: defaultPet.id, occurredAt: toDisplayDate(new Date()) }}
        submitLabel="Save memory"
        onSubmit={async (values) => {
          const memory = await create(values);
          setSaved((n) => n + 1);
          router.push({ pathname: '/memories/[id]', params: { id: memory.id } });
        }}
      />
    </Screen>
  );
}
