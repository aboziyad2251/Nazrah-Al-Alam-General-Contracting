import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  selectable?: boolean;
  bulkActions?: (selected: T[]) => ReactNode;
  loading?: boolean;
  emptyState?: ReactNode;
  rowClick?: (row: T) => void;
}

export function DataTable<T>({
  data,
  columns,
  keyField,
  selectable,
  bulkActions,
  loading,
  emptyState,
  rowClick,
}: DataTableProps<T>) {
  const [selected, setSelected] = useState<Set<unknown>>(new Set());
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const av = (a as any)[sortKey];
    const bv = (b as any)[sortKey];
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const allSelected = data.length > 0 && selected.size === data.length;
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(data.map((r) => r[keyField])));
  const toggleRow = (id: unknown) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const selectedRows = data.filter((r) => selected.has(r[keyField]));

  return (
    <div>
      {/* Bulk action bar */}
      {selectable && selected.size > 0 && bulkActions && (
        <div className="mb-3 flex animate-fade-in items-center gap-3 rounded-lg border border-navy/20 bg-navy/5 px-4 py-2">
          <span className="text-sm font-medium text-navy">{selected.size} selected</span>
          <div className="ml-auto flex items-center gap-2">
            {bulkActions(selectedRows)}
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-ink-500 hover:text-ink-900"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-stone/60 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone bg-[#f8f9fb]">
              {selectable && (
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded border-cloud accent-navy"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'text-ink-700 whitespace-nowrap px-4 py-3 text-left font-semibold',
                    col.width
                  )}
                  onClick={() => col.sortable && toggleSort(col.key)}
                >
                  <div
                    className={cn(
                      'flex items-center gap-1',
                      col.sortable && 'cursor-pointer select-none hover:text-ink-900'
                    )}
                  >
                    {col.header}
                    {col.sortable && (
                      <span className="text-ink-500/40">
                        {sortKey === col.key ? (
                          sortDir === 'asc' ? (
                            <ChevronUp size={12} />
                          ) : (
                            <ChevronDown size={12} />
                          )
                        ) : (
                          <ChevronsUpDown size={12} />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-stone/40">
                  {selectable && (
                    <td className="px-3 py-3">
                      <div className="h-4 w-4 animate-pulse rounded bg-stone" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-stone" />
                    </td>
                  ))}
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="py-12 text-center text-ink-500"
                >
                  {emptyState ?? 'No records found'}
                </td>
              </tr>
            ) : (
              sorted.map((row) => {
                const id = row[keyField];
                return (
                  <tr
                    key={String(id)}
                    className={cn(
                      'border-b border-stone/40 transition-colors',
                      rowClick ? 'cursor-pointer hover:bg-stone/30' : 'hover:bg-stone/20',
                      selected.has(id) && 'bg-navy/5'
                    )}
                    onClick={() => rowClick?.(row)}
                  >
                    {selectable && (
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(id)}
                          onChange={() => toggleRow(id)}
                          className="rounded border-cloud accent-navy"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className="text-ink-700 px-4 py-3">
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
