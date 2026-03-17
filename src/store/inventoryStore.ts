import { create } from 'zustand';
import type { CardItem, DeckItem, AccessoryItem, BaseItem } from '../types/store';
import { applyPricingToItems } from '../utils/pricing';
import { useSettingsStore } from './settingsStore';
import { pb } from '../utils/pocketbase';

type Kind = 'card' | 'deck' | 'accessory';

type CollectionName = 'cards' | 'decks' | 'accessories';

const collectionByKind: Record<Kind, CollectionName> = {
  card: 'cards',
  deck: 'decks',
  accessory: 'accessories'
};

type PbItemRecord = Omit<BaseItem, 'id'> & { id: string };

interface InventoryStore {
  cards: CardItem[];
  decks: DeckItem[];
  accessories: AccessoryItem[];
  isLoading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  fetchKind: (type: Kind) => Promise<void>;
  addItem: (type: Kind, item: Omit<BaseItem, 'id'>) => Promise<void>;
  updateItem: (type: Kind, item: BaseItem) => Promise<void>;
  deleteItem: (type: Kind, id: string) => Promise<void>;
  replaceAll: (type: Kind, items: Array<Omit<BaseItem, 'id'>>) => Promise<void>;
  mergeAll: (type: Kind, items: Array<BaseItem>) => Promise<void>;
  applyPricingToAll: () => Promise<void>;
}

const mapPbToItem = (record: PbItemRecord): BaseItem => ({
  id: record.id,
  name: record.name,
  sellerName: record.sellerName,
  gameFormat: record.gameFormat,
  condition: record.condition,
  expansionCode: record.expansionCode,
  rarity: record.rarity,
  quantity: record.quantity,
  priceUsd: record.priceUsd,
  priceCup: record.priceCup
});

const listAll = async (collection: CollectionName): Promise<BaseItem[]> => {
  // PocketBase caps per-page, so we paginate.
  const pageSize = 200;
  let page = 1;
  const all: BaseItem[] = [];
  while (true) {
    const result = await pb.collection(collection).getList<PbItemRecord>(page, pageSize, {
      sort: '-created'
    });
    all.push(...result.items.map(mapPbToItem));
    if (result.page >= result.totalPages) break;
    page += 1;
  }
  return all;
};

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  cards: [],
  decks: [],
  accessories: [],
  isLoading: false,
  error: null,
  fetchAll: async () => {
    set({ isLoading: true, error: null });
    try {
      const [cards, decks, accessories] = await Promise.all([
        listAll('cards'),
        listAll('decks'),
        listAll('accessories')
      ]);
      set({
        cards: cards as CardItem[],
        decks: decks as DeckItem[],
        accessories: accessories as AccessoryItem[],
        isLoading: false,
        error: null
      });
    } catch (err) {
      console.error(err);
      set({
        isLoading: false,
        error: 'Failed to load inventory from PocketBase. Check VITE_PB_URL and your collections.'
      });
    }
  },
  fetchKind: async (type) => {
    set({ isLoading: true, error: null });
    try {
      const collection = collectionByKind[type];
      const items = await listAll(collection);
      set({ [`${type}s`]: items } as Partial<InventoryStore>);
      set({ isLoading: false, error: null });
    } catch (err) {
      console.error(err);
      set({
        isLoading: false,
        error: `Failed to load ${type}s from PocketBase.`
      });
    }
  },
  addItem: async (type, item) => {
    const collection = collectionByKind[type];
    const created = await pb.collection(collection).create<PbItemRecord>(item);
    const mapped = mapPbToItem(created);
    set((state) => {
      const current = state[`${type}s` as const] as BaseItem[];
      return { [`${type}s`]: [mapped, ...current] } as Partial<InventoryStore>;
    });
  },
  updateItem: async (type, item) => {
    const collection = collectionByKind[type];
    const { id, ...payload } = item;
    const updated = await pb.collection(collection).update<PbItemRecord>(id, payload);
    const mapped = mapPbToItem(updated);
    set((state) => {
      const current = state[`${type}s` as const] as BaseItem[];
      const next = current.map((it) => (it.id === id ? mapped : it));
      return { [`${type}s`]: next } as Partial<InventoryStore>;
    });
  },
  deleteItem: async (type, id) => {
    const collection = collectionByKind[type];
    await pb.collection(collection).delete(id);
    set((state) => {
      const current = state[`${type}s` as const] as BaseItem[];
      const next = current.filter((it) => it.id !== id);
      return { [`${type}s`]: next } as Partial<InventoryStore>;
    });
  },
  replaceAll: async (type, items) => {
    const collection = collectionByKind[type];
    // Replace by deleting all then re-creating.
    const existing = await listAll(collection);
    await Promise.all(existing.map((it) => pb.collection(collection).delete(it.id)));
    await Promise.all(items.map((it) => pb.collection(collection).create(it)));
    await get().fetchKind(type);
  },
  mergeAll: async (type, items) => {
    const collection = collectionByKind[type];
    // Merge by upserting: if id exists update, else create.
    await Promise.all(
      items.map(async (it) => {
        try {
          const { id, ...payload } = it;
          await pb.collection(collection).update(id, payload);
        } catch {
          const { id: _, ...payload } = it;
          await pb.collection(collection).create(payload);
        }
      })
    );
    await get().fetchKind(type);
  },
  applyPricingToAll: async () => {
    const settings = useSettingsStore.getState().settings;
    const state = get();
    const nextCards = applyPricingToItems(state.cards, settings);
    const nextDecks = applyPricingToItems(state.decks, settings);
    const nextAccessories = applyPricingToItems(state.accessories, settings);

    await Promise.all([
      ...nextCards.map(({ id, ...payload }) => pb.collection('cards').update(id, payload)),
      ...nextDecks.map(({ id, ...payload }) => pb.collection('decks').update(id, payload)),
      ...nextAccessories.map(({ id, ...payload }) =>
        pb.collection('accessories').update(id, payload)
      )
    ]);

    set({
      cards: nextCards as CardItem[],
      decks: nextDecks as DeckItem[],
      accessories: nextAccessories as AccessoryItem[]
    });
  }
}));

