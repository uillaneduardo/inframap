export type ThemeMode = 'light' | 'dark' | 'high-contrast';

export interface UserPreferences {
  theme: ThemeMode;
  language: 'pt-BR' | 'en';
  defaultUnit: 'mm' | 'cm' | 'm';
  autoSaveIntervalMs: number;
}
