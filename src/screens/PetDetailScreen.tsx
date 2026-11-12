import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { DetailRow } from '@/src/components/DetailRow';
import { PetAvatar } from '@/src/components/PetAvatar';
import { Screen } from '@/src/components/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/src/components/StateViews';
import { StatusBadge } from '@/src/components/StatusBadge';
import { pickPhoto } from '@/src/services/photoPicker';
import { selectPetById, usePetStore } from '@/src/stores/petStore';
import { confirmDestructive } from '@/src/utils/confirm';
import { daysInCare, formatDate } from '@/src/utils/dates';
import { SEX_LABELS, petSummary } from '@/src/utils/petLabels';
import { spacing, useTheme } from '@/src/theme';

type Busy = 'cover' | 'delete' | null;

export function PetDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const pet = usePetStore(selectPetById(id));
  const { status, error, load, setCover, remove } = usePetStore();
  const colors = useTheme();
  const [busy, setBusy] = useState<Busy>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (status === 'idle' || status === 'loading') return <LoadingState />;
  if (status === 'error') return <ErrorState message={error ?? 'Could not load this pet.'} onRetry={load} />;
  if (!pet) return <EmptyState title="Pet not found" message="This pet may have been removed." />;

  const days = daysInCare(pet.arrivalDate, pet.departureDate);

  const chooseCover = async () => {
    setActionError(null);
    try {
      const photo = await pickPhoto();
      if (!photo) return;
      setBusy('cover');
      await setCover(pet, photo);
    } catch {
      setActionError('Could not save that photo. Please try another one.');
    } finally {
      setBusy(null);
    }
  };

  const confirmDelete = async () => {
    setActionError(null);
    const confirmed = await confirmDestructive(
      `Delete ${pet.name}?`,
      'This removes their profile, memories, milestones, and photos saved in this app. Photos in your gallery are not touched. This can’t be undone.',
      'Delete',
    );
    if (!confirmed) return;
    setBusy('delete');
    try {
      await remove(pet.id);
      router.back();
    } catch {
      setActionError(`Could not delete ${pet.name}. Please try again.`);
      setBusy(null);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: pet.name }} />
      <View style={styles.header}>
        <PetAvatar pet={pet} size={160} />
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
        label={pet.coverPhotoPath ? 'Change cover photo' : 'Add cover photo'}
        variant="secondary"
        onPress={chooseCover}
        loading={busy === 'cover'}
        disabled={busy !== null}
      />
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
      {actionError ? (
        <AppText accessibilityRole="alert" style={{ color: colors.danger }}>
          {actionError}
        </AppText>
      ) : null}
      <Button
        label="Delete pet"
        variant="danger"
        onPress={confirmDelete}
        loading={busy === 'delete'}
        disabled={busy !== null}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({ header: { gap: spacing.xs } });
