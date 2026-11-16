import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/src/components/AppText';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { DetailRow } from '@/src/components/DetailRow';
import { MemoryCard } from '@/src/components/MemoryCard';
import { MilestoneCard } from '@/src/components/MilestoneCard';
import { PetAvatar } from '@/src/components/PetAvatar';
import { Screen } from '@/src/components/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/src/components/StateViews';
import { StatusBadge } from '@/src/components/StatusBadge';
import { pickPhoto } from '@/src/services/photoPicker';
import { useMemoryStore } from '@/src/stores/memoryStore';
import { useMilestoneStore } from '@/src/stores/milestoneStore';
import { selectPetById, usePetStore } from '@/src/stores/petStore';
import { confirmDestructive } from '@/src/utils/confirm';
import { daysInCare, formatDate } from '@/src/utils/dates';
import { SEX_LABELS, petSummary } from '@/src/utils/petLabels';
import { buildTimeline } from '@/src/utils/timeline';
import { radius, spacing, touchTarget, useTheme } from '@/src/theme';

type Busy = 'cover' | 'delete' | 'milestone' | null;

export function PetDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const pet = usePetStore(selectPetById(id));
  const { status, error, load, setCover, remove } = usePetStore();
  const memoryStore = useMemoryStore();
  const milestoneStore = useMilestoneStore();
  const colors = useTheme();
  const [busy, setBusy] = useState<Busy>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const insets = useSafeAreaInsets();

  if (status === 'idle' || status === 'loading') return <LoadingState />;
  if (status === 'error') return <ErrorState message={error ?? 'Could not load this pet.'} onRetry={load} />;
  if (!pet) return <EmptyState title="Pet not found" message="This pet may have been removed." />;

  const days = daysInCare(pet.arrivalDate, pet.departureDate);
  const memories = memoryStore.memories.filter((memory) => memory.petId === pet.id);
  const milestones = milestoneStore.milestones.filter((milestone) => milestone.petId === pet.id);
  const timeline = buildTimeline(memories, milestones);
  const memoryTitle = (memoryId: string | null) => {
    const memory = memories.find((m) => m.id === memoryId);
    return memory ? (memory.title ?? memory.body ?? 'Photo memory') : undefined;
  };
  const openMemory = (memoryId: string) => router.push({ pathname: '/memories/[id]', params: { id: memoryId } });

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

  const deleteMilestone = async (milestoneId: string, label: string) => {
    setActionError(null);
    const confirmed = await confirmDestructive(`Delete “${label}”?`, 'Its linked memory is kept.', 'Delete');
    if (!confirmed) return;
    setBusy('milestone');
    try {
      await milestoneStore.remove(milestoneId);
    } catch {
      setActionError('Could not delete that milestone. Please try again.');
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

  const details: [string, string | null][] = [
    ['Sex', pet.sex ? SEX_LABELS[pet.sex] : null],
    ['Arrived', pet.arrivalDate ? formatDate(pet.arrivalDate) : null],
    ['Departed', pet.departureDate ? formatDate(pet.departureDate) : null],
    ['Backstory', pet.backstory],
    ['Personality', pet.personality],
    ['Notes', pet.notes],
  ];
  const hasDetails = details.some(([, value]) => value);

  const headerActions = () => (
    <View style={styles.headerActions}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={pet.coverPhotoPath ? 'Change cover photo' : 'Add cover photo'}
        accessibilityState={{ disabled: busy !== null, busy: busy === 'cover' }}
        disabled={busy !== null}
        onPress={chooseCover}
        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
      >
        {busy === 'cover' ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Ionicons name="image-outline" size={24} color={colors.text} />
        )}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit pet"
        onPress={() => router.push({ pathname: '/pets/[id]/edit', params: { id: pet.id } })}
        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
      >
        <Ionicons name="create-outline" size={24} color={colors.text} />
      </Pressable>
    </View>
  );

  return (
    <View style={styles.fill}>
      <Stack.Screen options={{ title: pet.name, headerRight: headerActions }} />
      <Screen>
        <View style={styles.header}>
          <PetAvatar pet={pet} size={120} />
          <AppText variant="title">{pet.name}</AppText>
          {petSummary(pet) ? <AppText muted>{petSummary(pet)}</AppText> : null}
          <StatusBadge status={pet.status} />
          {days ? (
            <AppText muted>
              {days} {days === 1 ? 'day' : 'days'} in care
            </AppText>
          ) : null}
        </View>
        {actionError ? (
          <AppText accessibilityRole="alert" style={{ color: colors.danger }}>
            {actionError}
          </AppText>
        ) : null}
        <Card>
          <AppText variant="heading">Story</AppText>
          {memoryStore.status === 'error' || milestoneStore.status === 'error' ? (
            <AppText style={{ color: colors.danger }}>
              Could not load the story. {memoryStore.error ?? milestoneStore.error}
            </AppText>
          ) : timeline.length === 0 ? (
            <AppText muted>No memories yet. Capture their first day, a funny moment, or a small win.</AppText>
          ) : (
            timeline.map((group) => (
              <View key={group.title} style={styles.group}>
                <AppText variant="label" muted accessibilityRole="header">
                  {group.title}
                </AppText>
                {group.entries.map((entry) =>
                  entry.kind === 'memory' ? (
                    <MemoryCard key={entry.item.id} memory={entry.item} onPress={() => openMemory(entry.item.id)} />
                  ) : (
                    <MilestoneCard
                      key={entry.item.id}
                      milestone={entry.item}
                      memoryTitle={memoryTitle(entry.item.memoryId)}
                      onPress={
                        memoryTitle(entry.item.memoryId) ? () => openMemory(entry.item.memoryId ?? '') : undefined
                      }
                      action={
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Delete milestone ${entry.item.label}`}
                          disabled={busy !== null}
                          onPress={() => deleteMilestone(entry.item.id, entry.item.label)}
                          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
                        >
                          <Ionicons name="trash-outline" size={22} color={colors.danger} />
                        </Pressable>
                      }
                    />
                  ),
                )}
              </View>
            ))
          )}
          <Button
            label="Add milestone"
            variant="secondary"
            onPress={() => router.push({ pathname: '/pets/[id]/milestones/new', params: { id: pet.id } })}
          />
        </Card>
        {hasDetails ? (
          <Card>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="About"
              accessibilityState={{ expanded: aboutOpen }}
              onPress={() => setAboutOpen((open) => !open)}
              style={({ pressed }) => [styles.aboutToggle, pressed && styles.pressed]}
            >
              <AppText variant="heading">About</AppText>
              <Ionicons name={aboutOpen ? 'chevron-up' : 'chevron-down'} size={22} color={colors.text} />
            </Pressable>
            {aboutOpen ? details.map(([label, value]) => <DetailRow key={label} label={label} value={value} />) : null}
          </Card>
        ) : null}
        <Button
          label="Export story"
          variant="secondary"
          onPress={() => router.push({ pathname: '/pets/[id]/export', params: { id: pet.id } })}
        />
        <Button
          label="Delete pet"
          variant="danger"
          onPress={confirmDelete}
          loading={busy === 'delete'}
          disabled={busy !== null}
        />
        <View style={styles.fabSpacer} />
      </Screen>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add memory"
        onPress={() => router.push({ pathname: '/add-memory', params: { petId: pet.id } })}
        android_ripple={{ color: colors.onPrimary, foreground: true }}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: colors.primary, bottom: spacing.md + insets.bottom },
          pressed && styles.pressed,
        ]}
      >
        <Ionicons name="add" size={28} color={colors.onPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  pressed: { opacity: 0.6 },
  header: { gap: spacing.xs },
  headerActions: { flexDirection: 'row' },
  group: { gap: spacing.sm },
  iconButton: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
  aboutToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: touchTarget },
  fab: {
    position: 'absolute',
    right: spacing.md,
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    elevation: 4,
  },
  // Keeps the last button clear of the floating add button.
  fabSpacer: { height: 56 },
});
