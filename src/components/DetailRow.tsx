import { StyleSheet, View } from 'react-native';
import { spacing } from '@/src/theme';
import { AppText } from './AppText';

export function DetailRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <AppText variant="label" muted>
        {label}
      </AppText>
      <AppText>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({ row: { gap: 2, marginBottom: spacing.sm } });
