import React, { useState } from 'react';

export interface DataTableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void;
  onRowSelect?: (row: T) => void;
  loading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

/**
 * Best-in-class DataTable component with sorting, pagination, and row selection.
 */
function DataTable<T extends Record<string, any>>({
  columns,
  data,
  onSort,
  onRowSelect,
  loading = false,
  pagination,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<any>(null);
  const [sortDir, setSortDir] = useState<any>('asc');

  const handleSort = (key: keyof T) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortKey === key && sortDir === 'asc') direction = 'desc';
    setSortKey(key);
    setSortDir(direction);
    onSort?.(key, direction);
  };

  const sortedData = React.useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      if (a[sortKey] < b[sortKey]) return sortDir === 'asc' ? -1 : 1;
      if (a[sortKey] > b[sortKey]) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortDir]);

  return (
    <div style={{ overflowX: 'auto', border: '1px solid #ccc', borderRadius: 8 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }} aria-label="Data table">
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={String(col.key)}
                style={{
                  padding: '12px 8px',
                  background: '#f5f5f5',
                  borderBottom: '1px solid #ddd',
                  cursor: col.sortable ? 'pointer' : 'default',
                  userSelect: 'none',
                  textAlign: 'left',
                }}
                onClick={() => col.sortable && handleSort(col.key)}
                aria-sort={sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                tabIndex={col.sortable ? 0 : -1}
              >
                {col.label}
                {col.sortable && sortKey === col.key && (
                  <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '▲' : '▼'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: 24 }}>
                Loading...
              </td>
            </tr>
          ) : sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: 24 }}>
                No data
              </td>
            </tr>
          ) : (
            sortedData.map((row, i: any) => (
              <tr
                key={i}
                style={{ cursor: onRowSelect ? 'pointer' : 'default', background: i % 2 === 0 ? '#fff' : '#fafafa' }}
                onClick={() => onRowSelect?.(row)}
                tabIndex={onRowSelect ? 0 : -1}
                aria-label={onRowSelect ? 'Selectable row' : undefined}
              >
                {columns.map(col => (
                  <td key={String(col.key)} style={{ padding: '10px 8px', borderBottom: '1px solid #eee' }}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {pagination && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: 8, gap: 8 }}>
          <button
            onClick={() => pagination.onPageChange(Math.max(1, pagination.page - 1))}
            disabled={pagination.page === 1}
            style={{ border: 'none', background: '#eee', borderRadius: 4, padding: '4px 12px', cursor: pagination.page === 1 ? 'not-allowed' : 'pointer' }}
            aria-label="Previous page"
          >
            Prev
          </button>
          <span>Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}</span>
          <button
            onClick={() => pagination.onPageChange(Math.min(Math.ceil(pagination.total / pagination.pageSize), pagination.page + 1))}
            disabled={pagination.page === Math.ceil(pagination.total / pagination.pageSize)}
            style={{ border: 'none', background: '#eee', borderRadius: 4, padding: '4px 12px', cursor: pagination.page === Math.ceil(pagination.total / pagination.pageSize) ? 'not-allowed' : 'pointer' }}
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default DataTable; 