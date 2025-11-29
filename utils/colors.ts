// Slack-inspired Deep Purple Color Scheme
export const colors = {
  // Primary deep purple colors
  aubergine: {
    50: '#F5F3F4',
    100: '#E8E4E6',
    200: '#D4CDD2',
    300: '#B5A9B0',
    400: '#8E7E88',
    500: '#611f69', // Primary aubergine
    600: '#4A154B', // Deep aubergine
    700: '#3D1140',
    800: '#2F0D34',
    900: '#1F0A24',
  },

  // Accent colors
  gold: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#ECB22E', // Slack gold
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  teal: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#2EB67D', // Slack teal green
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },

  // Status colors
  success: {
    light: '#6EE7B7',
    main: '#10B981',
    dark: '#047857',
  },

  error: {
    light: '#FCA5A5',
    main: '#EF4444',
    dark: '#B91C1C',
  },

  warning: {
    light: '#FCD34D',
    main: '#F59E0B',
    dark: '#D97706',
  },

  info: {
    light: '#93C5FD',
    main: '#3B82F6',
    dark: '#1E40AF',
  },

  // Neutral grays
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#0A0A0F',
  },
};

// Theme configuration
export const theme = {
  background: {
    primary: colors.aubergine[900],
    secondary: colors.aubergine[800],
    tertiary: colors.aubergine[700],
    canvas: colors.gray[900],
  },

  text: {
    primary: '#FFFFFF',
    secondary: colors.gray[300],
    tertiary: colors.gray[400],
    accent: colors.gold[500],
  },

  border: {
    default: `${colors.aubergine[500]}4D`, // 30% opacity
    hover: `${colors.aubergine[500]}80`, // 50% opacity
    active: colors.aubergine[500],
  },

  button: {
    primary: {
      background: `linear-gradient(135deg, ${colors.aubergine[600]}, ${colors.aubergine[700]})`,
      hover: `linear-gradient(135deg, ${colors.aubergine[500]}, ${colors.aubergine[600]})`,
      text: '#FFFFFF',
    },
    secondary: {
      background: `${colors.aubergine[600]}40`,
      hover: `${colors.aubergine[600]}60`,
      text: colors.gray[200],
    },
  },

  panel: {
    background: `${colors.aubergine[900]}CC`, // 80% opacity
    blur: 'backdrop-blur-md',
    border: `${colors.aubergine[500]}4D`,
  },
};

// CSS custom properties for easy integration
export const cssVariables = `
  :root {
    --color-aubergine-primary: ${colors.aubergine[600]};
    --color-aubergine-secondary: ${colors.aubergine[700]};
    --color-gold: ${colors.gold[500]};
    --color-teal: ${colors.teal[500]};

    --bg-primary: ${theme.background.primary};
    --bg-secondary: ${theme.background.secondary};
    --bg-canvas: ${theme.background.canvas};

    --text-primary: ${theme.text.primary};
    --text-secondary: ${theme.text.secondary};

    --border-default: ${theme.border.default};
    --border-hover: ${theme.border.hover};
  }
`;
