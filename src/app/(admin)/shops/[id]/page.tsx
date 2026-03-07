"use client"

import ComponentCard from "@/components/common/ComponentCard"
import PageBreadcrumb from "@/components/common/PageBreadCrumb"
import Badge from "@/components/ui/badge/Badge"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import React, { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  clearSelectedShop,
  fetchShopByIdThunk,
} from "@/store/features/shops/shopsSlice"

const formatDate = (value?: string | null) => {
  if (!value) return "-"
  return new Date(value).toLocaleString()
}

const Page = () => {
  const dispatch = useAppDispatch()
  const { selected: shop, detailLoading: loading, detailError: error } = useAppSelector(
    (state) => state.shops,
  )

  const params = useParams<{ id: string }>()
  const id = decodeURIComponent(params?.id || "")

  useEffect(() => {
    if (id) {
      dispatch(fetchShopByIdThunk(id))
    }

    return () => {
      dispatch(clearSelectedShop())
    }
  }, [id, dispatch])

  return (
    <div>
      <PageBreadcrumb pageTitle="Shop Details" />
      <div className="mb-4">
        <Link
          href="/shops"
          className="text-sm font-medium text-brand-500 hover:text-brand-600"
        >
          Back to Shops
        </Link>
      </div>
      {loading && <p className="text-sm text-gray-500">Loading shop details...</p>}
      {error && <p className="text-sm text-error-500">{error}</p>}
      {!loading && !error && shop && (
        <div className="space-y-6">
          <ComponentCard title="Shop Profile">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-gray-500">Shop ID</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{shop.id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Shop Name</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{shop.shopName || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Shop Email</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{shop.shopEmail || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Shop Type</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{shop.shopType || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Owner ID</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{shop.ownerId || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Shop Logo URL</p>
                <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">{shop.logoURL || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Shop QR URL</p>
                <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">{shop.shopQR || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{shop.status || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Created At</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{formatDate(shop.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Updated At</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{formatDate(shop.updatedAt)}</p>
              </div>
            </div>
          </ComponentCard>

          <ComponentCard title="Shop Assets">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs text-gray-500">Shop Logo</p>
                {shop.logoURL ? (
                  <a
                    href={shop.logoURL}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-fit"
                  >
                    <Image
                      src={shop.logoURL}
                      alt={shop.shopName || "Shop logo"}
                      width={120}
                      height={120}
                      unoptimized
                      className="rounded-lg border border-gray-200 object-cover"
                    />
                  </a>
                ) : (
                  <p className="text-sm text-gray-500">No logo available</p>
                )}
              </div>
              <div>
                <p className="mb-2 text-xs text-gray-500">Shop QR</p>
                {shop.shopQR ? (
                  <a
                    href={shop.shopQR}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-fit"
                  >
                    <Image
                      src={shop.shopQR}
                      alt={`${shop.shopName || "Shop"} QR`}
                      width={140}
                      height={140}
                      unoptimized
                      className="rounded-lg border border-gray-200 object-cover"
                    />
                  </a>
                ) : (
                  <p className="text-sm text-gray-500">No QR available</p>
                )}
              </div>
            </div>
          </ComponentCard>

          <ComponentCard title="Verification & Account">
            <div className="flex flex-wrap gap-3">
              <Badge size="sm" color={shop.hasSeating ? "success" : "light"}>
                {shop.hasSeating ? "Has Seating" : "No Seating"}
              </Badge>
              <Badge size="sm" color={shop.isEmailVerified ? "success" : "warning"}>
                {shop.isEmailVerified ? "Email Verified" : "Email Pending"}
              </Badge>
              <Badge size="sm" color={shop.isOwnerVerified ? "success" : "warning"}>
                {shop.isOwnerVerified ? "Owner Verified" : "Owner Pending"}
              </Badge>
              <Badge size="sm" color={shop.isVerified ? "success" : "warning"}>
                {shop.isVerified ? "Shop Verified" : "Shop Pending"}
              </Badge>
              <Badge size="sm" color={shop.isActive ? "success" : "error"}>
                {shop.isActive ? "Account Active" : "Account Inactive"}
              </Badge>
            </div>
          </ComponentCard>
        </div>
      )}
    </div>
  )
}

export default Page
