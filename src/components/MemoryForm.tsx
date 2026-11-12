import Ionicons from '@expo/vector-icons/Ionicons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, type Control } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { mediaUri } from '@/src/services/mediaFiles';
import { memoryFormSchema, type DraftPhoto, type MemoryFormValues } from '@/src/services/memoryService';
import { pickPhotos } from '@/src/services/photoPicker';
import { MEMORY_MOODS } from '@/src/types/memory';
import type { Pet } from '@/src/types/pet';
import { MOOD_LABELS } from '@/src/utils/memoryLabels';
import { radius, spacing, touchTarget, useTheme } from '@/src/theme';
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

function PhotoField({ value, onChange }: { value: DraftPhoto[]; onChange: (photos: DraftPhoto[]) => void }) {
  const colors = useTheme();
  const [error, setError] = useState<string | null>(null);

  const add = async () => {
    setError(null);
    try {
      const picked = await pickPhotos();
      onChange([...value, ...picked.map((photo): DraftPhoto => ({ kind: 'new', photo }))]);
    } catch {
      setError('Could not open your photos. Please try again.');
    }
  };

  return (
    <View style={styles.field}>
      <AppText variant="label">Photos</AppText>
      {value.length > 0 ? (
        <ScrollView horizontal contentContainerStyle={styles.photos}>
          {value.map((draft, index) => (
            <View key={draft.kind === 'saved' ? draft.media.id : draft.photo.uri}>
              <MediaImage uri={photoUri(draft)} label={`Photo ${index + 1}`} style={styles.thumb} />
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
          ))}
        </ScrollView>
      ) : null}
      <Button label="Add photos" variant="secondary" onPress={add} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  photos: { gap: spacing.sm },
  thumb: { width: 96, height: 96 },
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
