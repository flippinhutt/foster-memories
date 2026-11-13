import { useState } from 'react';
import { Image, StyleSheet, View, type ImageStyle, type StyleProp } from 'react-native';
import { radius, useTheme } from '@/src/theme';
import { AppText } from './AppText';

interface Props {
  /** A URI the Image component can load (see mediaUri). */
  uri: string;
  label: string;
  style: StyleProp<ImageStyle>;
}

/** A photo that shows a quiet placeholder when the file is missing or unreadable. */
export function MediaImage({ uri, label, style }: Props) {
  const colors = useTheme();
  const [failedUri, setFailedUri] = useState<string | null>(null);

  if (uri === failedUri) {
    return (
      <View
        style={[styles.box, { backgroundColor: colors.surfaceMuted }, style]}
        accessible
        accessibilityLabel={`${label} (unavailable)`}
      >
        <AppText variant="caption" muted>
          Photo unavailable
        </AppText>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      // Android: decode at view size; full-size photos exhaust bitmap memory and never draw.
      resizeMethod="resize"
      style={[styles.box, { backgroundColor: colors.surfaceMuted }, style]}
      accessibilityIgnoresInvertColors
      accessibilityLabel={label}
      onError={() => setFailedUri(uri)}
    />
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
