"use client";

import Badge from "@/components/ui/badge/Badge";
import React, { useCallback, useMemo } from "react";
import PanelResourceListPage, {
  type ResourceColumn,
} from "./PanelResourceListPage";

/** Minimal row shape for placeholder tables (no backend yet). */
type PlaceholderRow = { id: string };

export type PlaceholderEntityKey =
  | "tables"
  | "orders"
  | "orderHistory"
  | "feedPosts"
  | "recipes"
  | "coinTransactions";

const CONFIG: Record<
  PlaceholderEntityKey,
  {
    pageTitle: string;
    description: string;
    searchPlaceholder: string;
    columns: ResourceColumn<PlaceholderRow>[];
  }
> = {
  tables: {
    pageTitle: "Tables",
    description:
      "Table model — shopId, floorId, tableNumber, seats, QR. Connect API when ready.",
    searchPlaceholder: "Search tables (coming soon)",
    columns: [
      { header: "Table ID", accessor: "id", render: () => "—" },
      { header: "Shop ID", accessor: "shopId", render: () => "—" },
      { header: "Floor ID", accessor: "floorId", render: () => "—" },
      { header: "Number", accessor: "tableNumber", render: () => "—" },
      { header: "Seats", accessor: "totalSeats", render: () => "—" },
      {
        header: "Occupied",
        accessor: "isOccupied",
        render: () => "—",
      },
      { header: "Updated", accessor: "updatedAt", render: () => "—" },
    ],
  },
  orders: {
    pageTitle: "Orders",
    description:
      "Active_Orders — live orderNumber, status, items. API wiring pending.",
    searchPlaceholder: "Search orders (coming soon)",
    columns: [
      { header: "Order #", accessor: "orderNumber", render: () => "—" },
      { header: "Shop ID", accessor: "shopId", render: () => "—" },
      { header: "Table", accessor: "tableId", render: () => "—" },
      { header: "Status", accessor: "orderStatus", render: () => "—" },
      { header: "Date", accessor: "orderDate", render: () => "—" },
      { header: "Note", accessor: "note", render: () => "—" },
    ],
  },
  orderHistory: {
    pageTitle: "Order history",
    description:
      "Order_Log — completed orders, paymentId, paymentStatus, paidAmount.",
    searchPlaceholder: "Search history (coming soon)",
    columns: [
      { header: "Order #", accessor: "orderNumber", render: () => "—" },
      { header: "Shop ID", accessor: "shopId", render: () => "—" },
      { header: "Status", accessor: "orderStatus", render: () => "—" },
      {
        header: "Payment",
        accessor: "paymentStatus",
        render: () => (
          <Badge size="sm" color="light">
            —
          </Badge>
        ),
      },
      { header: "Paid", accessor: "paidAmount", render: () => "—" },
      { header: "Date", accessor: "orderDate", render: () => "—" },
    ],
  },
  feedPosts: {
    pageTitle: "Feed posts",
    description: "Feed_Post — owner/admin content, shopId, likes.",
    searchPlaceholder: "Search posts (coming soon)",
    columns: [
      { header: "Title", accessor: "title", render: () => "—" },
      { header: "Author", accessor: "authorId", render: () => "—" },
      { header: "Type", accessor: "authorType", render: () => "—" },
      { header: "Shop ID", accessor: "shopId", render: () => "—" },
      { header: "Likes", accessor: "likeCount", render: () => "—" },
      { header: "Updated", accessor: "updatedAt", render: () => "—" },
    ],
  },
  recipes: {
    pageTitle: "Recipes",
    description: "Recipe — user recipes, ingredients, steps, medias.",
    searchPlaceholder: "Search recipes (coming soon)",
    columns: [
      { header: "Title", accessor: "title", render: () => "—" },
      { header: "User ID", accessor: "userId", render: () => "—" },
      { header: "Likes", accessor: "likeCount", render: () => "—" },
      { header: "Updated", accessor: "updatedAt", render: () => "—" },
    ],
  },
  coinTransactions: {
    pageTitle: "Coin transactions",
    description:
      "Coin_Transaction — CREDIT/DEBIT, source (ORDER_REWARD, REDEEM, ADMIN_ADJUST).",
    searchPlaceholder: "Search transactions (coming soon)",
    columns: [
      { header: "User ID", accessor: "userId", render: () => "—" },
      {
        header: "Type",
        accessor: "type",
        render: () => "—",
      },
      { header: "Amount", accessor: "amount", render: () => "—" },
      { header: "Source", accessor: "source", render: () => "—" },
      { header: "Reference", accessor: "referenceId", render: () => "—" },
      { header: "Created", accessor: "createdAt", render: () => "—" },
    ],
  },
};

export default function EntityPlaceholderTablePage({
  entity,
}: {
  entity: PlaceholderEntityKey;
}) {
  const columns = useMemo(() => CONFIG[entity].columns, [entity]);

  const loadData = useCallback(async () => {
    return { items: [] as PlaceholderRow[], totalPages: 1 };
  }, []);

  const c = CONFIG[entity];

  return (
    <PanelResourceListPage<PlaceholderRow>
      pageTitle={c.pageTitle}
      description={c.description}
      columns={columns}
      searchPlaceholder={c.searchPlaceholder}
      loadData={loadData}
    />
  );
}
