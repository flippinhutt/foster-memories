import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import {
  milestoneFormSchema,
  PRESET_MILESTONES,
  type MilestoneFormValues,
} from '@/src/services/milestoneService';
import type { MemorySummary } from '@/src/types/memory';
import { formatDate } from '@/src/utils/dates';
import { spacing, useTheme } from '@/src/theme';
import { AppText } from './AppText';
import { Button } from './Button';
import { DateField } from './DateField';
import { OptionPicker } from './OptionPicker';
import { TextField } from './TextField';

const PRESET_OPTIONS = PRESET_MILESTONES.map((label) => ({ value: label as string, label }));

interface Props {
  /** The pet's memories, offered as optional links. */
  memories: MemorySummary[];
  initialValues: MilestoneFormValues;
  onSubmit: (values: MilestoneFormValues) => Promise<void>;
}

export function MilestoneForm({ memories, initialValues, onSubmit }: Props) {
  const colors = useTheme();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<MilestoneFormValues>({
    defaultValues: initialValues,
    resolver: zodResolver(milestoneFormSchema),
  });
  // shortcut: one chip per memory; switch to a searchable list if pets get hundreds of memories.
  const memoryOptions = [
    { value: '', label: 'None' },
    ...memories.map((memory) => ({
      value: memory.id,
      label: `${memory.title ?? memory.body ?? 'Photo memory'} · ${formatDate(memory.occurredAt)}`,
    })),
  ];

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
        name="label"
        render={({ field, fieldState }) => (
          <>
            <OptionPicker
              label="Suggestions"
              options={PRESET_OPTIONS}
              value={field.value}
              onChange={field.onChange}
            />
            <TextField
              label="Milestone *"
              placeholder="First time on the couch"
              hint="Pick a suggestion or write your own"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          </>
        )}
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
      {memories.length > 0 ? (
        <Controller
          control={control}
          name="memoryId"
          render={({ field }) => (
            <OptionPicker
              label="Linked memory"
              options={memoryOptions}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      ) : null}
      <Controller
        control={control}
        name="notes"
        render={({ field, fieldState }) => (
          <TextField
            label="Notes"
            multiline
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
      {submitError ? (
        <AppText accessibilityRole="alert" style={{ color: colors.danger }}>
          {submitError}
        </AppText>
      ) : null}
      <Button label="Save milestone" onPress={submit} loading={formState.isSubmitting} />
    </View>
  );
}
