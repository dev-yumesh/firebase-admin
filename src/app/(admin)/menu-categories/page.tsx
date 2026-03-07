"use client"
import ComponentCard from '@/components/common/ComponentCard'
import PageBreadcrumb from '@/components/common/PageBreadCrumb'
import AddMenuForm from '@/components/form/AddMenuForm'
import AppTable from '@/components/tables/AppTable'
import Badge from '@/components/ui/badge/Badge'
import Button from '@/components/ui/button/Button'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import { Pencil as EditIcon } from 'lucide-react'
import { storage, ID } from '@/lib/appwriteServices'
import { env } from '../../../../config/env.config'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  MenuCategory,
  createMenuCategoryThunk,
  fetchMenuCategoriesThunk,
  updateMenuCategoryThunk,
} from '@/store/features/menuCategories/menuCategoriesSlice'

export type FoodCategory = MenuCategory

const PAGE_SIZE = 5;

const columns = [
  {
    header: "Logo",
    accessor: "logo",

    render: (row: FoodCategory) =>
      row.logo ? (
        <div className="w-10 h-10 rounded overflow-hidden">
          <Image
            src={row.logo}
            alt={row.title}
            width={40}
            height={40}
          />
        </div>
      ) : null,
  },
  {
    header: "Title",
    accessor: "title",
  },
  {
    header: "Slug",
    accessor: "slug",
  },
  {
    header: "Description",
    accessor: "description",
  },
  {
    header: "Sort Order",
    accessor: "sortOrder",
  },
  {
    header: "Status",
    accessor: "status",
    render: (row: FoodCategory) => (
      <Badge
        size="sm"
        color={row.isActive ? "success" : "error"}
      >
        {row.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    header: "Created At",
    accessor: "createdAt",
    render: (row: FoodCategory) =>
      row.createdAt
        ? new Date(
            (row.createdAt as any)?.toDate
              ? (row.createdAt as any).toDate()
              : row.createdAt,
          ).toLocaleDateString()
        : '-',
  },
];

const Page = () => {
  const dispatch = useAppDispatch()
  const { items: categories, loading, error, pagination } = useAppSelector(
    (state) => state.menuCategories,
  )

  const [openAddModal, setOpenAddModal] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    dispatch(
      fetchMenuCategoriesThunk({
        page: currentPage,
        limit: PAGE_SIZE,
        search: searchQuery,
      }),
    )
  }, [currentPage, searchQuery, dispatch])

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim()
      setCurrentPage(1)
      setSearchQuery(trimmed)
    }, 400)

    return () => clearTimeout(timer)
  }, [searchInput])

  const handleSave = async (data: any) => {
    try {
      let logoUrl: string | undefined =
        modalMode === "edit" ? selectedCategory?.logo : undefined

      if (data.imageFile) {
        const file = await storage.createFile({
         bucketId:  env.APPWRITE_STORAGE_BUCKET_ID,
         fileId: ID.unique(),
         file: data.imageFile,
        })


        const fileId = (file as any).$id || (file as any).id
        logoUrl = `${env.APPWRITE_ENDPOINT}/storage/buckets/${env.APPWRITE_STORAGE_BUCKET_ID}/files/${fileId}/view?project=${env.APPWRITE_PROJECT_ID}`
      }

      const payload = {
        slug: modalMode === "edit" ? selectedCategory?.slug : data.slug,
        title: data.title,
        description: data.description,
        sortOrder: Number(data.sortOrder) || 1,
        isActive: data.isActive,
        status: data.isActive ? 'active' : 'inactive',
        logo: logoUrl,
      }

      if (modalMode === "create") {
        await dispatch(createMenuCategoryThunk(payload)).unwrap()
      } else if (modalMode === "edit" && selectedCategory?.slug) {
        await dispatch(
          updateMenuCategoryThunk({
            slug: selectedCategory.slug,
            payload,
          }),
        ).unwrap()
      }

      await dispatch(
        fetchMenuCategoriesThunk({
          page: currentPage,
          limit: PAGE_SIZE,
          search: searchQuery,
        }),
      )
    } catch (saveError) {
      console.error('Failed to save category', saveError)
    }
  }


  return (
    <div>
      <PageBreadcrumb pageTitle="Basic Table" />
      <div className="space-y-6">
        <ComponentCard title="Menu Categories"  >
          <div className='mb-4 flex items-center justify-between gap-4'>
           <input
             value={searchInput}
             onChange={(e) => setSearchInput(e.target.value)}
             placeholder='Search by title, slug, or description'
             className='w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500'
           />
           <Button
             size='sm'
             onClick={() => {
               setModalMode("create")
               setSelectedCategory(null)
               setOpenAddModal(true)
             }}
           >
             <p>Create New</p>
           </Button>
          </div>
          {loading && <p className="mb-2 text-sm text-gray-500">Loading...</p>}
          {error && <p className="mb-2 text-sm text-error-500">{error}</p>}
          <div className="w-full max-w-full overflow-x-auto">
            <FoodCategoryTable
              data={categories}
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              onPageChange={(nextPage) => setCurrentPage(nextPage)}
              onEdit={(row) => {
                setSelectedCategory(row)
                setModalMode("edit")
                setOpenAddModal(true)
              }}
            />
          </div>
        </ComponentCard>
      </div>
      <AddMenuForm
        isOpen={openAddModal}
        closeModal={() => {
          setOpenAddModal(false)
          setSelectedCategory(null)
        }}
        handleSave={handleSave}
        mode={modalMode}
        initialData={selectedCategory || undefined}
       />
    </div>
  )
}

export default Page

export function FoodCategoryTable({
  data,
  currentPage,
  totalPages,
  onPageChange,
  onEdit,
}: {
  data: FoodCategory[]
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onEdit: (row: FoodCategory) => void
}) {
  const tableColumns = [
    ...columns,
    {
      header: "Actions",
      accessor: "actions",
      render: (row: FoodCategory) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(row)}
          >
            <EditIcon className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <AppTable<FoodCategory>
      data={data}
      columns={tableColumns}
      pageSize={PAGE_SIZE}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
    />
  );
}
