import { create } from 'zustand';
import type { CardItem, DeckItem, AccessoryItem, BaseItem } from '../types/store';
import { applyPricingToItems } from '../utils/pricing';
import { useSettingsStore } from './settingsStore';
import { cardsService, decksService, accessoriesService } from '../services';

type Kind = 'card' | 'deck' | 'accessory';

type ServiceType = typeof cardsService;

const serviceByKind: Record<Kind, ServiceType> = {
  card: cardsService,
  deck: decksService,
  accessory: accessoriesService
};

// Map Kind to the state property name (handles 'accessory' -> 'accessories')
const stateKeyByKind: Record<Kind, keyof InventoryStore> = {
  card: 'cards',
  deck: 'decks',
  accessory: 'accessories'
};

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

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  cards: [],
  decks: [],
  accessories: [],
  isLoading: false,
  error: null,
  fetchAll: async () => {
    console.log('[inventoryStore] Starting fetchAll...');
    set({ isLoading: true, error: null });
    try {
      console.log('[inventoryStore] Fetching all collections...');
      const [cards, decks, accessories] = await Promise.all([
        cardsService.listAll(),
        decksService.listAll(),
        accessoriesService.listAll()
      ]);
      console.log(`[inventoryStore] Fetched: ${cards.length} cards, ${decks.length} decks, ${accessories.length} accessories`);
      set({
        cards: cards as CardItem[],
        decks: decks as DeckItem[],
        accessories: accessories as AccessoryItem[],
        isLoading: false,
        error: null
      });
      console.log('[inventoryStore] Fetch complete!');
    } catch (err: any) {
      console.error('[inventoryStore] fetchAll error:', err);
      console.error('[inventoryStore] Error status:', err.status);
      console.error('[inventoryStore] Error response:', err.response);
      set({
        isLoading: false,
        error: `Failed to load inventory: ${err.message || 'Check console for details'}`
      });
    }
  },
  fetchKind: async (type) => {
    console.log(`[inventoryStore] Fetching ${type}...`);
    set({ isLoading: true, error: null });
    try {
      const service = serviceByKind[type];
      const items = await service.listAll();
      console.log(`[inventoryStore] Fetched ${items.length} ${type}s`);
      set({ [stateKeyByKind[type]]: items } as Partial<InventoryStore>);
      set({ isLoading: false, error: null });
    } catch (err: any) {
      console.error(`[inventoryStore] fetchKind ${type} error:`, err);
      set({
        isLoading: false,
        error: `Failed to load ${type}s: ${err.message || 'Unknown error'}`
      });
    }
  },
  addItem: async (type, item) => {
    console.log(`[inventoryStore] Adding ${type}:`, item.name);
    try {
      const service = serviceByKind[type];
      const created = await service.create(item);
      console.log(`[inventoryStore] Created ${type} with id:`, created.id);
      set((state) => {
        const key = stateKeyByKind[type];
        const current = state[key] as BaseItem[];
        return { [key]: [created, ...current] } as Partial<InventoryStore>;
      });
    } catch (err: any) {
      console.error(`[inventoryStore] addItem ${type} error:`, err);
      throw err;
    }
  },
  updateItem: async (type, item) => {
    console.log(`[inventoryStore] Updating ${type}:`, item.id);
    try {
      const service = serviceByKind[type];
      const updated = await service.update(item.id, item);
      console.log(`[inventoryStore] Updated ${type}:`, updated.id);
      set((state) => {
        const key = stateKeyByKind[type];
        const current = state[key] as BaseItem[];
        const next = current.map((it) => (it.id === item.id ? updated : it));
        return { [key]: next } as Partial<InventoryStore>;
      });
    } catch (err: any) {
      console.error(`[inventoryStore] updateItem ${type} error:`, err);
      throw err;
    }
  },
  deleteItem: async (type, id) => {
    console.log(`[inventoryStore] Deleting ${type}:`, id);
    try {
      const service = serviceByKind[type];
      await service.delete(id);
      console.log(`[inventoryStore] Deleted ${type}:`, id);
      set((state) => {
        const key = stateKeyByKind[type];
        const current = state[key] as BaseItem[];
        const next = current.filter((it) => it.id !== id);
        return { [key]: next } as Partial<InventoryStore>;
      });
    } catch (err: any) {
      console.error(`[inventoryStore] deleteItem ${type} error:`, err);
      throw err;
    }
  },
  replaceAll: async (type, items) => {
    console.log(`[inventoryStore] Replacing all ${type}s...`);
    try {
      const service = serviceByKind[type];
      await service.deleteAll();
      await service.createMany(items);
      await get().fetchKind(type);
      console.log(`[inventoryStore] Replaced all ${type}s`);
    } catch (err: any) {
      console.error(`[inventoryStore] replaceAll ${type} error:`, err);
      throw err;
    }
  },
  mergeAll: async (type, items) => {
    console.log(`[inventoryStore] Merging ${type}s...`);
    try {
      const service = serviceByKind[type];
      // Merge by upserting: if id exists update, else create
      await Promise.all(
        items.map(async (it) => {
          try {
            await service.update(it.id, it);
          } catch {
            const { id: _, ...payload } = it;
            await service.create(payload as Omit<BaseItem, 'id'>);
          }
        })
      );
      await get().fetchKind(type);
      console.log(`[inventoryStore] Merged ${type}s`);
    } catch (err: any) {
      console.error(`[inventoryStore] mergeAll ${type} error:`, err);
      throw err;
    }
  },
  applyPricingToAll: async () => {
    console.log('[inventoryStore] Applying pricing to all items...');
    try {
      const settings = useSettingsStore.getState().settings;
      const state = get();
      const nextCards = applyPricingToItems(state.cards, settings);
      const nextDecks = applyPricingToItems(state.decks, settings);
      const nextAccessories = applyPricingToItems(state.accessories, settings);

      await Promise.all([
        ...nextCards.map(({ id, ...payload }) => cardsService.update(id, payload)),
        ...nextDecks.map(({ id, ...payload }) => decksService.update(id, payload)),
        ...nextAccessories.map(({ id, ...payload }) => accessoriesService.update(id, payload))
      ]);

      console.log('[inventoryStore] Pricing applied successfully');
      set({
        cards: nextCards as CardItem[],
        decks: nextDecks as DeckItem[],
        accessories: nextAccessories as AccessoryItem[]
      });
    } catch (err: any) {
      console.error('[inventoryStore] applyPricingToAll error:', err);
      throw err;
    }
  }
}));

