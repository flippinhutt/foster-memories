import { Text, type TextProps } from 'react-native';
import { typography, useTheme } from '@/src/theme';

interface Props extends TextProps {
  variant?: keyof typeof typography;
  muted?: boolean;
}

export function AppText({ variant = 'body', muted = false, style, ...rest }: Props) {
  const colors = useTheme();
  return (
    <Text
      style={[typography[variant], { color: muted ? colors.textMuted : colors.text }, style]}
      {...rest}
    />
  );
}
