"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

interface Column<T> {
  header: string;
  accessor: keyof T | string;
  render?: (row: T) => React.ReactNode; // custom cell render
  className?: string;
}

interface DynamicTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export default function AppTable<T extends { id: number | string }>({
  data,
  columns,
  pageSize = 5,
  currentPage,
  totalPages,
  onPageChange,
}: DynamicTableProps<T>) {
  const [internalPage, setInternalPage] = useState(1);

  const hasServerPagination =
    typeof currentPage === "number" &&
    typeof totalPages === "number" &&
    typeof onPageChange === "function";

  const effectiveCurrentPage = hasServerPagination ? currentPage : internalPage;
  const computedTotalPages = hasServerPagination
    ? Math.max(1, totalPages)
    : Math.max(1, Math.ceil(data.length / pageSize));

  useEffect(() => {
    if (!hasServerPagination && internalPage > computedTotalPages) {
      setInternalPage(computedTotalPages);
    }
  }, [hasServerPagination, internalPage, computedTotalPages]);

  const paginatedData = useMemo(() => {
    if (hasServerPagination) {
      return data;
    }

    const start = (effectiveCurrentPage - 1) * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
  }, [data, effectiveCurrentPage, hasServerPagination, pageSize]);

  const goToNextPage = () => {
    if (effectiveCurrentPage >= computedTotalPages) return;

    if (hasServerPagination) {
      onPageChange(effectiveCurrentPage + 1);
      return;
    }

    setInternalPage((prev) => prev + 1);
  };

  const goToPrevPage = () => {
    if (effectiveCurrentPage <= 1) return;

    if (hasServerPagination) {
      onPageChange(effectiveCurrentPage - 1);
      return;
    }

    setInternalPage((prev) => prev - 1);
  };

  return (
    <div className="w-full max-w-full rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="no-scrollbar w-full max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              {columns.map((col, index) => (
                <TableCell
                  key={index}
                  isHeader
                  className={`px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 ${col.className}`}
                >
                  {col.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {paginatedData.map((row) => (
              <TableRow key={row.id}>
                {columns.map((col, index) => (
                  <TableCell
                    key={index}
                    className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400"
                  >
                    {col.render ? col.render(row) : (row as any)[col.accessor]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t dark:border-white/[0.05]">
        <button
          onClick={goToPrevPage}
          disabled={effectiveCurrentPage === 1}
          className="px-3 py-1 text-sm border rounded disabled:opacity-50"
        >
          Previous
        </button>

        <span className="text-sm">
          Page {effectiveCurrentPage} of {computedTotalPages}
        </span>

        <button
          onClick={goToNextPage}
          disabled={effectiveCurrentPage === computedTotalPages}
          className="px-3 py-1 text-sm border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
