import { useEffect, useState } from 'react';
import type { BaseItem } from '../types/store';
import { useInventoryStore } from '../store/inventoryStore';
import { ItemTable } from '../components/ItemTable';
import { ItemModal } from '../components/ItemModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ImportExportControls } from '../components/ImportExportControls';

type Kind = 'card' | 'deck' | 'accessory';

interface ItemsPageProps {
  kind: Kind;
}

const kindLabel: Record<Kind, string> = {
  card: 'Cards',
  deck: 'Decks',
  accessory: 'Accessories'
};

export const ItemsPage = ({ kind }: ItemsPageProps) => {
  const {
    cards,
    decks,
    accessories,
    fetchKind,
    isLoading,
    error,
    addItem,
    updateItem,
    deleteItem,
    replaceAll,
    mergeAll
  } = useInventoryStore();

  const items = kind === 'card' ? cards : kind === 'deck' ? decks : accessories;

  const [filter, setFilter] = useState({
    search: '',
    gameFormat: 'all' as const,
    condition: 'all' as const,
    rarity: 'all' as const,
    sellerName: ''
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<BaseItem | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    void fetchKind(kind);
  }, [fetchKind, kind]);

  const openAdd = () => {
    setSelected(null);
    setModalOpen(true);
  };

  const openEdit = (item: BaseItem) => {
    setSelected(item);
    setModalOpen(true);
  };

  const requestDelete = (item: BaseItem) => {
    setSelected(item);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (selected) {
      await deleteItem(kind, selected.id);
    }
    setConfirmOpen(false);
  };

  const handleSubmit = async (item: BaseItem) => {
    if (selected) {
      await updateItem(kind, item);
    } else {
      const { id: _ignore, ...payload } = item;
      await addItem(kind, payload);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">{kindLabel[kind]}</h1>
        <div className="flex gap-2">
          <ImportExportControls<BaseItem>
            items={items}
            label={kindLabel[kind]}
            onMerge={(data) => void mergeAll(kind, data)}
            onReplace={(data) => void replaceAll(kind, data.map(({ id, ...rest }) => rest))}
          />
          <button type="button" className="btn-primary" onClick={openAdd}>
            Add {kind === 'card' ? 'card' : kind === 'deck' ? 'deck' : 'accessory'}
          </button>
        </div>
      </div>
      {error && <div className="card text-xs text-red-300">{error}</div>}
      {isLoading && <div className="text-xs text-slate-400">Loading...</div>}
      <ItemTable<BaseItem>
        items={items}
        onEdit={openEdit}
        onDelete={requestDelete}
        filter={filter}
        setFilter={setFilter}
      />
      <ItemModal<BaseItem>
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initial={selected}
      />
      <ConfirmDialog
        open={confirmOpen}
        title="Delete item"
        description={
          selected
            ? `Are you sure you want to delete "${selected.name}"? This cannot be undone.`
            : 'Are you sure you want to delete this item?'
        }
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        confirmLabel="Delete"
      />
    </div>
  );
};

