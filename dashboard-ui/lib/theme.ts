// In QML, these would be: Theme.colors.background, Theme.colors.card, etc.

export const colors = {
  // Base colors
  background: "#0a0e14",
  backgroundAlt: "#0f1419",
  foreground: "#e6e6e6",
  foregroundMuted: "#8b949e",

  // Card/Surface colors
  card: "#161b22",
  cardHover: "#1c2128",
  cardBorder: "#30363d",

  // Primary accent (blue)
  primary: "#3b82f6",
  primaryHover: "#2563eb",
  primaryLight: "rgba(59, 130, 246, 0.15)",
  primaryForeground: "#ffffff",

  // Success (green)
  success: "#22c55e",
  successLight: "rgba(34, 197, 94, 0.15)",
  successForeground: "#ffffff",

  // Warning (amber)
  warning: "#f59e0b",
  warningLight: "rgba(245, 158, 11, 0.15)",
  warningForeground: "#ffffff",

  // Destructive (red)
  destructive: "#ef4444",
  destructiveLight: "rgba(239, 68, 68, 0.15)",
  destructiveForeground: "#ffffff",

  // Info (cyan)
  info: "#06b6d4",
  infoLight: "rgba(6, 182, 212, 0.15)",
  infoForeground: "#ffffff",

  // Purple accent
  purple: "#a855f7",
  purpleLight: "rgba(168, 85, 247, 0.15)",
  purpleForeground: "#ffffff",
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
} as const

export const shadows = {
  sm: "0 1px 2px rgba(0, 0, 0, 0.3)",
  md: "0 4px 6px rgba(0, 0, 0, 0.3)",
  lg: "0 10px 15px rgba(0, 0, 0, 0.3)",
  xl: "0 20px 25px rgba(0, 0, 0, 0.4)",
  glow: {
    primary: "0 0 20px rgba(59, 130, 246, 0.3)",
    success: "0 0 20px rgba(34, 197, 94, 0.3)",
    purple: "0 0 20px rgba(168, 85, 247, 0.3)",
  },
} as const

// Typography - maps to QML font properties
export const typography = {
  fontFamily: {
    sans: "Inter, system-ui, sans-serif",
    mono: "Geist Mono, monospace",
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 14,
    lg: 16,
    xl: 18,
    "2xl": 22,
    "3xl": 28,
    "4xl": 36,
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const

export type ColorKey = keyof typeof colors
export type VariantKey = "primary" | "success" | "warning" | "destructive" | "info" | "purple"
