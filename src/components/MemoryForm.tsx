import Ionicons from '@expo/vector-icons/Ionicons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState, type ComponentRef } from 'react';
import { Controller, useForm, type Control } from 'react-hook-form';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { mediaUri } from '@/src/services/mediaFiles';
import { memoryFormSchema, type DraftPhoto, type MemoryFormValues } from '@/src/services/memoryService';
import { usePhotoDrop } from '@/src/services/photoDrop';
import { pickPhotos, type PickedPhoto } from '@/src/services/photoPicker';
import { SAVE_SHORTCUT_HINT, useSaveShortcut } from '@/src/services/saveShortcut';
import { MEMORY_MOODS } from '@/src/types/memory';
import type { Pet } from '@/src/types/pet';
import { MOOD_LABELS } from '@/src/utils/memoryLabels';
import { radius, spacing, touchTarget, useIsWide, useTheme } from '@/src/theme';
import { AppText } from './AppText';
import { Button } from './Button';
import { DateField } from './DateField';
import { MediaImage } from './MediaImage';
import { OptionPicker } from './OptionPicker';
import { TextField } from './TextField';

const MOOD_OPTIONS = [
  { value: '' as const, label: 'None' },
  ...MEMORY_MOODS.map((value) => ({ value, label: MOOD_LABELS[value] })),
];

type TextFieldName = 'title' | 'body' | 'location' | 'tags';

interface FieldProps {
  control: Control<MemoryFormValues>;
  name: TextFieldName;
  label: string;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
}

function FormTextField({ control, name, label, placeholder, hint, multiline }: FieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          label={label}
          placeholder={placeholder}
          hint={hint}
          multiline={multiline}
          value={field.value}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

const photoUri = (draft: DraftPhoto) => (draft.kind === 'saved' ? mediaUri(draft.media.localUri) : draft.photo.uri);
const photoKey = (draft: DraftPhoto) => (draft.kind === 'saved' ? draft.media.id : draft.photo.uri);

function PhotoField({ value, onChange }: { value: DraftPhoto[]; onChange: (photos: DraftPhoto[]) => void }) {
  const colors = useTheme();
  const wide = useIsWide();
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ReadonlySet<string> | null>(null);
  const zone = useRef<ComponentRef<typeof View>>(null);

  const append = (photos: PickedPhoto[]) =>
    onChange([...value, ...photos.map((photo): DraftPhoto => ({ kind: 'new', photo }))]);

  const dragging = usePhotoDrop(zone, (photos, skipped) => {
    setError(skipped > 0 ? `${skipped} ${skipped === 1 ? 'file wasn’t' : 'files weren’t'} a photo this browser can read.` : null);
    append(photos);
  });

  const add = async () => {
    setError(null);
    try {
      append(await pickPhotos());
    } catch {
      setError('Could not open your photos. Please try again.');
    }
  };

  const toggle = (key: string) => {
    const next = new Set(selected);
    if (!next.delete(key)) next.add(key);
    setSelected(next);
  };

  const removeSelected = () => {
    onChange(value.filter((draft) => !selected?.has(photoKey(draft))));
    setSelected(null);
  };

  const thumb = wide ? styles.thumbWide : styles.thumb;

  return (
    <View
      ref={zone}
      style={[styles.field, dragging && [styles.dropping, { borderColor: colors.primary, backgroundColor: colors.surfaceMuted }]]}
    >
      <AppText variant="label">Photos</AppText>
      {value.length > 0 ? (
        <ScrollView horizontal={!wide} contentContainerStyle={[styles.photos, wide && styles.wrap]}>
          {value.map((draft, index) => {
            const key = photoKey(draft);
            const image = <MediaImage uri={photoUri(draft)} label={`Photo ${index + 1}`} style={thumb} />;
            if (selected) {
              const checked = selected.has(key);
              return (
                <Pressable
                  key={key}
                  onPress={() => toggle(key)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                  accessibilityLabel={`Photo ${index + 1}`}
                  style={[styles.pick, { borderColor: checked ? colors.danger : 'transparent' }]}
                >
                  {image}
                  {checked ? (
                    <View style={[styles.remove, { backgroundColor: colors.danger, borderColor: colors.danger }]}>
                      <Ionicons name="checkmark" size={20} color={colors.onPrimary} />
                    </View>
                  ) : null}
                </Pressable>
              );
            }
            return (
              <View key={key}>
                {image}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove photo ${index + 1}`}
                  onPress={() => onChange(value.filter((_, i) => i !== index))}
                  hitSlop={(touchTarget - 32) / 2}
                  style={[styles.remove, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Ionicons name="close" size={20} color={colors.text} />
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      ) : null}
      {selected ? (
        <View style={styles.row}>
          <View style={styles.grow}>
            <Button
              label={selected.size === 0 ? 'Tap photos to remove' : `Remove ${selected.size} ${selected.size === 1 ? 'photo' : 'photos'}`}
              variant="danger"
              onPress={removeSelected}
              disabled={selected.size === 0}
            />
          </View>
          <View style={styles.grow}>
            <Button label="Done" variant="secondary" onPress={() => setSelected(null)} />
          </View>
        </View>
      ) : (
        <View style={styles.row}>
          <View style={styles.grow}>
            <Button label="Add photos" variant="secondary" onPress={add} />
          </View>
          {value.length > 1 ? (
            <View style={styles.grow}>
              <Button label="Select photos" variant="secondary" onPress={() => setSelected(new Set())} />
            </View>
          ) : null}
        </View>
      )}
      {Platform.OS === 'web' ? (
        <AppText variant="caption" muted>
          {dragging ? 'Drop to add these photos.' : 'Or drag photos here.'}
        </AppText>
      ) : null}
      {error ? (
        <AppText variant="caption" accessibilityRole="alert" style={{ color: colors.danger }}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

interface Props {
  pets: Pick<Pet, 'id' | 'name'>[];
  initialValues: MemoryFormValues;
  submitLabel: string;
  onSubmit: (values: MemoryFormValues) => Promise<void>;
}

export function MemoryForm({ pets, initialValues, submitLabel, onSubmit }: Props) {
  const colors = useTheme();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<MemoryFormValues>({
    defaultValues: initialValues,
    resolver: zodResolver(memoryFormSchema),
  });

  const submit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not save. Please try again.');
    }
  });
  useSaveShortcut(() => {
    if (!formState.isSubmitting) void submit();
  });

  return (
    <View style={{ gap: spacing.md }}>
      <Controller
        control={control}
        name="petId"
        render={({ field, fieldState }) => (
          <View style={styles.field}>
            <OptionPicker
              label="Pet"
              options={pets.map((pet) => ({ value: pet.id, label: pet.name }))}
              value={field.value}
              onChange={field.onChange}
            />
            {fieldState.error ? (
              <AppText variant="caption" style={{ color: colors.danger }}>
                {fieldState.error.message}
              </AppText>
            ) : null}
          </View>
        )}
      />
      <Controller
        control={control}
        name="photos"
        render={({ field }) => <PhotoField value={field.value} onChange={field.onChange} />}
      />
      <Controller
        control={control}
        name="occurredAt"
        render={({ field, fieldState }) => (
          <DateField
            label="Date"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
      <FormTextField control={control} name="title" label="Title" placeholder="First walk in the park" />
      <FormTextField
        control={control}
        name="body"
        label="Note"
        placeholder="What happened? How did they seem?"
        multiline
      />
      <Controller
        control={control}
        name="mood"
        render={({ field }) => (
          <OptionPicker label="Mood" options={MOOD_OPTIONS} value={field.value} onChange={field.onChange} />
        )}
      />
      <FormTextField control={control} name="tags" label="Tags" hint="Separate with commas" />
      <FormTextField control={control} name="location" label="Location" />
      <Controller
        control={control}
        name="isFavorite"
        render={({ field }) => (
          <View style={styles.switchRow}>
            <AppText variant="label">Favorite</AppText>
            <Switch
              accessibilityLabel="Favorite"
              value={field.value}
              onValueChange={field.onChange}
              trackColor={{ true: colors.primary }}
            />
          </View>
        )}
      />
      {submitError ? (
        <AppText accessibilityRole="alert" style={{ color: colors.danger }}>
          {submitError}
        </AppText>
      ) : null}
      <Button label={submitLabel} onPress={submit} loading={formState.isSubmitting} />
      {SAVE_SHORTCUT_HINT ? (
        <AppText variant="caption" muted style={styles.center}>
          {SAVE_SHORTCUT_HINT}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  dropping: { borderWidth: 2, borderStyle: 'dashed', borderRadius: radius.md, padding: spacing.sm, margin: -spacing.sm - 2 },
  photos: { gap: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  thumb: { width: 96, height: 96 },
  thumbWide: { width: 128, height: 128 },
  pick: { borderWidth: 3, borderRadius: radius.sm + 3 },
  row: { flexDirection: 'row', gap: spacing.sm },
  grow: { flex: 1 },
  center: { textAlign: 'center' },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: touchTarget,
  },
});
