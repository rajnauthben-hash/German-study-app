export const Colors = {
  primary: '#5B67F8',       // vibrant indigo
  primaryLight: '#EEF0FF',
  primaryDark: '#3D4ED4',
  secondary: '#FF6B6B',     // coral
  secondaryLight: '#FFE8E8',
  accent: '#FFD93D',        // warm yellow
  accentLight: '#FFFBE6',
  success: '#4CAF78',       // green
  successLight: '#E8F5EE',
  warning: '#FF9F43',       // orange
  warningLight: '#FFF3E0',
  error: '#FF5252',         // red
  errorLight: '#FFEBEB',

  background: '#F0F2FF',
  card: '#FFFFFF',
  cardShadow: '#C5CAE9',

  text: '#1A1A2E',
  textSecondary: '#4A4A6A',
  textLight: '#9B9BB4',
  textOnPrimary: '#FFFFFF',

  border: '#E8EAFF',
  divider: '#F0F2FF',

  german: '#5B67F8',        // color for German text
  english: '#4CAF78',       // color for English text
};

export const Typography = {
  fontSizeXS: 11,
  fontSizeSM: 13,
  fontSizeMD: 15,
  fontSizeLG: 17,
  fontSizeXL: 20,
  fontSize2XL: 24,
  fontSize3XL: 30,

  fontWeightRegular: '400' as const,
  fontWeightMedium: '500' as const,
  fontWeightSemiBold: '600' as const,
  fontWeightBold: '700' as const,
  fontWeightExtraBold: '800' as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

export const Shadows = {
  small: {
    shadowColor: '#5B67F8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  medium: {
    shadowColor: '#5B67F8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  large: {
    shadowColor: '#5B67F8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
};
