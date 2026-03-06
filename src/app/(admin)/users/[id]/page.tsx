"use client"

import ComponentCard from "@/components/common/ComponentCard"
import PageBreadcrumb from "@/components/common/PageBreadCrumb"
import Badge from "@/components/ui/badge/Badge"
import Link from "next/link"
import { useParams } from "next/navigation"
import React, { useEffect, useState } from "react"

interface UserDetails {
  id: string | number;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

const formatDate = (value?: string | null) => {
  if (!value) return "-"
  return new Date(value).toLocaleString()
}

const Page = () => {
  const params = useParams<{ id: string }>()
  const id = decodeURIComponent(params?.id || "")
  const [user, setUser] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return

      try {
        setLoading(true)
        setError("")
        const res = await fetch(`/api/users?id=${encodeURIComponent(id)}`)
        if (!res.ok) {
          throw new Error("Unable to fetch user details")
        }
        const data = await res.json()
        setUser(data)
      } catch (err: any) {
        setError(err?.message || "Unable to fetch user details")
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [id])

  return (
    <div>
      <PageBreadcrumb pageTitle="User Details" />
      <div className="mb-4">
        <Link
          href="/users"
          className="text-sm font-medium text-brand-500 hover:text-brand-600"
        >
          Back to Users
        </Link>
      </div>
      {loading && <p className="text-sm text-gray-500">Loading user details...</p>}
      {error && <p className="text-sm text-error-500">{error}</p>}
      {!loading && !error && user && (
        <div className="space-y-6">
          <ComponentCard title="User Profile">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-gray-500">User ID</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{user.id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{user.name || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{user.email || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{user.phone || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Role</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{user.role || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{user.status || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Created At</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{formatDate(user.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Updated At</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{formatDate(user.updatedAt)}</p>
              </div>
            </div>
          </ComponentCard>

          <ComponentCard title="Verification & Account">
            <div className="flex flex-wrap gap-3">
              <Badge size="sm" color={user.isEmailVerified ? "success" : "warning"}>
                {user.isEmailVerified ? "Email Verified" : "Email Pending"}
              </Badge>
              <Badge size="sm" color={user.isPhoneVerified ? "success" : "warning"}>
                {user.isPhoneVerified ? "Phone Verified" : "Phone Pending"}
              </Badge>
              <Badge size="sm" color={user.isActive ? "success" : "error"}>
                {user.isActive ? "Account Active" : "Account Inactive"}
              </Badge>
            </div>
          </ComponentCard>
        </div>
      )}
    </div>
  )
}

export default Page
