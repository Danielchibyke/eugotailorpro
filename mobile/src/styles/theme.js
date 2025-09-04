export const COLORS = {
  primary: '#141f3f',
  primaryLight: 'rgba(22, 35, 71, 0.501)',
  darkPrimary: '#b88f83',
  darkPrimaryHover: '#05032fa9',
  accent: '#f39c12',
  textDark: '#333333',
  textMedium: '#666666',
  textLight: '#dce1ff',
  backgroundApp: '#f5f5f5',
  backgroundCard: '#ffffff',
  border: '#e0e0e0',
  success: '#28a745',
  error: '#dc3545',
  white: '#ffffff',
  overlayBackground: 'rgba(0,0,0,0.5)',
  danger: 'red'
};

export const FONT_SIZES = {
  h1: 38,
  h2: 32,
  h3: 26,
  lg: 20,
  body: 16,
  small: 14,
  button: 18,
};

export const SPACING = {
  xs: 5,
  sm: 10,
  md: 20,
  lg: 30,
  xl: 40,
};

export const BORDERRADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 15,
  xxl: 20,
  xxxl: 30,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

export const theme = {
  COLORS,
  FONT_SIZES,
  SPACING,
  BORDERRADIUS,
  SHADOWS,
};

export default theme;
