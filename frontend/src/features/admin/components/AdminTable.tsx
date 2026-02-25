import { ReactNode } from 'react';
import { ArrowUpDown } from 'lucide-react';

export interface ColumnConfig<TSortField extends string> {
    label: string;
    sortField: TSortField;
}

export interface AdminTableProps<T, TSortField extends string> {
    columns: ColumnConfig<TSortField>[];
    items: T[];
    gridClass: string;
    emptyMessage: string;
    selectedIds: Set<string>;
    totalItems: number;
    sortField: TSortField;
    onSort: (field: TSortField) => void;
    onToggleSelectAll: () => void;
    renderRow: (item: T) => ReactNode;
    getItemId: (item: T) => string;
}

export default function AdminTable<T, TSortField extends string>({
    columns,
    items,
    gridClass,
    emptyMessage,
    selectedIds,
    totalItems,
    sortField,
    onSort,
    onToggleSelectAll,
    renderRow,
    getItemId,
}: AdminTableProps<T, TSortField>) {
    const allSelected = selectedIds.size === items.length && items.length > 0;

    return (
        <div className="w-full">
            {/* Table Header */}
            <div className={`hidden sm:grid ${gridClass} gap-4 border-b border-white/10 pb-3 mb-2`}>
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={onToggleSelectAll}
                        className="w-4 h-4 rounded bg-[#0b1020] border-white/20"
                    />
                </div>
                {columns.map((column) => (
                    <button
                        key={column.sortField}
                        onClick={() => onSort(column.sortField)}
                        className="flex items-center gap-1 text-left text-white/80 font-medium hover:text-white transition-colors"
                    >
                        {column.label}
                        <ArrowUpDown 
                            size={14} 
                            className={sortField === column.sortField ? 'text-blue-400' : 'text-white/40'} 
                        />
                    </button>
                ))}
                <div className="text-white/80 font-medium text-center">Actions</div>
            </div>

            {/* Table Body */}
            {items.length === 0 ? (
                <div className="text-white/60 text-center py-8">
                    {emptyMessage}
                </div>
            ) : (
                <div className="space-y-2">
                    {items.map((item) => (
                        <div key={getItemId(item)}>
                            {renderRow(item)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
