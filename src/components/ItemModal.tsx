import { useEffect, useState } from 'react';
import type {
  BaseItem,
  GameFormat,
  CardCondition,
  CardRarity
} from '../types/store';
import { useSettingsStore } from '../store/settingsStore';
import { calculateUsdPrice, calculateCupPrice } from '../utils/pricing';

interface ItemModalProps<T extends BaseItem> {
  open: boolean;
  onClose: () => void;
  onSubmit: (item: T) => void;
  initial?: T | null;
}

const defaultCondition: CardCondition = 'Near Mint';
const defaultRarity: CardRarity = 'Common';
const defaultFormat: GameFormat = 'TCG';

export const ItemModal = <T extends BaseItem>({
  open,
  onClose,
  onSubmit,
  initial
}: ItemModalProps<T>) => {
  const { settings } = useSettingsStore();
  const [form, setForm] = useState<BaseItem>(() => {
    const base: BaseItem = {
      id: '',
      name: '',
      sellerName: '',
      gameFormat: defaultFormat,
      condition: defaultCondition,
      expansionCode: '',
      rarity: defaultRarity,
      quantity: 1,
      priceUsd: calculateUsdPrice(defaultRarity, settings),
      priceCup: calculateCupPrice(
        calculateUsdPrice(defaultRarity, settings),
        settings
      )
    };
    return base;
  });

  useEffect(() => {
    if (initial) {
      setForm(initial);
    } else if (settings.autoPriceEnabled) {
      const usd = calculateUsdPrice(defaultRarity, settings);
      const cup = calculateCupPrice(usd, settings);
      setForm((prev) => ({
        ...prev,
        id: '',
        name: '',
        sellerName: '',
        gameFormat: defaultFormat,
        condition: defaultCondition,
        expansionCode: '',
        rarity: defaultRarity,
        quantity: 1,
        priceUsd: usd,
        priceCup: cup
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        id: '',
        name: '',
        sellerName: '',
        gameFormat: defaultFormat,
        condition: defaultCondition,
        expansionCode: '',
        rarity: defaultRarity,
        quantity: 1
      }));
    }
  }, [initial, settings]);

  if (!open) return null;

  const update =
    (key: keyof BaseItem) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.value;
      setForm((prev) => ({
        ...prev,
        [key]:
          key === 'quantity' || key === 'priceUsd' || key === 'priceCup'
            ? Number(value)
            : value
      }));
    };

  const handleRarityChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const rarity = e.target.value as CardRarity;
    if (settings.autoPriceEnabled) {
      const usd = calculateUsdPrice(rarity, settings);
      const cup = calculateCupPrice(usd, settings);
      setForm((prev) => ({ ...prev, rarity, priceUsd: usd, priceCup: cup }));
    } else {
      setForm((prev) => ({ ...prev, rarity }));
    }
  };

  const handleSubmit: React.FormEventHandler = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (!form.sellerName.trim()) return;
    if (!form.expansionCode.trim()) return;
    if (form.quantity <= 0) return;
    onSubmit(form as T);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <div className="bg-slate-900 rounded-xl border border-slate-700 shadow-xl w-full max-w-xl">
        <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            {initial ? 'Edit Item' : 'Add Item'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                Name<span className="text-red-500">*</span>
              </label>
              <input
                className="input"
                value={form.name}
                onChange={update('name')}
                required
              />
            </div>
            <div>
              <label className="label">
                Seller<span className="text-red-500">*</span>
              </label>
              <input
                className="input"
                value={form.sellerName}
                onChange={update('sellerName')}
                required
              />
            </div>
            <div>
              <label className="label">
                Game Format<span className="text-red-500">*</span>
              </label>
              <select
                className="input"
                value={form.gameFormat}
                onChange={update('gameFormat')}
                required
              >
                <option value="TCG">TCG</option>
                <option value="OCG">OCG</option>
              </select>
            </div>
            <div>
              <label className="label">
                Condition<span className="text-red-500">*</span>
              </label>
              <select
                className="input"
                value={form.condition}
                onChange={update('condition')}
                required
              >
                <option value="Near Mint">Near Mint</option>
                <option value="Lightly Played">Lightly Played</option>
                <option value="Moderately Played">Moderately Played</option>
                <option value="Heavily Played">Heavily Played</option>
                <option value="Damaged">Damaged</option>
              </select>
            </div>
            <div>
              <label className="label">
                Expansion Code<span className="text-red-500">*</span>
              </label>
              <input
                className="input"
                value={form.expansionCode}
                onChange={update('expansionCode')}
                required
              />
            </div>
            <div>
              <label className="label">
                Rarity<span className="text-red-500">*</span>
              </label>
              <select
                className="input"
                value={form.rarity}
                onChange={handleRarityChange}
                required
              >
                <option value="Common">Common</option>
                <option value="Rare">Rare</option>
                <option value="Super Rare">Super Rare</option>
                <option value="Ultra Rare">Ultra Rare</option>
                <option value="Secret Rare">Secret Rare</option>
                <option value="Prismatic Secret Rare">
                  Prismatic Secret Rare
                </option>
              </select>
            </div>
            <div>
              <label className="label">
                Quantity<span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                className="input"
                value={form.quantity}
                onChange={update('quantity')}
                required
              />
            </div>
            <div>
              <label className="label">
                Price (USD)
                {settings.autoPriceEnabled && (
                  <span className="ml-1 text-xs text-primary-300">
                    auto (editable)
                  </span>
                )}
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                className="input"
                value={form.priceUsd}
                onChange={update('priceUsd')}
              />
            </div>
            <div>
              <label className="label">
                Price (CUP)
                {settings.autoPriceEnabled && (
                  <span className="ml-1 text-xs text-primary-300">
                    auto (editable)
                  </span>
                )}
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                className="input"
                value={form.priceCup}
                onChange={update('priceCup')}
              />
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {initial ? 'Save changes' : 'Add item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

