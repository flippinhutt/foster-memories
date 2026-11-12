import Constants from 'expo-constants';
import { useState } from 'react';
import { Platform } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { Screen } from '@/src/components/Screen';
import { getRepositories } from '@/src/db';
import { createBackup, restoreBackup } from '@/src/services/backupFiles';
import { useCollectionStore } from '@/src/stores/collectionStore';
import { useMemoryStore } from '@/src/stores/memoryStore';
import { useMilestoneStore } from '@/src/stores/milestoneStore';
import { usePetStore } from '@/src/stores/petStore';
import { useTheme } from '@/src/theme';

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function SettingsScreen() {
  const colors = useTheme();
  const [progress, setProgress] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (task: () => Promise<string | null>) => {
    setError(null);
    setMessage(null);
    setProgress('Starting…');
    try {
      setMessage(await task());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setProgress(null);
    }
  };

  const backUp = () =>
    run(async () => {
      await createBackup(await getRepositories(), setProgress);
      return null;
    });

  const restore = () =>
    run(async () => {
      const result = await restoreBackup(await getRepositories(), setProgress);
      if (!result) return null;
      await Promise.all([
        usePetStore.getState().load(),
        useMemoryStore.getState().load(),
        useMilestoneStore.getState().load(),
        useCollectionStore.getState().load(),
      ]);
      return result.pets + result.memories === 0
        ? 'Everything in that backup is already here.'
        : `Restored ${count(result.pets, 'pet', 'pets')} and ${count(result.memories, 'memory', 'memories')}.`;
    });

  return (
    <Screen>
      <Card>
        <AppText variant="heading">Your data</AppText>
        <AppText muted>
          {Platform.OS === 'web'
            ? 'Everything stays in this browser on this computer. No account, no cloud, no tracking. Clearing site data erases it, so back up now and then.'
            : 'Everything stays on this device. No account, no cloud, no tracking.'}
        </AppText>
      </Card>
      <Card>
        <AppText variant="heading">Backup</AppText>
        <AppText muted>
          One file with every pet, memory, and photo. Save it somewhere safe, like your computer.
        </AppText>
        <Button label="Back up everything" onPress={backUp} loading={progress !== null} disabled={progress !== null} />
        <Button
          label="Restore from backup"
          variant="secondary"
          onPress={restore}
          disabled={progress !== null}
          accessibilityHint="Adds pets and memories from a backup file. Nothing here is changed or removed."
        />
        <AppText variant="caption" muted>
          Restoring only adds what isn’t here yet. Nothing already here is changed or removed.
        </AppText>
        {progress ? (
          <AppText muted accessibilityLiveRegion="polite">
            {progress}
          </AppText>
        ) : null}
        {message ? <AppText accessibilityLiveRegion="polite">{message}</AppText> : null}
        {error ? (
          <AppText accessibilityRole="alert" style={{ color: colors.danger }}>
            {error}
          </AppText>
        ) : null}
      </Card>
      <Card>
        <AppText variant="heading">Coming soon</AppText>
        <AppText muted>Theme settings.</AppText>
      </Card>
      <AppText variant="caption" muted>
        Version {Constants.expoConfig?.version ?? 'unknown'}
      </AppText>
    </Screen>
  );
}
