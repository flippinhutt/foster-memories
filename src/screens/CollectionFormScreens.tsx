import { useLocalSearchParams, useRouter } from 'expo-router';
import { CollectionForm } from '@/src/components/CollectionForm';
import { Screen } from '@/src/components/Screen';
import { EmptyState } from '@/src/components/StateViews';
import { emptyCollectionForm } from '@/src/services/collectionService';
import { selectCollectionById, useCollectionStore } from '@/src/stores/collectionStore';

export function NewCollectionScreen() {
  const router = useRouter();
  const create = useCollectionStore((state) => state.create);
  return (
    <Screen>
      <CollectionForm
        initialValues={emptyCollectionForm}
        submitLabel="Create collection"
        onSubmit={async (values) => {
          const collection = await create(values);
          router.replace({ pathname: '/collections/[id]', params: { id: collection.id } });
        }}
      />
    </Screen>
  );
}

export function EditCollectionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const collection = useCollectionStore(selectCollectionById(id));
  const update = useCollectionStore((state) => state.update);

  if (!collection) return <EmptyState title="Collection not found" message="It may have been deleted." />;

  return (
    <Screen>
      <CollectionForm
        initialValues={{ name: collection.name, description: collection.description ?? '' }}
        submitLabel="Save changes"
        onSubmit={async (values) => {
          await update(collection, values);
          router.back();
        }}
      />
    </Screen>
  );
}
