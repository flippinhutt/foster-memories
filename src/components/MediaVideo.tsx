import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { radius, useTheme } from '@/src/theme';
import { AppText } from './AppText';

interface Props {
  /** A URI the player can load (see mediaUri). */
  uri: string;
  label: string;
  style: StyleProp<ViewStyle>;
}

/** A video clip with system controls; paused until tapped. Missing files show a quiet placeholder. */
export function MediaVideo({ uri, label, style }: Props) {
  const colors = useTheme();
  const player = useVideoPlayer(uri);
  const { status } = useEvent(player, 'statusChange', { status: player.status });

  if (status === 'error') {
    return (
      <View
        style={[styles.box, { backgroundColor: colors.surfaceMuted }, style]}
        accessible
        accessibilityLabel={`${label} (unavailable)`}
      >
        <AppText variant="caption" muted>
          Video unavailable
        </AppText>
      </View>
    );
  }
  return (
    <VideoView
      player={player}
      nativeControls
      contentFit="contain"
      accessibilityLabel={label}
      style={[styles.box, { backgroundColor: colors.surfaceMuted }, style]}
    />
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
