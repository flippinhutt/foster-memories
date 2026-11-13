import { Platform, useColorScheme, useWindowDimensions } from 'react-native';

const light = {
  background: '#FBF7F2',
  surface: '#FFFFFF',
  surfaceMuted: '#F3EBE1',
  text: '#2E2620',
  textMuted: '#6B5E53',
  primary: '#A4532F',
  onPrimary: '#FFFFFF',
  border: '#E3D7CA',
  /** Edges of inputs and tappable controls; at least 3:1 against background and surfaces. */
  outline: '#93816F',
  danger: '#B3261E',
  success: '#2F6B3F',
};

const dark: typeof light = {
  background: '#1C1815',
  surface: '#272220',
  surfaceMuted: '#332C28',
  text: '#F4ECE4',
  textMuted: '#BFB2A6',
  primary: '#E39A72',
  onPrimary: '#2A140A',
  border: '#463C35',
  outline: '#857568',
  danger: '#F2B8B5',
  success: '#9FD3A9',
};

export type ThemeColors = typeof light;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 8, md: 14, lg: 20, pill: 999 } as const;
export const typography = {
  title: { fontSize: 28, fontWeight: '700' },
  heading: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22 },
  label: { fontSize: 14, fontWeight: '600' },
  caption: { fontSize: 13 },
} as const;
/** Wide windows (web on desktop, tablets) get a sidebar and bigger photo grids. */
export function useIsWide(): boolean {
  return useWindowDimensions().width >= 768;
}

/** Minimum touch target: 48dp on Android, 44pt on iOS and web. */
export const touchTarget = Platform.OS === 'android' ? 48 : 44;

export function useTheme(): ThemeColors {
  return useColorScheme() === 'dark' ? dark : light;
}
