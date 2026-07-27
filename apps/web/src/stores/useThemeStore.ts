import { create } from 'zustand';
import { ThemeMode } from '@inframap/domain';

const STORAGE_KEY = 'inframap-theme-mode';

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
  if (saved && ['light', 'dark', 'high-contrast'].includes(saved)) {
    return saved;
  }
  return 'light';
};

const applyThemeToDocument = (mode: ThemeMode) => {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', mode);
  }
};

interface ThemeState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const initialTheme = getInitialTheme();
applyThemeToDocument(initialTheme);

export const useThemeStore = create<ThemeState>((set) => ({
  themeMode: initialTheme,

  setThemeMode: (mode: ThemeMode) => {
    localStorage.setItem(STORAGE_KEY, mode);
    applyThemeToDocument(mode);
    set({ themeMode: mode });
  },
}));
