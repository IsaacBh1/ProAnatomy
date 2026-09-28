import { create } from 'zustand'

export type ThemePreference = 'dark' | 'light' | 'system'

const STORAGE_KEY = 'pro-anatomy:theme'

function readStoredPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'dark' || value === 'light' || value === 'system') return value
  } catch {
    // Access can throw in private mode or when the user has blocked storage.
  }
  return 'system'
}

function writeStoredPreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, preference)
  } catch {
    // Best-effort: a failed write only loses the preference on next load.
  }
}

interface ThemeState {
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
  /** Flips between dark and light. From `system`, it flips away from whatever is currently shown. */
  toggle: () => void
}

export const useThemeStore = create<ThemeState>()((set, get) => ({
  preference: readStoredPreference(),

  setPreference: (preference) => {
    writeStoredPreference(preference)
    set({ preference })
  },

  toggle: () => {
    const { preference, setPreference } = get()
    if (preference === 'dark') return setPreference('light')
    if (preference === 'light') return setPreference('dark')

    // preference is 'system': go the other way from what the OS is currently saying.
    const systemPrefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    setPreference(systemPrefersDark ? 'light' : 'dark')
  },
}))
