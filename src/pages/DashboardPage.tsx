import { useInventoryStore } from '../store/inventoryStore';
import { useSettingsStore } from '../store/settingsStore';

const DashboardPage = () => {
  const { cards, decks, accessories } = useInventoryStore();
  const { settings } = useSettingsStore();

  const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0);
  const totalDecks = decks.reduce((sum, d) => sum + d.quantity, 0);
  const totalAccessories = accessories.reduce((sum, a) => sum + a.quantity, 0);

  const totalUsd =
    cards.reduce((sum, c) => sum + c.priceUsd * c.quantity, 0) +
    decks.reduce((sum, d) => sum + d.priceUsd * d.quantity, 0) +
    accessories.reduce((sum, a) => sum + a.priceUsd * a.quantity, 0);
  const totalCup =
    cards.reduce((sum, c) => sum + c.priceCup * c.quantity, 0) +
    decks.reduce((sum, d) => sum + d.priceCup * d.quantity, 0) +
    accessories.reduce((sum, a) => sum + a.priceCup * a.quantity, 0);

  const lowStock = [
    ...cards.filter((c) => c.quantity <= 5),
    ...decks.filter((d) => d.quantity <= 5),
    ...accessories.filter((a) => a.quantity <= 5)
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold mb-2">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-xs text-slate-400">Total cards</div>
          <div className="text-2xl font-semibold mt-1">{totalCards}</div>
        </div>
        <div className="card">
          <div className="text-xs text-slate-400">Total decks</div>
          <div className="text-2xl font-semibold mt-1">{totalDecks}</div>
        </div>
        <div className="card">
          <div className="text-xs text-slate-400">Total accessories</div>
          <div className="text-2xl font-semibold mt-1">{totalAccessories}</div>
        </div>
        <div className="card">
          <div className="text-xs text-slate-400">Inventory value</div>
          <div className="mt-1 text-lg font-semibold">${totalUsd.toFixed(2)} USD</div>
          <div className="text-xs text-slate-400">
            {totalCup.toFixed(2)} CUP (@ {settings.cupPerUsd} CUP / USD)
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Low stock alerts (≤ 5)</h2>
          <span className="text-xs text-slate-400">{lowStock.length} items</span>
        </div>
        {lowStock.length === 0 ? (
          <p className="text-xs text-slate-400">No low stock items. Nice!</p>
        ) : (
          <div className="overflow-auto -mx-2">
            <table className="min-w-full divide-y divide-slate-800 text-xs">
              <thead className="bg-slate-900/60">
                <tr>
                  <th className="th">Name</th>
                  <th className="th">Seller</th>
                  <th className="th">Format</th>
                  <th className="th">Condition</th>
                  <th className="th">Rarity</th>
                  <th className="th">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                {lowStock.map((item) => (
                  <tr key={item.id}>
                    <td className="td">{item.name}</td>
                    <td className="td">{item.sellerName}</td>
                    <td className="td">{item.gameFormat}</td>
                    <td className="td">{item.condition}</td>
                    <td className="td">{item.rarity}</td>
                    <td className="td text-right">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;

