"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import AppTable from "@/components/tables/AppTable";
import Badge from "@/components/ui/badge/Badge";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { usePanelBase } from "@/context/PanelBaseContext";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { AdminUser, fetchUsersThunk } from "@/store/features/users/usersSlice";
import { Copy, Eye, Mail, MoreVertical } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 10;

const baseColumns = [
  {
    header: "Name",
    accessor: "name",
    render: (row: AdminUser) => row.name || "-",
  },
  {
    header: "Email",
    accessor: "email",
    render: (row: AdminUser) => row.email || "-",
  },
  {
    header: "Phone",
    accessor: "phone",
    render: (row: AdminUser) => row.phone || "-",
  },
  {
    header: "Role",
    accessor: "role",
    render: (row: AdminUser) => row.role || "-",
  },
  {
    header: "Email Verified",
    accessor: "isEmailVerified",
    render: (row: AdminUser) => (
      <Badge size="sm" color={row.isEmailVerified ? "success" : "warning"}>
        {row.isEmailVerified ? "Verified" : "Pending"}
      </Badge>
    ),
  },
  {
    header: "Phone Verified",
    accessor: "isPhoneVerified",
    render: (row: AdminUser) => (
      <Badge size="sm" color={row.isPhoneVerified ? "success" : "warning"}>
        {row.isPhoneVerified ? "Verified" : "Pending"}
      </Badge>
    ),
  },
  {
    header: "Account",
    accessor: "status",
    render: (row: AdminUser) => (
      <Badge size="sm" color={row.isActive ? "success" : "error"}>
        {row.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    header: "Status",
    accessor: "status",
    render: (row: AdminUser) => row.status || "-",
  },
  {
    header: "Created At",
    accessor: "createdAt",
    render: (row: AdminUser) =>
      row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-",
  },
];

export default function UsersListPage() {
  const { basePath } = usePanelBase();
  const dispatch = useAppDispatch();
  const { items: users, loading, error, pagination } = useAppSelector(
    (state) => state.users,
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [openActionMenuId, setOpenActionMenuId] = useState<
    string | number | null
  >(null);

  useEffect(() => {
    dispatch(
      fetchUsersThunk({
        page: currentPage,
        limit: PAGE_SIZE,
        search: searchQuery,
      }),
    );
  }, [currentPage, searchQuery, dispatch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      setSearchQuery(searchInput.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleCopyId = async (id: string | number) => {
    try {
      await navigator.clipboard.writeText(String(id));
    } catch (copyError) {
      console.error("Failed to copy user id", copyError);
    } finally {
      setOpenActionMenuId(null);
    }
  };

  const tableColumns = useMemo(
    () => [
      ...baseColumns,
      {
        header: "Action",
        accessor: "action",
        className: "whitespace-nowrap",
        render: (row: AdminUser) => (
          <div className="relative">
            <button
              type="button"
              className="dropdown-toggle rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
              onClick={() =>
                setOpenActionMenuId((prev) => (prev === row.id ? null : row.id))
              }
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            <Dropdown
              isOpen={openActionMenuId === row.id}
              onClose={() => setOpenActionMenuId(null)}
              className="min-w-[180px] p-1"
            >
              <DropdownItem
                tag="a"
                href={`${basePath}/users/${row.id}`}
                onItemClick={() => setOpenActionMenuId(null)}
                className="flex items-center gap-2 rounded-lg"
              >
                <Eye className="h-4 w-4" />
                View Details
              </DropdownItem>
              <DropdownItem
                onClick={() => handleCopyId(row.id)}
                className="flex items-center gap-2 rounded-lg"
              >
                <Copy className="h-4 w-4" />
                Copy User ID
              </DropdownItem>
              <DropdownItem
                tag="a"
                href={row.email ? `mailto:${row.email}` : "#"}
                onItemClick={() => setOpenActionMenuId(null)}
                className={`flex items-center gap-2 rounded-lg ${row.email ? "" : "pointer-events-none opacity-50"}`}
              >
                <Mail className="h-4 w-4" />
                Send Email
              </DropdownItem>
            </Dropdown>
          </div>
        ),
      },
    ],
    [openActionMenuId, basePath],
  );

  return (
    <div>
      <PageBreadcrumb pageTitle="Users" />
      <div className="space-y-6">
        <ComponentCard title="Users">
          <div className="mb-4">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, email, phone, role, or status"
              className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </div>
          {loading && <p className="mb-2 text-sm text-gray-500">Loading...</p>}
          {error && <p className="mb-2 text-sm text-error-500">{error}</p>}
          <div className="w-full max-w-full overflow-x-auto">
            <AppTable<AdminUser>
              data={users}
              columns={tableColumns}
              pageSize={PAGE_SIZE}
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              onPageChange={(nextPage) => setCurrentPage(nextPage)}
            />
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
