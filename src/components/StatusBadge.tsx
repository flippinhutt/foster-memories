import { StyleSheet, View } from 'react-native';
import type { PetStatus } from '@/src/types/pet';
import { STATUS_LABELS } from '@/src/utils/petLabels';
import { radius, spacing, useTheme } from '@/src/theme';
import { AppText } from './AppText';

export function StatusBadge({ status }: { status: PetStatus }) {
  const colors = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: colors.surfaceMuted }]}>
      <AppText variant="caption" style={{ color: status === 'active' ? colors.success : colors.textMuted }}>
        {STATUS_LABELS[status]}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
});
