import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, type Control } from 'react-hook-form';
import { View } from 'react-native';
import { petFormSchema, type PetFormValues } from '@/src/services/petService';
import { PET_SEXES, PET_STATUSES } from '@/src/types/pet';
import { SEX_LABELS, STATUS_LABELS } from '@/src/utils/petLabels';
import { spacing, useTheme } from '@/src/theme';
import { AppText } from './AppText';
import { Button } from './Button';
import { DateField } from './DateField';
import { OptionPicker } from './OptionPicker';
import { TextField } from './TextField';

const STATUS_OPTIONS = PET_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }));
const SEX_OPTIONS = [
  { value: '' as const, label: 'Not set' },
  ...PET_SEXES.map((value) => ({ value, label: SEX_LABELS[value] })),
];

type TextFieldName = Exclude<keyof PetFormValues, 'sex' | 'status' | 'arrivalDate' | 'departureDate'>;

interface FieldProps {
  control: Control<PetFormValues>;
  name: TextFieldName;
  label: string;
  placeholder?: string;
  multiline?: boolean;
}

function FormTextField({ control, name, label, placeholder, multiline }: FieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          label={label}
          placeholder={placeholder}
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

interface DateFieldProps {
  control: Control<PetFormValues>;
  name: 'arrivalDate' | 'departureDate';
  label: string;
}

function FormDateField({ control, name, label }: DateFieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <DateField
          label={label}
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

interface Props {
  initialValues: PetFormValues;
  submitLabel: string;
  onSubmit: (values: PetFormValues) => Promise<void>;
}

export function PetForm({ initialValues, submitLabel, onSubmit }: Props) {
  const colors = useTheme();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<PetFormValues>({
    defaultValues: initialValues,
    resolver: zodResolver(petFormSchema),
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
      <FormTextField control={control} name="name" label="Name *" placeholder="Luna" />
      <FormTextField control={control} name="species" label="Species" placeholder="Dog, cat, rabbit…" />
      <FormTextField control={control} name="breed" label="Breed or mix" />
      <Controller
        control={control}
        name="sex"
        render={({ field }) => (
          <OptionPicker label="Sex" options={SEX_OPTIONS} value={field.value} onChange={field.onChange} />
        )}
      />
      <FormTextField control={control} name="approximateAge" label="Approximate age" placeholder="About 2 years" />
      <Controller
        control={control}
        name="status"
        render={({ field }) => (
          <OptionPicker label="Status" options={STATUS_OPTIONS} value={field.value} onChange={field.onChange} />
        )}
      />
      <FormDateField control={control} name="arrivalDate" label="Arrival date" />
      <FormDateField control={control} name="departureDate" label="Departure date" />
      <FormTextField
        control={control}
        name="backstory"
        label="Backstory or first impressions"
        placeholder="Where they came from, how they seemed on day one…"
        multiline
      />
      <FormTextField control={control} name="personality" label="Personality" multiline />
      <FormTextField control={control} name="notes" label="Notes" multiline />
      {submitError ? (
        <AppText accessibilityRole="alert" style={{ color: colors.danger }}>
          {submitError}
        </AppText>
      ) : null}
      <Button label={submitLabel} onPress={submit} loading={formState.isSubmitting} />
    </View>
  );
}
