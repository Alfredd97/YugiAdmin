import React from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { calculateUsdPrice, calculateCupPrice } from '../utils/pricing';
import type { CardRarity } from '../types/store';
import { useInventoryStore } from '../store/inventoryStore';

const rarities: CardRarity[] = [
  'Common',
  'Rare',
  'Super Rare',
  'Ultra Rare',
  'Secret Rare',
  'Prismatic Secret Rare'
];

const CurrencySettingsPage = () => {
  const { settings, updateSettings, restore, isLoading, error } = useSettingsStore();
  const { applyPricingToAll } = useInventoryStore();

  React.useEffect(() => {
    void restore();
  }, [restore]);

  const handleBaseChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    void updateSettings({ basePriceUsd: Number(e.target.value) || 0 });
  };

  const handleCupChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    void updateSettings({ cupPerUsd: Number(e.target.value) || 0 });
  };

  const handleMultiplierChange =
    (rarity: CardRarity): React.ChangeEventHandler<HTMLInputElement> =>
    (e) => {
      const value = Number(e.target.value) || 0;
      void updateSettings({
        multipliers: { ...settings.multipliers, [rarity]: value }
      });
    };

  const handleToggleAuto: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    void updateSettings({ autoPriceEnabled: e.target.checked });
  };

  const handleApplyAll = async () => {
    await applyPricingToAll();
    window.alert('Recalculated prices for all items.');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Currency & Pricing</h1>
      {error && <div className="card text-xs text-red-300">{error}</div>}
      {isLoading && <div className="text-xs text-slate-400">Loading settings...</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold">Base price (reference card)</h2>
          <input
            type="number"
            min={0}
            step="0.01"
            className="input"
            value={settings.basePriceUsd}
            onChange={handleBaseChange}
          />
          <p className="text-xs text-slate-400">
            This is the base USD price that rarity multipliers will apply to.
          </p>
        </div>
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold">CUP exchange rate</h2>
          <label className="label text-xs">
            CUP per 1 USD
          </label>
          <input
            type="number"
            min={0}
            step="0.01"
            className="input"
            value={settings.cupPerUsd}
            onChange={handleCupChange}
          />
          <p className="text-xs text-slate-400">
            Example: if 1 USD = 350 CUP, enter <span className="font-mono">350</span>.
          </p>
        </div>
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold">Auto-pricing</h2>
          <label className="inline-flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-700 bg-slate-900"
              checked={settings.autoPriceEnabled}
              onChange={handleToggleAuto}
            />
            <span>Automatically set prices for new items based on rarity</span>
          </label>
          <button type="button" className="btn-secondary mt-2" onClick={handleApplyAll}>
            Apply to all existing items
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold mb-3">
          Rarity multipliers & preview
        </h2>
        <div className="overflow-auto -mx-2">
          <table className="min-w-full divide-y divide-slate-800 text-xs">
            <thead className="bg-slate-900/60">
              <tr>
                <th className="th">Rarity</th>
                <th className="th">Multiplier</th>
                <th className="th">Price (USD)</th>
                <th className="th">Price (CUP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/40">
              {rarities.map((rarity) => {
                const usd = calculateUsdPrice(rarity, settings);
                const cup = calculateCupPrice(usd, settings);
                return (
                  <tr key={rarity}>
                    <td className="td font-medium">{rarity}</td>
                    <td className="td">
                      <input
                        type="number"
                        min={0}
                        step="0.1"
                        className="input w-24"
                        value={settings.multipliers[rarity]}
                        onChange={handleMultiplierChange(rarity)}
                      />
                    </td>
                    <td className="td">${usd.toFixed(2)}</td>
                    <td className="td">{cup.toFixed(2)} CUP</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CurrencySettingsPage;

