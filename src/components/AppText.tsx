import { Platform, StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';
import { typography, useTheme } from '@/src/theme';

interface Props extends TextProps {
  variant?: keyof typeof typography;
  muted?: boolean;
}

// Some OEM system fonts (e.g. Nothing) measure narrower than they draw, so the last word gets clipped.
// A named family makes measure and draw agree. 'sans-serif' with weight 500/600 renders regular, so use medium.
function androidFamily(weight: unknown): string {
  return weight === '500' || weight === '600' ? 'sans-serif-medium' : 'sans-serif';
}

export function AppText({ variant = 'body', muted = false, style, ...rest }: Props) {
  const colors = useTheme();
  const base: TextStyle = typography[variant];
  const flat = StyleSheet.flatten([base, { color: muted ? colors.textMuted : colors.text }, style]);
  const family = Platform.OS === 'android' && !flat?.fontFamily ? { fontFamily: androidFamily(flat?.fontWeight) } : null;
  return <Text style={[flat, family]} {...rest} />;
}
