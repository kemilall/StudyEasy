import { ViewStyle, TextStyle } from 'react-native';

export const DesignTokens = {
  // Spacing scale
  spacing: [0, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64],

  // Border radius scale
  radii: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    full: 9999,
  },

  // Shadow scale
  shadows: {
    sm: {
      shadowColor: 'rgba(17, 17, 17, 0.06)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 2,
    },
    md: {
      shadowColor: 'rgba(17, 17, 17, 0.08)',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 1,
      shadowRadius: 24,
      elevation: 4,
    },
    lg: {
      shadowColor: 'rgba(17, 17, 17, 0.10)',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 1,
      shadowRadius: 36,
      elevation: 6,
    },
  },

  // Brand gradient
  gradients: {
    brand: ['#C9B6E4', '#8FDDE7'], // lavender to blue
  },

  // Layout constants
  layout: {
    container: {
      maxWidth: 1280,
      paddingX: 24,
    },
    grid: {
      columns: 12,
      gutter: 8,
    },
    breakpoints: {
      xs: 0,
      sm: 480,
      md: 768,
      lg: 1024,
      xl: 1280,
    },
  },

  // Component-specific styles
  components: {
    Button: {
      variants: {
        primary: {
          backgroundColor: 'transparent', // Will use gradient
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 11,
          minHeight: 44,
        },
        secondary: {
          backgroundColor: '#F8F4EF',
          borderWidth: 1.5,
          borderColor: '#E7E2DB',
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 11,
          minHeight: 44,
        },
        ghost: {
          backgroundColor: 'transparent',
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 11,
          minHeight: 44,
        },
      },
      sizes: {
        md: {
          minHeight: 44,
          paddingHorizontal: 16,
        },
        lg: {
          minHeight: 52,
          paddingHorizontal: 20,
        },
      },
    },

    Card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 20,
      borderWidth: 0,
      borderColor: 'transparent',
    },

    SearchInput: {
      height: 40,
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: '#E7E2DB',
      paddingHorizontal: 16,
      backgroundColor: '#FFFFFF',
    },

    Pill: {
      height: 28,
      borderRadius: 9999,
      paddingHorizontal: 12,
      backgroundColor: '#F8F4EF',
      borderWidth: 1,
      borderColor: '#E7E2DB',
    },
  },
} as const;

// Helper function to get spacing value by index
export const getSpacing = (index: number): number => {
  return DesignTokens.spacing[index] || 0;
};

// Helper function to get shadow style
export const getShadow = (size: 'sm' | 'md' | 'lg'): ViewStyle => {
  return DesignTokens.shadows[size];
};

// Helper function to get radius value
export const getRadius = (size: keyof typeof DesignTokens.radii): number => {
  return DesignTokens.radii[size];
};

