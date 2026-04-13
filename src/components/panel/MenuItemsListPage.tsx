"use client";

import AddMenuItemForm from "@/components/form/AddMenuItemForm";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import PanelResourceListPage, {
  type ResourceColumn,
} from "./PanelResourceListPage";

export type MenuItemRow = {
  id: string;
  name?: string;
  description?: string;
  shopId?: string;
  price?: number;
  isActive?: boolean;
  isAvailable?: boolean;
  isInOffer?: boolean;
  categoryIds?: string[];
  status?: string;
  servingQuantity?: number;
  servingUnit?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

const PAGE_SIZE = 10;

export default function MenuItemsListPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [categoryTitleById, setCategoryTitleById] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `${API_ENDPOINTS.menuCategories.list}?page=1&limit=500`,
        );
        const json = (await res.json()) as {
          success?: boolean;
          data?: { items?: { id?: string; title?: string }[] };
        };
        if (!res.ok || !json.success || !json.data?.items) return;
        const map: Record<string, string> = {};
        for (const c of json.data.items) {
          const id = c.id != null ? String(c.id) : "";
          if (!id) continue;
          map[id] = (c.title && String(c.title).trim()) || id;
        }
        if (!cancelled) setCategoryTitleById(map);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const columns = useMemo<ResourceColumn<MenuItemRow>[]>(
    () => [
      {
        header: "Name",
        accessor: "name",
        render: (row) => row.name || "—",
      },
      {
        header: "Shop ID",
        accessor: "shopId",
        render: (row) => row.shopId || "—",
      },
      {
        header: "Price",
        accessor: "price",
        render: (row) =>
          typeof row.price === "number" ? row.price.toFixed(2) : "—",
      },
      {
        header: "Serving",
        accessor: "servingQuantity",
        render: (row) => {
          const q =
            typeof row.servingQuantity === "number"
              ? row.servingQuantity
              : typeof (row as { quantity?: number }).quantity === "number"
                ? (row as { quantity?: number }).quantity
                : null;
          const u =
            row.servingUnit ||
            (row as { quantityUnit?: string }).quantityUnit ||
            "—";
          return q != null ? `${q} ${u}` : "—";
        },
      },
      {
        header: "Categories",
        accessor: "categoryIds",
        render: (row) => {
          if (!Array.isArray(row.categoryIds) || !row.categoryIds.length) {
            return "—";
          }
          const ids = row.categoryIds;
          const labels = ids.map(
            (id) => categoryTitleById[String(id)] ?? String(id),
          );
          const badgeColors = [
            "primary",
            "info",
            "success",
            "warning",
          ] as const;
          return (
            <div className="flex max-w-[min(280px,100%)] flex-wrap gap-1.5">
              {labels.map((label, i) => (
                <Badge
                  key={`${row.id}-${ids[i]}`}
                  size="sm"
                  color={badgeColors[i % badgeColors.length]}
                >
                  {label}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        header: "Active",
        accessor: "isActive",
        render: (row) => (
          <Badge size="sm" color={row.isActive ? "success" : "error"}>
            {row.isActive ? "Yes" : "No"}
          </Badge>
        ),
      },
      {
        header: "Available",
        accessor: "isAvailable",
        render: (row) => (
          <Badge size="sm" color={row.isAvailable ? "success" : "warning"}>
            {row.isAvailable ? "Yes" : "No"}
          </Badge>
        ),
      },
      {
        header: "Offer",
        accessor: "isInOffer",
        render: (row) => (
          <Badge size="sm" color={row.isInOffer ? "warning" : "light"}>
            {row.isInOffer ? "Yes" : "—"}
          </Badge>
        ),
      },
      {
        header: "Status",
        accessor: "status",
        render: (row) => row.status || "—",
      },
      {
        header: "Updated",
        accessor: "updatedAt",
        render: (row) =>
          row.updatedAt
            ? new Date(row.updatedAt).toLocaleDateString()
            : "—",
      },
    ],
    [categoryTitleById],
  );

  const loadData = useCallback(
    async ({
      page,
      limit,
      search,
    }: {
      page: number;
      limit: number;
      search: string;
    }) => {
      const res = await fetch(
        API_ENDPOINTS.menuItems.list({ page, limit, search }),
      );
      const json = (await res.json()) as {
        success?: boolean;
        data?: {
          items: MenuItemRow[];
          pagination?: { totalPages?: number };
        };
        error?: string;
      };
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || "Failed to load menu items");
      }
      const items = json.data.items.map((item) => ({
        ...item,
        id: String(item.id),
      }));
      const totalPages = json.data.pagination?.totalPages ?? 1;
      return { items, totalPages };
    },
    [],
  );

  return (
    <>
      <PanelResourceListPage<MenuItemRow>
        pageTitle="Menu items"
        description="Menu_Item — linked to shop and categories. Data from /api/v1/menu-items."
        columns={columns}
        searchPlaceholder="Search name, description, shop, categories…"
        pageSize={PAGE_SIZE}
        refreshToken={refreshToken}
        toolbarActions={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            Add menu item
          </Button>
        }
        loadData={loadData}
      />
      <AddMenuItemForm
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => setRefreshToken((n) => n + 1)}
      />
    </>
  );
}
