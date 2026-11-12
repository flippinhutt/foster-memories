import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { DetailRow } from '@/src/components/DetailRow';
import { Screen } from '@/src/components/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/src/components/StateViews';
import { StatusBadge } from '@/src/components/StatusBadge';
import { selectPetById, usePetStore } from '@/src/stores/petStore';
import { daysInCare, formatDate } from '@/src/utils/dates';
import { SEX_LABELS, petSummary } from '@/src/utils/petLabels';
import { spacing } from '@/src/theme';

export function PetDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const pet = usePetStore(selectPetById(id));
  const { status, error, load } = usePetStore();

  if (status === 'idle' || status === 'loading') return <LoadingState />;
  if (status === 'error') return <ErrorState message={error ?? 'Could not load this pet.'} onRetry={load} />;
  if (!pet) return <EmptyState title="Pet not found" message="This pet may have been removed." />;

  const days = daysInCare(pet.arrivalDate, pet.departureDate);

  return (
    <Screen>
      <Stack.Screen options={{ title: pet.name }} />
      <View style={styles.header}>
        <AppText variant="title">{pet.name}</AppText>
        {petSummary(pet) ? <AppText muted>{petSummary(pet)}</AppText> : null}
        <StatusBadge status={pet.status} />
        {days ? (
          <AppText muted>
            {days} {days === 1 ? 'day' : 'days'} in care
          </AppText>
        ) : null}
      </View>
      <Button
        label="Edit pet"
        variant="secondary"
        onPress={() => router.push({ pathname: '/pets/[id]/edit', params: { id: pet.id } })}
      />
      <Card>
        <DetailRow label="Sex" value={pet.sex ? SEX_LABELS[pet.sex] : null} />
        <DetailRow label="Arrived" value={pet.arrivalDate ? formatDate(pet.arrivalDate) : null} />
        <DetailRow label="Departed" value={pet.departureDate ? formatDate(pet.departureDate) : null} />
        <DetailRow label="Backstory" value={pet.backstory} />
        <DetailRow label="Personality" value={pet.personality} />
        <DetailRow label="Notes" value={pet.notes} />
      </Card>
      <Card>
        <AppText variant="heading">Story</AppText>
        <AppText muted>No memories yet. Capture their first day, a funny moment, or a small win.</AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({ header: { gap: spacing.xs } });
