/** LinguaForge design tokens — deep teal primary, orange accent */
export const colors = {
  primary: {
    DEFAULT: '#0D9488',
    50:  '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#14B8A6',
    600: '#0D9488',
    700: '#0F766E',
    800: '#115E59',
    900: '#134E4A',
  },
  accent: {
    DEFAULT: '#F97316',
    light:   '#FED7AA',
    dark:    '#C2410C',
  },
  success:  '#22C55E',
  error:    '#EF4444',
  warning:  '#F59E0B',
  neutral: {
    50:  '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type ColorToken = typeof colors;
