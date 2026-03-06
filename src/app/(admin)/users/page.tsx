"use client"
import ComponentCard from "@/components/common/ComponentCard"
import PageBreadcrumb from "@/components/common/PageBreadCrumb"
import AppTable from "@/components/tables/AppTable"
import Badge from "@/components/ui/badge/Badge"
import React, { useEffect, useState } from "react"

export interface AdminUser {
  id: string | number;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  isActive?: boolean;
  status?: string;
  createdAt?: string | null;
}

const PAGE_SIZE = 10

const columns = [
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
]

const page = () => {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const fetchUsers = async (pageNumber: number, searchTerm: string) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: String(pageNumber),
        limit: String(PAGE_SIZE),
      })

      if (searchTerm) {
        params.set("search", searchTerm)
      }

      const res = await fetch(`/api/users?${params.toString()}`)
      const data = await res.json()

      setUsers(data.items || [])
      setTotalPages(Math.max(1, data?.pagination?.totalPages || 1))
      if (typeof data?.pagination?.page === "number" && data.pagination.page !== pageNumber) {
        setCurrentPage(data.pagination.page)
      }
    } catch (error) {
      console.error("Failed to fetch users", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers(currentPage, searchQuery)
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
          <div className="w-full max-w-full overflow-x-auto">
            <AppTable<AdminUser>
              data={users}
              columns={columns}
              pageSize={PAGE_SIZE}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(nextPage) => setCurrentPage(nextPage)}
            />
          </div>
        </ComponentCard>
      </div>
    </div>
  )
}

export default page
