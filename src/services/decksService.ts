import { pb } from '../utils/pocketbase';
import type { DeckItem, BaseItem } from '../types/store';

type PbDeckRecord = {
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

const COLLECTION = 'decks';

const mapPbToDeck = (record: PbDeckRecord): DeckItem => ({
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

const mapDeckToPb = (item: Omit<BaseItem, 'id'>): Omit<PbDeckRecord, 'id'> => ({
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

export const decksService = {
  async listAll(): Promise<DeckItem[]> {
    const pageSize = 200;
    let page = 1;
    const all: DeckItem[] = [];

    while (true) {
      const result = await pb.collection(COLLECTION).getList<PbDeckRecord>(page, pageSize, {
        sort: '-created'
      });
      all.push(...result.items.map(mapPbToDeck));
      if (result.page >= result.totalPages) break;
      page += 1;
    }

    return all;
  },

  async create(item: Omit<BaseItem, 'id'>): Promise<DeckItem> {
    const payload = mapDeckToPb(item);
    const created = await pb.collection(COLLECTION).create<PbDeckRecord>(payload);
    return mapPbToDeck(created);
  },

  async update(id: string, item: Partial<Omit<BaseItem, 'id'>>): Promise<DeckItem> {
    const payload: Partial<Omit<PbDeckRecord, 'id'>> = {};
    if (item.name !== undefined) payload.name = item.name;
    if (item.sellerName !== undefined) payload.seller_name = item.sellerName;
    if (item.gameFormat !== undefined) payload.game_format = item.gameFormat;
    if (item.condition !== undefined) payload.condition = item.condition;
    if (item.expansionCode !== undefined) payload.expansion_code = item.expansionCode;
    if (item.rarity !== undefined) payload.rarity = item.rarity;
    if (item.quantity !== undefined) payload.quantity = item.quantity;
    if (item.priceUsd !== undefined) payload.price_usd = item.priceUsd;
    if (item.priceCup !== undefined) payload.price_cup = item.priceCup;
    const updated = await pb.collection(COLLECTION).update<PbDeckRecord>(id, payload);
    return mapPbToDeck(updated);
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id);
  },

  async deleteAll(): Promise<void> {
    const items = await this.listAll();
    await Promise.all(items.map((item) => pb.collection(COLLECTION).delete(item.id)));
  },

  async createMany(items: Array<Omit<BaseItem, 'id'>>): Promise<DeckItem[]> {
    const created = await Promise.all(items.map((item) => this.create(item)));
    return created;
  }
};
