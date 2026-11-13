import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { Button } from '@/src/components/Button';
import { MediaImage } from '@/src/components/MediaImage';
import { OptionPicker } from '@/src/components/OptionPicker';
import { Screen } from '@/src/components/Screen';
import { EmptyState } from '@/src/components/StateViews';
import { getRepositories } from '@/src/db';
import { exportPetStory } from '@/src/services/exportFiles';
import { EXPORT_FORMATS, loadPetStory, storyPhotoPaths, type ExportFormat } from '@/src/services/exportService';
import { mediaUri } from '@/src/services/mediaFiles';
import { selectPetById, usePetStore } from '@/src/stores/petStore';
import { radius, spacing, useIsWide, useTheme } from '@/src/theme';

export function ExportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pet = usePetStore(selectPetById(id));
  const colors = useTheme();
  const wide = useIsWide();
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [skipped, setSkipped] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    let active = true;
    getRepositories()
      .then((repos) => loadPetStory(repos, id, new Date()))
      .then((story) => active && setPhotos(storyPhotoPaths(story)))
      // No photo list just means every photo is included.
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [id]);

  const toggle = (path: string) =>
    setSkipped((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  if (!pet) return <EmptyState title="Pet not found" message="It may have been deleted." />;

  const run = async () => {
    setError(null);
    setProgress('Starting…');
    try {
      await exportPetStory(await getRepositories(), pet.id, format, skipped, setProgress);
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
      {(format === 'pdf' || format === 'zip') && photos.length > 0 ? (
        <View style={styles.photos}>
          <AppText variant="label">
            Photos ({photos.length - skipped.size} of {photos.length})
          </AppText>
          <AppText variant="caption" muted>
            Tap a photo to leave it out.
          </AppText>
          <View style={styles.grid}>
            {photos.map((path, i) => {
              const included = !skipped.has(path);
              return (
                <Pressable
                  key={path}
                  onPress={() => toggle(path)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: included }}
                  accessibilityLabel={`Photo ${i + 1}`}
                  style={({ pressed }) => [
                    styles.tile,
                    wide && styles.tileWide,
                    { borderColor: included ? colors.primary : colors.outline },
                    pressed && styles.pressed,
                  ]}
                >
                  <MediaImage uri={mediaUri(path)} label={`Photo ${i + 1}`} style={[styles.thumb, !included && styles.off]} />
                  <View style={[styles.check, { backgroundColor: included ? colors.primary : colors.surfaceMuted }]}>
                    {included ? <Ionicons name="checkmark" size={16} color={colors.onPrimary} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
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

const styles = StyleSheet.create({
  pressed: { opacity: 0.6 },
  photos: { gap: spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: { width: 96, height: 96, borderWidth: 3, borderRadius: radius.md, overflow: 'hidden' },
  tileWide: { width: 128, height: 128 },
  thumb: { width: '100%', height: '100%', borderRadius: 0 },
  off: { opacity: 0.35 },
  check: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
