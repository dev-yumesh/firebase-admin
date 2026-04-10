"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import AppTable from "@/components/tables/AppTable";
import React, { useCallback, useEffect, useState } from "react";

export type ResourceColumn<T extends { id: string | number }> = {
  header: string;
  accessor: keyof T | string;
  render?: (row: T) => React.ReactNode;
  className?: string;
};

type LoadResult<T> = { items: T[]; totalPages: number };

type Props<T extends { id: string | number }> = {
  pageTitle: string;
  cardTitle?: string;
  description?: string;
  columns: ResourceColumn<T>[];
  searchPlaceholder?: string;
  pageSize?: number;
  /** e.g. “Add” button row (right side of search bar). */
  toolbarActions?: React.ReactNode;
  /** Increment after mutations to refetch the list. */
  refreshToken?: number;
  loadData: (args: {
    page: number;
    limit: number;
    search: string;
  }) => Promise<LoadResult<T>>;
};

const DEFAULT_PAGE = 10;

export default function PanelResourceListPage<
  T extends { id: string | number },
>({
  pageTitle,
  cardTitle,
  description,
  columns,
  searchPlaceholder = "Search…",
  pageSize = DEFAULT_PAGE,
  toolbarActions,
  refreshToken = 0,
  loadData,
}: Props<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      setDebouncedSearch(searchInput.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loadData({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch,
      });
      setItems(result.items);
      setTotalPages(Math.max(1, result.totalPages));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
      setItems([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, loadData, pageSize, refreshToken]);

  useEffect(() => {
    void fetchPage();
  }, [fetchPage]);

  return (
    <div>
      <PageBreadcrumb pageTitle={pageTitle} />
      <div className="mt-6 space-y-6">
        <ComponentCard
          title={cardTitle ?? pageTitle}
          desc={description ?? ""}
        >
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white/90"
            />
            {toolbarActions ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {toolbarActions}
              </div>
            ) : null}
          </div>
          {loading && (
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              Loading…
            </p>
          )}
          {error && (
            <p className="mb-2 text-sm text-error-500" role="alert">
              {error}
            </p>
          )}
          <div className="w-full max-w-full overflow-x-auto">
            <AppTable<T>
              data={items}
              columns={columns}
              pageSize={pageSize}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
