export const Colors = {
  primary: '#DC143C',
  primaryDark: '#A01028',
  primaryLight: '#E84568',
  secondary: '#1E1E1E',
  secondaryLight: '#2D2D2D',
  accent: '#FFD700',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  background: '#0A0A0A',
  backgroundSecondary: '#141414',
  backgroundTertiary: '#1E1E1E',

  surface: '#1A1A1A',
  surfaceLight: '#252525',
  surfaceHover: '#333333',

  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textMuted: '#6B6B6B',

  border: '#333333',
  borderLight: '#444444',

  fire: '#FF4500',
  medical: '#00CED1',
  police: '#4169E1',
  accident: '#FF8C00',
};

// Font families - uses system defaults on native, web-safe fonts on web
export const Fonts = {
  heading: undefined as undefined,
  body: undefined as undefined,
};

export const FontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 32,
  display: 48,
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
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const MedicalEmergencyTypes = {
  cardiac_arrest: {
    id: 'cardiac_arrest',
    label: 'Cardiac Arrest',
    subtitle: 'CPR & resuscitation',
    emoji: '❤️',
    gradientStart: '#3A0005',
    gradientEnd: '#74070E',
    tip: 'Begin CPR immediately — 30 hard compressions, 2 rescue breaths. Do not stop until help arrives.',
  },
  breathing_difficulty: {
    id: 'breathing_difficulty',
    label: 'Breathing Difficulty',
    subtitle: 'Airway management',
    emoji: '🌬️',
    gradientStart: '#001a3a',
    gradientEnd: '#0a4a8a',
    tip: 'Sit the person upright and loosen clothing. Assist with inhaler if available. Do not lay them flat.',
  },
  accident_trauma: {
    id: 'accident_trauma',
    label: 'Accident / Trauma',
    subtitle: 'Wound care & stabilization',
    emoji: '🩹',
    gradientStart: '#1A001A',
    gradientEnd: '#4A0030',
    tip: 'Do not move the person. Apply firm pressure to wounds using a clean cloth. Keep them warm and still.',
  },
  seizure: {
    id: 'seizure',
    label: 'Seizure',
    subtitle: 'Safety & timing steps',
    emoji: '⚡',
    gradientStart: '#1A1200',
    gradientEnd: '#5A4400',
    tip: 'Clear the area. Do not restrain. Cushion the head. Time the seizure carefully.',
  },
  poisoning: {
    id: 'poisoning',
    label: 'Poisoning',
    subtitle: "Do's & don'ts",
    emoji: '☠️',
    gradientStart: '#001A00',
    gradientEnd: '#0A4A0A',
    tip: 'Do not induce vomiting. Keep the person still and conscious. Collect any containers nearby.',
  },
  maternity: {
    id: 'maternity',
    label: 'Maternity',
    subtitle: 'Labour support',
    emoji: '🤱',
    gradientStart: '#1A0012',
    gradientEnd: '#6B0035',
    tip: 'Keep the mother calm and lying down. Do not attempt delivery unless birth is clearly imminent.',
  },
  other: {
    id: 'other',
    label: 'Other Emergency',
    subtitle: "Select if your emergency doesn't fit the above types",
    emoji: '🆘',
    gradientStart: '#0A0A0A',
    gradientEnd: '#2A2A2A',
    tip: 'Stay calm. Ensure safety. Monitor breathing and consciousness until help arrives.',
  },
} as const;

export type MedicalEmergencyType = keyof typeof MedicalEmergencyTypes;

// Legacy — kept for backward compatibility with existing emergency report flow
export const EmergencyTypes = {
  fire: { id: 'fire', label: 'Fire', color: Colors.fire, icon: 'flame' },
  medical: { id: 'medical', label: 'Medical', color: Colors.medical, icon: 'heart-pulse' },
  police: { id: 'police', label: 'Police', color: Colors.police, icon: 'shield' },
  accident: { id: 'accident', label: 'Accident', color: Colors.accident, icon: 'car' },
} as const;

export type EmergencyType = keyof typeof EmergencyTypes;
