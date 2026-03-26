import { create } from 'zustand';
import { CurrencySettings } from '../types/store';
import { currencySettingsService } from '../services';

interface SettingsStore {
  settings: CurrencySettings;
  settingsRecordId: string | null;
  isLoading: boolean;
  error: string | null;
  setSettings: (settings: CurrencySettings) => Promise<void>;
  updateSettings: (partial: Partial<CurrencySettings>) => Promise<void>;
  restore: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: new CurrencySettings(),
  settingsRecordId: null,
  isLoading: false,
  error: null,
  setSettings: async (settings: CurrencySettings) => {
    console.log('[settingsStore] Setting settings...');
    try {
      const id = get().settingsRecordId ?? (await currencySettingsService.get()).id;
      await currencySettingsService.update(id, settings);
      set({ settings, settingsRecordId: id, error: null });
      console.log('[settingsStore] Settings saved');
    } catch (err: any) {
      console.error('[settingsStore] setSettings error:', err);
      set({ error: `Failed to save settings: ${err.message}` });
      throw err;
    }
  },
  updateSettings: async (partial: Partial<CurrencySettings>) => {
    console.log('[settingsStore] Updating settings...');
    try {
      const next = new CurrencySettings({ ...get().settings, ...partial });
      await get().setSettings(next);
    } catch (err: any) {
      console.error('[settingsStore] updateSettings error:', err);
      throw err;
    }
  },
  restore: async () => {
    console.log('[settingsStore] Restoring settings...');
    set({ isLoading: true, error: null });
    try {
      const { settings, id } = await currencySettingsService.get();
      console.log('[settingsStore] Settings restored:', settings);
      set({
        settings,
        settingsRecordId: id,
        isLoading: false,
        error: null
      });
    } catch (err: any) {
      console.error('[settingsStore] restore error:', err);
      set({
        isLoading: false,
        error: `Failed to load settings: ${err.message || 'Check console'}`
      });
    }
  }
}));

