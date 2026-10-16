// src/data/settingsStore.js

export const DEFAULT_SETTINGS = {
  // Typing & Editor
  fontFamily: 'JetBrains Mono',
  fontSize: 15,
  cursorStyle: 'line',
  soundEffect: 'mechanical',
  blindMode: false,
  liveWpm: true,
  smoothCaret: true,
  highlightMode: 'subtle',

  // Appearance
  theme: 'dark',
  accentTint: 'cobalt',
  compactRows: false,
  highContrast: false,

  // Notifications
  raceInvites: true,
  streakAlerts: true,
  friendMilestones: true,

  // Privacy
  publicProfile: true,
  shareTelemetry: false,
};

const SETTINGS_KEY = 'codetype_user_settings_v1';

export function getStoredSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to load settings', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveStoredSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}
