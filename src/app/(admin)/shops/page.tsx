"use client"
import ComponentCard from "@/components/common/ComponentCard"
import PageBreadcrumb from "@/components/common/PageBreadCrumb"
import AppTable from "@/components/tables/AppTable"
import Badge from "@/components/ui/badge/Badge"
import { Dropdown } from "@/components/ui/dropdown/Dropdown"
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem"
import React, { useMemo, useState, useEffect } from "react"
import { Copy, Eye, Mail, MoreVertical } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  AdminShop,
  fetchShopsThunk,
} from "@/store/features/shops/shopsSlice"

const PAGE_SIZE = 10

const baseColumns = [
  {
    header: "Shop Name",
    accessor: "shopName",
    render: (row: AdminShop) => row.shopName || "-",
  },
  {
    header: "Shop Email",
    accessor: "shopEmail",
    render: (row: AdminShop) => row.shopEmail || "-",
  },
  {
    header: "Type",
    accessor: "shopType",
    render: (row: AdminShop) => row.shopType || "-",
  },
  {
    header: "Owner ID",
    accessor: "ownerId",
    render: (row: AdminShop) => row.ownerId || "-",
  },
  {
    header: "Seating",
    accessor: "hasSeating",
    render: (row: AdminShop) => (
      <Badge size="sm" color={row.hasSeating ? "success" : "light"}>
        {row.hasSeating ? "Yes" : "No"}
      </Badge>
    ),
  },
  {
    header: "Email",
    accessor: "isEmailVerified",
    render: (row: AdminShop) => (
      <Badge size="sm" color={row.isEmailVerified ? "success" : "warning"}>
        {row.isEmailVerified ? "Verified" : "Pending"}
      </Badge>
    ),
  },
  {
    header: "Owner",
    accessor: "isOwnerVerified",
    render: (row: AdminShop) => (
      <Badge size="sm" color={row.isOwnerVerified ? "success" : "warning"}>
        {row.isOwnerVerified ? "Verified" : "Pending"}
      </Badge>
    ),
  },
  {
    header: "Shop",
    accessor: "isVerified",
    render: (row: AdminShop) => (
      <Badge size="sm" color={row.isVerified ? "success" : "warning"}>
        {row.isVerified ? "Verified" : "Pending"}
      </Badge>
    ),
  },
  {
    header: "Account",
    accessor: "isActive",
    render: (row: AdminShop) => (
      <Badge size="sm" color={row.isActive ? "success" : "error"}>
        {row.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    header: "Status",
    accessor: "status",
    render: (row: AdminShop) => row.status || "-",
  },
  {
    header: "Created At",
    accessor: "createdAt",
    render: (row: AdminShop) =>
      row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-",
  },
]

const Page = () => {
  const dispatch = useAppDispatch()
  const { items: shops, loading, error, pagination } = useAppSelector(
    (state) => state.shops,
  )

  const [currentPage, setCurrentPage] = useState(1)
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [openActionMenuId, setOpenActionMenuId] = useState<string | number | null>(null)

  useEffect(() => {
    dispatch(
      fetchShopsThunk({
        page: currentPage,
        limit: PAGE_SIZE,
        search: searchQuery,
      }),
    )
  }, [currentPage, searchQuery, dispatch])

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1)
      setSearchQuery(searchInput.trim())
    }, 400)

    return () => clearTimeout(timer)
  }, [searchInput])

  const handleCopyId = async (id: string | number) => {
    try {
      await navigator.clipboard.writeText(String(id))
    } catch (copyError) {
      console.error("Failed to copy shop id", copyError)
    } finally {
      setOpenActionMenuId(null)
    }
  }

  const tableColumns = useMemo(
    () => [
      ...baseColumns,
      {
        header: "Action",
        accessor: "action",
        className: "whitespace-nowrap",
        render: (row: AdminShop) => (
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
                href={`/shops/${row.id}`}
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
                Copy Shop ID
              </DropdownItem>
              <DropdownItem
                tag="a"
                href={row.shopEmail ? `mailto:${row.shopEmail}` : "#"}
                onItemClick={() => setOpenActionMenuId(null)}
                className={`flex items-center gap-2 rounded-lg ${row.shopEmail ? "" : "pointer-events-none opacity-50"}`}
              >
                <Mail className="h-4 w-4" />
                Send Email
              </DropdownItem>
            </Dropdown>
          </div>
        ),
      },
    ],
    [openActionMenuId],
  )

  return (
    <div>
      <PageBreadcrumb pageTitle="Shops" />
      <div className="space-y-6">
        <ComponentCard title="Shops">
          <div className="mb-4">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, email, type, owner, or status"
              className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </div>
          {loading && <p className="mb-2 text-sm text-gray-500">Loading...</p>}
          {error && <p className="mb-2 text-sm text-error-500">{error}</p>}
          <div className="w-full max-w-full overflow-x-hidden">
            <AppTable<AdminShop>
              data={shops}
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
  )
}

export default Page
