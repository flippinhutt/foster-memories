import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { AppText } from '@/src/components/AppText';
import { Button } from '@/src/components/Button';
import { OptionPicker } from '@/src/components/OptionPicker';
import { Screen } from '@/src/components/Screen';
import { EmptyState } from '@/src/components/StateViews';
import { getRepositories } from '@/src/db';
import { exportPetStory } from '@/src/services/exportFiles';
import { EXPORT_FORMATS, type ExportFormat } from '@/src/services/exportService';
import { selectPetById, usePetStore } from '@/src/stores/petStore';
import { useTheme } from '@/src/theme';

export function ExportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pet = usePetStore(selectPetById(id));
  const colors = useTheme();
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!pet) return <EmptyState title="Pet not found" message="It may have been deleted." />;

  const run = async () => {
    setError(null);
    setProgress('Starting…');
    try {
      await exportPetStory(await getRepositories(), pet.id, format, setProgress);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed. Please try again.');
    } finally {
      setProgress(null);
    }
  };

  return (
    <Screen>
      <AppText variant="title">Export {pet.name}’s story</AppText>
      <AppText muted>Files are made on this device and shared only where you choose.</AppText>
      <OptionPicker label="Format" options={EXPORT_FORMATS} value={format} onChange={setFormat} />
      <Button label="Export and share" onPress={run} loading={progress !== null} disabled={progress !== null} />
      {progress ? (
        <AppText muted accessibilityLiveRegion="polite">
          {progress}
        </AppText>
      ) : null}
      {error ? (
        <AppText accessibilityRole="alert" style={{ color: colors.danger }}>
          {error}
        </AppText>
      ) : null}
    </Screen>
  );
}
