import { useLocalSearchParams, useRouter } from 'expo-router';
import { MemoryForm } from '@/src/components/MemoryForm';
import { Screen } from '@/src/components/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/src/components/StateViews';
import { toMemoryFormValues } from '@/src/services/memoryService';
import { useMemoryDetail, useMemoryStore } from '@/src/stores/memoryStore';
import { usePetStore } from '@/src/stores/petStore';

export function EditMemoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, retry } = useMemoryDetail(id);
  const pets = usePetStore((s) => s.pets);
  const update = useMemoryStore((s) => s.update);

  if (state.status === 'loading') return <LoadingState />;
  if (state.status === 'error') return <ErrorState message={state.message} onRetry={retry} />;
  if (state.status === 'missing') {
    return <EmptyState title="Memory not found" message="This memory may have been removed." />;
  }

  const { memory, photos, tags } = state.detail;
  return (
    <Screen>
      <MemoryForm
        pets={pets}
        initialValues={toMemoryFormValues(memory, photos, tags)}
        submitLabel="Save changes"
        onSubmit={async (values) => {
          await update(memory, values);
          router.back();
        }}
      />
    </Screen>
  );
}
