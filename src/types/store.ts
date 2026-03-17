export type GameFormat = 'TCG' | 'OCG';

export type CardCondition =
  | 'Near Mint'
  | 'Lightly Played'
  | 'Moderately Played'
  | 'Heavily Played'
  | 'Damaged';

export type CardRarity =
  | 'Common'
  | 'Rare'
  | 'Super Rare'
  | 'Ultra Rare'
  | 'Secret Rare'
  | 'Prismatic Secret Rare';

export interface BaseItem {
  id: string;
  name: string;
  sellerName: string;
  gameFormat: GameFormat;
  condition: CardCondition;
  expansionCode: string;
  rarity: CardRarity;
  quantity: number;
  priceUsd: number;
  priceCup: number;
}

export interface CardItem extends BaseItem {}

export interface DeckItem extends BaseItem {}

export interface AccessoryItem extends BaseItem {}

export type ItemType = 'card' | 'deck' | 'accessory';

export interface CurrencyMultipliers {
  Common: number;
  Rare: number;
  'Super Rare': number;
  'Ultra Rare': number;
  'Secret Rare': number;
  'Prismatic Secret Rare': number;
}

export class CurrencySettings {
  basePriceUsd: number;
  multipliers: CurrencyMultipliers;
  cupPerUsd: number;
  autoPriceEnabled: boolean;

  constructor(params?: Partial<CurrencySettings>) {
    this.basePriceUsd = params?.basePriceUsd ?? 1;
    this.multipliers = params?.multipliers ?? {
      Common: 1,
      Rare: 1.5,
      'Super Rare': 2.5,
      'Ultra Rare': 4,
      'Secret Rare': 8,
      'Prismatic Secret Rare': 15
    };
    this.cupPerUsd = params?.cupPerUsd ?? 350;
    this.autoPriceEnabled = params?.autoPriceEnabled ?? true;
  }
}

export interface AuthStateShape {
  isAuthenticated: boolean;
  username: string | null;
}

