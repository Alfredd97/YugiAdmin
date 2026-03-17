import type { CardRarity, BaseItem } from '../types/store';
import { CurrencySettings } from '../types/store';

export const calculateUsdPrice = (
  rarity: CardRarity,
  settings: CurrencySettings
): number => {
  const multiplier = settings.multipliers[rarity];
  return Number((settings.basePriceUsd * multiplier).toFixed(2));
};

export const calculateCupPrice = (usd: number, settings: CurrencySettings): number =>
  Number((usd * settings.cupPerUsd).toFixed(2));

export const autoPriceItem = <T extends BaseItem>(
  item: T,
  settings: CurrencySettings
): T => {
  const priceUsd = calculateUsdPrice(item.rarity, settings);
  const priceCup = calculateCupPrice(priceUsd, settings);
  return { ...item, priceUsd, priceCup };
};

export const applyPricingToItems = <T extends BaseItem>(
  items: T[],
  settings: CurrencySettings
): T[] => items.map((item) => autoPriceItem(item, settings));

