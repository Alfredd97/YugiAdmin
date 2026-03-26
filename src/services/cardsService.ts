import { pb } from '../utils/pocketbase';
import type { CardItem, BaseItem } from '../types/store';

type PbCardRecord = {
  id: string;
  name: string;
  seller_name: string;
  game_format: string;
  condition: string;
  expansion_code: string;
  rarity: string;
  quantity: number;
  price_usd: number;
  price_cup: number;
};

const COLLECTION = 'cards';

const mapPbToCard = (record: PbCardRecord): CardItem => ({
  id: record.id,
  name: record.name,
  sellerName: record.seller_name,
  gameFormat: record.game_format,
  condition: record.condition,
  expansionCode: record.expansion_code,
  rarity: record.rarity,
  quantity: record.quantity,
  priceUsd: record.price_usd,
  priceCup: record.price_cup
});

const mapCardToPb = (item: Omit<BaseItem, 'id'>): Omit<PbCardRecord, 'id'> => ({
  name: item.name,
  seller_name: item.sellerName,
  game_format: item.gameFormat,
  condition: item.condition,
  expansion_code: item.expansionCode,
  rarity: item.rarity,
  quantity: item.quantity,
  price_usd: item.priceUsd,
  price_cup: item.priceCup
});

export const cardsService = {
  async listAll(): Promise<CardItem[]> {
    console.log('[cardsService] Fetching cards from PocketBase...');
    console.log('[cardsService] PocketBase URL:', pb.baseUrl);

    try {
      const pageSize = 200;
      let page = 1;
      const all: CardItem[] = [];

      while (true) {
        console.log(`[cardsService] Fetching page ${page}...`);
        const result = await pb.collection(COLLECTION).getList<PbCardRecord>(page, pageSize, {
          sort: '-created'
        });
        console.log(`[cardsService] Page ${page}: got ${result.items.length} items`);
        all.push(...result.items.map(mapPbToCard));
        if (result.page >= result.totalPages) break;
        page += 1;
      }

      console.log(`[cardsService] Total cards fetched: ${all.length}`);
      return all;
    } catch (error: any) {
      console.error('[cardsService] Error fetching cards:', error);
      console.error('[cardsService] Error status:', error.status);
      console.error('[cardsService] Error message:', error.message);
      console.error('[cardsService] Error data:', error.data);
      throw error;
    }
  },

  async create(item: Omit<BaseItem, 'id'>): Promise<CardItem> {
    const payload = mapCardToPb(item);
    const created = await pb.collection(COLLECTION).create<PbCardRecord>(payload);
    return mapPbToCard(created);
  },

  async update(id: string, item: Partial<Omit<BaseItem, 'id'>>): Promise<CardItem> {
    const payload: Partial<Omit<PbCardRecord, 'id'>> = {};
    if (item.name !== undefined) payload.name = item.name;
    if (item.sellerName !== undefined) payload.seller_name = item.sellerName;
    if (item.gameFormat !== undefined) payload.game_format = item.gameFormat;
    if (item.condition !== undefined) payload.condition = item.condition;
    if (item.expansionCode !== undefined) payload.expansion_code = item.expansionCode;
    if (item.rarity !== undefined) payload.rarity = item.rarity;
    if (item.quantity !== undefined) payload.quantity = item.quantity;
    if (item.priceUsd !== undefined) payload.price_usd = item.priceUsd;
    if (item.priceCup !== undefined) payload.price_cup = item.priceCup;
    const updated = await pb.collection(COLLECTION).update<PbCardRecord>(id, payload);
    return mapPbToCard(updated);
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id);
  },

  async deleteAll(): Promise<void> {
    const items = await this.listAll();
    await Promise.all(items.map((item) => pb.collection(COLLECTION).delete(item.id)));
  },

  async createMany(items: Array<Omit<BaseItem, 'id'>>): Promise<CardItem[]> {
    const created = await Promise.all(items.map((item) => this.create(item)));
    return created;
  }
};
