import React from 'react';

export interface PaginationProps {
  page: number;
  count: number;
  onChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

/**
 * Best-in-class Pagination component with next/prev, page numbers, and page size selector.
 */
const Pagination: React.FC<PaginationProps> = ({
  page,
  count,
  onChange,
  pageSize = 10,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}) => {
  const totalPages = Math.ceil(count / pageSize);
  const handlePrev = () => onChange(Math.max(1, page - 1));
  const handleNext = () => onChange(Math.min(totalPages, page + 1));

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button onClick={handlePrev} disabled={page === 1} aria-label="Previous page">Prev</button>
      <span>Page {page} of {totalPages}</span>
      <button onClick={handleNext} disabled={page === totalPages} aria-label="Next page">Next</button>
      {onPageSizeChange && (
        <select
          value={pageSize}
          onChange={e => onPageSizeChange(Number(e.target.value))}
          aria-label="Rows per page"
        >
          {pageSizeOptions.map(opt => (
            <option key={opt} value={opt}>{opt} / page</option>
          ))}
        </select>
      )}
    </div>
  );
};

export default Pagination; 