import type { BaseItem, GameFormat, CardCondition, CardRarity } from '../types/store';

interface ItemTableProps<T extends BaseItem> {
  items: T[];
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  filter: {
    search: string;
    gameFormat: GameFormat | 'all';
    condition: CardCondition | 'all';
    rarity: CardRarity | 'all';
    sellerName: string;
  };
  setFilter: (next: ItemTableProps<T>['filter']) => void;
}

export const ItemTable = <T extends BaseItem>({
  items,
  onEdit,
  onDelete,
  filter,
  setFilter
}: ItemTableProps<T>) => {
  const filtered = items.filter((item) => {
    if (
      filter.search &&
      !item.name.toLowerCase().includes(filter.search.toLowerCase()) &&
      !item.expansionCode.toLowerCase().includes(filter.search.toLowerCase())
    ) {
      return false;
    }
    if (filter.gameFormat !== 'all' && item.gameFormat !== filter.gameFormat) return false;
    if (filter.condition !== 'all' && item.condition !== filter.condition) return false;
    if (filter.rarity !== 'all' && item.rarity !== filter.rarity) return false;
    if (
      filter.sellerName &&
      !item.sellerName.toLowerCase().includes(filter.sellerName.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const onChange =
    (key: keyof typeof filter) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFilter({ ...filter, [key]: e.target.value });
    };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <input
          className="input"
          placeholder="Search by name or expansion..."
          value={filter.search}
          onChange={onChange('search')}
        />
        <select className="input" value={filter.gameFormat} onChange={onChange('gameFormat')}>
          <option value="all">All Formats</option>
          <option value="TCG">TCG</option>
          <option value="OCG">OCG</option>
        </select>
        <select className="input" value={filter.condition} onChange={onChange('condition')}>
          <option value="all">All Conditions</option>
          <option value="Near Mint">Near Mint</option>
          <option value="Lightly Played">Lightly Played</option>
          <option value="Moderately Played">Moderately Played</option>
          <option value="Heavily Played">Heavily Played</option>
          <option value="Damaged">Damaged</option>
        </select>
        <select className="input" value={filter.rarity} onChange={onChange('rarity')}>
          <option value="all">All Rarities</option>
          <option value="Common">Common</option>
          <option value="Rare">Rare</option>
          <option value="Super Rare">Super Rare</option>
          <option value="Ultra Rare">Ultra Rare</option>
          <option value="Secret Rare">Secret Rare</option>
          <option value="Prismatic Secret Rare">Prismatic Secret</option>
        </select>
        <input
          className="input"
          placeholder="Filter by seller..."
          value={filter.sellerName}
          onChange={onChange('sellerName')}
        />
      </div>
      <div className="overflow-auto border border-slate-800 rounded-lg">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900/60">
            <tr>
              <th className="th">Name</th>
              <th className="th">Seller</th>
              <th className="th">Format</th>
              <th className="th">Condition</th>
              <th className="th">Expansion</th>
              <th className="th">Rarity</th>
              <th className="th">Qty</th>
              <th className="th">USD</th>
              <th className="th">CUP</th>
              <th className="th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/40">
            {filtered.map((item) => (
              <tr key={item.id}>
                <td className="td">{item.name}</td>
                <td className="td">{item.sellerName}</td>
                <td className="td">{item.gameFormat}</td>
                <td className="td">{item.condition}</td>
                <td className="td">{item.expansionCode}</td>
                <td className="td">{item.rarity}</td>
                <td className="td text-right">{item.quantity}</td>
                <td className="td text-right">${item.priceUsd.toFixed(2)}</td>
                <td className="td text-right">{item.priceCup.toFixed(2)} CUP</td>
                <td className="td">
                  <div className="flex gap-2 justify-end">
                    <button
                      className="btn-secondary"
                      onClick={() => onEdit(item)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => onDelete(item)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="td text-center text-slate-500" colSpan={10}>
                  No items match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

