import { pb } from '../utils/pocketbase';
import { CurrencySettings } from '../types/store';
import type { CurrencyMultipliers } from '../types/store';

type CurrencySettingsRecord = {
  id: string;
  base_price_usd: number;
  cup_per_usd: number;
  auto_price_enabled: boolean;
  multipliers: CurrencyMultipliers;
};

const COLLECTION = 'currency_settings';

const recordToSettings = (record: CurrencySettingsRecord): CurrencySettings =>
  new CurrencySettings({
    basePriceUsd: record.base_price_usd,
    cupPerUsd: record.cup_per_usd,
    autoPriceEnabled: record.auto_price_enabled,
    multipliers: record.multipliers
  });

const settingsToRecord = (settings: Partial<CurrencySettings>): Partial<Omit<CurrencySettingsRecord, 'id'>> => {
  const record: Partial<Omit<CurrencySettingsRecord, 'id'>> = {};
  if (settings.basePriceUsd !== undefined) record.base_price_usd = settings.basePriceUsd;
  if (settings.cupPerUsd !== undefined) record.cup_per_usd = settings.cupPerUsd;
  if (settings.autoPriceEnabled !== undefined) record.auto_price_enabled = settings.autoPriceEnabled;
  if (settings.multipliers !== undefined) record.multipliers = settings.multipliers;
  return record;
};

export const currencySettingsService = {
  async get(): Promise<{ settings: CurrencySettings; id: string }> {
    const list = await pb.collection(COLLECTION).getList<CurrencySettingsRecord>(1, 1, {
      sort: '-created'
    });

    if (list.items.length > 0) {
      return { settings: recordToSettings(list.items[0]), id: list.items[0].id };
    }

    // Create default if none exists
    const seed = new CurrencySettings();
    const created = await pb.collection(COLLECTION).create<CurrencySettingsRecord>({
      base_price_usd: seed.basePriceUsd,
      cup_per_usd: seed.cupPerUsd,
      auto_price_enabled: seed.autoPriceEnabled,
      multipliers: seed.multipliers
    });

    return { settings: recordToSettings(created), id: created.id };
  },

  async update(id: string, settings: Partial<CurrencySettings>): Promise<CurrencySettings> {
    const payload = settingsToRecord(settings);
    const updated = await pb.collection(COLLECTION).update<CurrencySettingsRecord>(id, payload);
    return recordToSettings(updated);
  }
};
