import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { collectionFormSchema, type CollectionFormValues } from '@/src/services/collectionService';
import { spacing, useTheme } from '@/src/theme';
import { AppText } from './AppText';
import { Button } from './Button';
import { TextField } from './TextField';

interface Props {
  initialValues: CollectionFormValues;
  submitLabel: string;
  onSubmit: (values: CollectionFormValues) => Promise<void>;
}

export function CollectionForm({ initialValues, submitLabel, onSubmit }: Props) {
  const colors = useTheme();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<CollectionFormValues>({
    defaultValues: initialValues,
    resolver: zodResolver(collectionFormSchema),
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
        name="name"
        render={({ field, fieldState }) => (
          <TextField
            label="Name *"
            placeholder="First week"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="description"
        render={({ field, fieldState }) => (
          <TextField
            label="Description"
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
      <Button label={submitLabel} onPress={submit} loading={formState.isSubmitting} />
    </View>
  );
}
