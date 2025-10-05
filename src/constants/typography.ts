import { TextStyle } from 'react-native';

export const Typography = {
  // Heading font - Playfair Display style (serif)
  fontHeading: 'Georgia', // Fallback to Georgia since Playfair Display needs to be configured

  // Body font - Inter style (sans-serif)
  fontBody: 'System', // Using system font as fallback for Inter

  // Font sizes matching the spec
  fontSize: {
    xlarge: 20,
    large: 17,
    medium: 16,
    small: 14,
    xsmall: 12,
  },

  h1: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 58,
    letterSpacing: -0.5,
    fontFamily: 'Georgia', // Using serif for headings
  } as TextStyle,

  h2: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.4,
    fontFamily: 'Georgia',
  } as TextStyle,

  h3: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: -0.3,
    fontFamily: 'Georgia',
  } as TextStyle,

  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    letterSpacing: 0,
    fontFamily: 'System',
  } as TextStyle,

  small: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: 0,
    fontFamily: 'System',
  } as TextStyle,

  badge: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0.2,
    fontFamily: 'System',
  } as TextStyle,

  // Legacy support - mapping old names to new structure
  largeTitle: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 58,
    letterSpacing: -0.5,
    fontFamily: 'Georgia',
  } as TextStyle,

  title1: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.4,
    fontFamily: 'Georgia',
  } as TextStyle,

  title2: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: -0.3,
    fontFamily: 'Georgia',
  } as TextStyle,

  title3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 25,
    letterSpacing: -0.2,
    fontFamily: 'Georgia',
  } as TextStyle,

  headline: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: -0.1,
    fontFamily: 'System',
  } as TextStyle,

  callout: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 21,
    letterSpacing: 0,
    fontFamily: 'System',
  } as TextStyle,

  subheadline: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: 0,
    fontFamily: 'System',
  } as TextStyle,

  footnote: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: 0,
    fontFamily: 'System',
  } as TextStyle,

  caption1: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: 0,
    fontFamily: 'System',
  } as TextStyle,

  caption2: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 13,
    letterSpacing: 0,
    fontFamily: 'System',
  } as TextStyle,

  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: 0,
    fontFamily: 'System',
  } as TextStyle,

  // Font sizes matching the spec
  fontSize: {
    xlarge: 20,
    large: 17,
    medium: 16,
    small: 14,
    xsmall: 12,
  },
};
