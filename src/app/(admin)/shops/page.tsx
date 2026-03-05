"use client"
import ComponentCard from "@/components/common/ComponentCard"
import PageBreadcrumb from "@/components/common/PageBreadCrumb"
import AppTable from "@/components/tables/AppTable"
import Badge from "@/components/ui/badge/Badge"
import React, { useEffect, useState } from "react"

export interface AdminShop {
  id: string | number;
  shopName?: string;
  shopEmail?: string;
  shopType?: string;
  ownerId?: string;
  hasSeating?: boolean;
  isEmailVerified?: boolean;
  isOwnerVerified?: boolean;
  isVerified?: boolean;
  isActive?: boolean;
  status?: string;
  createdAt?: string | null;
}

const PAGE_SIZE = 10

const columns = [
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

const page = () => {
  const [shops, setShops] = useState<AdminShop[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const fetchShops = async (pageNumber: number, searchTerm: string) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: String(pageNumber),
        limit: String(PAGE_SIZE),
      })

      if (searchTerm) {
        params.set("search", searchTerm)
      }

      const res = await fetch(`/api/shops?${params.toString()}`)
      const data = await res.json()

      setShops(data.items || [])
      setTotalPages(Math.max(1, data?.pagination?.totalPages || 1))
      if (typeof data?.pagination?.page === "number" && data.pagination.page !== pageNumber) {
        setCurrentPage(data.pagination.page)
      }
    } catch (error) {
      console.error("Failed to fetch shops", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchShops(currentPage, searchQuery)
  }, [currentPage, searchQuery])

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1)
      setSearchQuery(searchInput.trim())
    }, 400)

    return () => clearTimeout(timer)
  }, [searchInput])

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
          <AppTable<AdminShop>
            data={shops}
            columns={columns}
            pageSize={PAGE_SIZE}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(nextPage) => setCurrentPage(nextPage)}
          />
        </ComponentCard>
      </div>
    </div>
  )
}

export default page
