import type { BaseItem } from '../types/store';

interface ImportExportControlsProps<T extends BaseItem> {
  items: T[];
  label: string;
  onReplace: (items: T[]) => void;
  onMerge: (items: T[]) => void;
}

export const ImportExportControls = <T extends BaseItem>({
  items,
  label,
  onReplace,
  onMerge
}: ImportExportControlsProps<T>) => {
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${label.toLowerCase()}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = JSON.parse(text) as T[];
      const mode = window.prompt(
        'Type "merge" to merge with existing items or "replace" to replace them:',
        'merge'
      );
      if (mode === 'replace') {
        onReplace(parsed);
      } else if (mode === 'merge') {
        onMerge(parsed);
      }
    } catch (err) {
      console.error(err);
      window.alert('Invalid JSON file.');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <button type="button" className="btn-secondary" onClick={handleExport}>
        Export JSON
      </button>
      <label className="btn-secondary cursor-pointer">
        Import JSON
        <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
      </label>
    </div>
  );
};

