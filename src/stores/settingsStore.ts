import { create } from 'zustand';
import type { UserSettings } from '@/types/user';

interface SettingsState {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  persistToDB: () => Promise<void>;
}

const defaultSettings: UserSettings = {
  user_id: '',
  theme: 'system',
  auto_play_audio: true,
  haptic_feedback: true,
  font_size: 'medium',
  notifications_enabled: true,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,

  updateSetting: (key, value) =>
    set((state) => ({
      settings: { ...state.settings, [key]: value },
    })),

  persistToDB: async () => {
    // TODO: save to SQLite (Phase 0)
  },
}));
