import { useRouter } from 'expo-router';
import { PetForm } from '@/src/components/PetForm';
import { Screen } from '@/src/components/Screen';
import { emptyPetForm } from '@/src/services/petService';
import { usePetStore } from '@/src/stores/petStore';
import { toDisplayDate } from '@/src/utils/dates';

export function NewPetScreen() {
  const router = useRouter();
  const create = usePetStore((state) => state.create);

  return (
    <Screen>
      <PetForm
        initialValues={{ ...emptyPetForm, arrivalDate: toDisplayDate(new Date()) }}
        submitLabel="Save pet"
        onSubmit={async (values) => {
          const pet = await create(values);
          router.replace({ pathname: '/pets/[id]', params: { id: pet.id } });
        }}
      />
    </Screen>
  );
}
