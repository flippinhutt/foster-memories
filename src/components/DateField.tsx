import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { parseDisplayDate, toDisplayDate } from '@/src/utils/dates';
import { radius, touchTarget, useTheme } from '@/src/theme';
import { TextField } from './TextField';

interface Props {
  label: string;
  /** MM-DD-YYYY or empty. */
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
}

/** Date typed as MM-DD-YYYY, or picked from a calendar on Android/iOS. */
export function DateField({ label, value, onChange, onBlur, error }: Props) {
  const colors = useTheme();
  const [open, setOpen] = useState(false);
  // shortcut: the native picker has no web version; web uses typing only until Phase 2.
  const canPick = Platform.OS !== 'web';

  return (
    <>
      <TextField
        label={label}
        placeholder="MM-DD-YYYY"
        hint="MM-DD-YYYY"
        keyboardType="numbers-and-punctuation"
        maxLength={10}
        value={value}
        onChangeText={onChange}
        onBlur={onBlur}
        error={error}
        accessory={
          canPick ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Choose ${label.toLowerCase()} from calendar`}
              onPress={() => setOpen(true)}
              style={[styles.button, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <Ionicons name="calendar-outline" size={22} color={colors.primary} />
            </Pressable>
          ) : null
        }
      />
      {open ? (
        <DateTimePicker
          mode="date"
          value={parseDisplayDate(value) ?? new Date()}
          onChange={(event, date) => {
            setOpen(false);
            if (event.type === 'set' && date) onChange(toDisplayDate(date));
          }}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: touchTarget,
    height: touchTarget,
    borderWidth: 1,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
