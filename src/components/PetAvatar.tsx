import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { mediaUri } from '@/src/services/mediaFiles';
import { radius, useTheme } from '@/src/theme';
import type { Pet } from '@/src/types/pet';
import { AppText } from './AppText';

interface Props {
  pet: Pick<Pet, 'name' | 'coverPhotoPath'>;
  size: number;
}

/** Cover photo, or the pet's initial when there is none or the file is missing. */
export function PetAvatar({ pet, size }: Props) {
  const colors = useTheme();
  const [failedPath, setFailedPath] = useState<string | null>(null);
  const path = pet.coverPhotoPath;
  const box = { width: size, height: size, backgroundColor: colors.surfaceMuted };

  if (path && path !== failedPath) {
    return (
      <Image
        source={{ uri: mediaUri(path) }}
        style={[styles.box, box]}
        accessibilityIgnoresInvertColors
        accessibilityLabel={`Cover photo of ${pet.name}`}
        onError={() => setFailedPath(path)}
      />
    );
  }
  return (
    <View style={[styles.box, box]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <AppText variant="heading" style={{ color: colors.primary, fontSize: size / 2.5, lineHeight: size / 2 }}>
        {pet.name.charAt(0).toUpperCase()}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
