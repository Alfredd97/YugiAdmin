import { create } from 'zustand';
import { CurrencySettings } from '../types/store';
import type { CurrencyMultipliers } from '../types/store';
import { pb } from '../utils/pocketbase';

interface SettingsStore {
  settings: CurrencySettings;
  settingsRecordId: string | null;
  isLoading: boolean;
  error: string | null;
  setSettings: (settings: CurrencySettings) => Promise<void>;
  updateSettings: (partial: Partial<CurrencySettings>) => Promise<void>;
  restore: () => Promise<void>;
}

type CurrencySettingsRecord = {
  id: string;
  basePriceUsd: number;
  cupPerUsd: number;
  autoPriceEnabled: boolean;
  multipliers: CurrencyMultipliers;
};

const COLLECTION = 'currency_settings';

const recordToSettings = (record: CurrencySettingsRecord): CurrencySettings =>
  new CurrencySettings({
    basePriceUsd: record.basePriceUsd,
    cupPerUsd: record.cupPerUsd,
    autoPriceEnabled: record.autoPriceEnabled,
    multipliers: record.multipliers
  });

const ensureSettingsRecord = async (): Promise<CurrencySettingsRecord> => {
  const list = await pb.collection(COLLECTION).getList<CurrencySettingsRecord>(1, 1, {
    sort: '-created'
  });
  if (list.items.length > 0) return list.items[0];

  const seed = new CurrencySettings();
  return await pb.collection(COLLECTION).create<CurrencySettingsRecord>({
    basePriceUsd: seed.basePriceUsd,
    cupPerUsd: seed.cupPerUsd,
    autoPriceEnabled: seed.autoPriceEnabled,
    multipliers: seed.multipliers
  });
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: new CurrencySettings(),
  settingsRecordId: null,
  isLoading: false,
  error: null,
  setSettings: async (settings: CurrencySettings) => {
    const id = get().settingsRecordId ?? (await ensureSettingsRecord()).id;
    await pb.collection(COLLECTION).update(id, settings);
    set({ settings, settingsRecordId: id, error: null });
  },
  updateSettings: async (partial: Partial<CurrencySettings>) => {
    const next = new CurrencySettings({ ...get().settings, ...partial });
    await get().setSettings(next);
  },
  restore: async () => {
    set({ isLoading: true, error: null });
    try {
      const record = await ensureSettingsRecord();
      set({
        settings: recordToSettings(record),
        settingsRecordId: record.id,
        isLoading: false,
        error: null
      });
    } catch (err) {
      console.error(err);
      set({
        isLoading: false,
        error:
          'Failed to load currency settings from PocketBase. Check your "currency_settings" collection.'
      });
    }
  }
}));

