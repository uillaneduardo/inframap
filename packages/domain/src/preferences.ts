export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'pt-BR' | 'en';
  defaultUnit: 'mm' | 'cm' | 'm';
  autoSaveIntervalMs: number;
}
