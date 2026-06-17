"use client";

import { useEffect, useMemo, useState } from "react";

export const PAGE_SIZE_OPTIONS = [10, 20, 30, 40] as const;
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

export function useTablePagination<T>(rows: T[], defaultPageSize: PageSizeOption = 10) {
  const [pageSize, setPageSize] = useState<PageSizeOption>(defaultPageSize);
  const [page, setPage] = useState(1);

  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  useEffect(() => {
    setPage(1);
  }, [pageSize, totalRows]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const safePage = Math.min(page, totalPages);
  const paginatedRows = useMemo(
    () => rows.slice((safePage - 1) * pageSize, safePage * pageSize),
    [rows, safePage, pageSize]
  );

  return {
    paginatedRows,
    page: safePage,
    pageSize,
    setPage,
    setPageSize,
    totalPages,
    totalRows,
  };
}

export function TablePagination({
  page,
  pageSize,
  totalPages,
  totalRows,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: PageSizeOption;
  totalPages: number;
  totalRows: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSizeOption) => void;
}) {
  const start = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalRows);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
      <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-600">
        <label className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value) as PageSizeOption)}
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <span>{totalRows === 0 ? "No rows" : `${start}–${end} of ${totalRows}`}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
        >
          Previous
        </button>
        <span className="min-w-[5rem] text-center text-sm tabular-nums text-zinc-600">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
