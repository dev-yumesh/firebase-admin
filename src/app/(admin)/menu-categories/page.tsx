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

export interface FoodCategory {
  id: string | number;
  slug: string;
  title: string;
  description: string;
  logo?: string;
  status: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: any;
  updatedAt?: any;
}

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


const page = () => {

  const [openAddModal, setOpenAddModal] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | null>(null)
  const [categories, setCategories] = useState<FoodCategory[]>([])
  const [loading, setLoading] = useState(false)

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/menu-categories')
      const data = await res.json()
      setCategories(data)
    } catch (error) {
      console.error('Failed to fetch categories', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleSave = async (data: any) => {
    setLoading(true)

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
        const res = await fetch('/api/menu-categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          let errorMessage = 'Failed to create category'
          try {
            const errorBody = await res.json()
            if (errorBody?.error) {
              errorMessage = errorBody.error
            }
          } catch {
            // ignore json parse error
          }
          throw new Error(errorMessage)
        }
      } else if (modalMode === "edit" && selectedCategory?.slug) {
        const res = await fetch(
          `/api/menu-categories?slug=${encodeURIComponent(
            selectedCategory.slug,
          )}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          },
        )

        if (!res.ok) {
          let errorMessage = 'Failed to update category'
          try {
            const errorBody = await res.json()
            if (errorBody?.error) {
              errorMessage = errorBody.error
            }
          } catch {
            // ignore json parse error
          }
          throw new Error(errorMessage)
        }
      }

      await fetchCategories()
    } finally {
      setLoading(false)
    }
  }


  return (
    <div>
      <PageBreadcrumb pageTitle="Basic Table" />
      <div className="space-y-6">
        <ComponentCard title="Menu Categories"  >
          <div className='justify-end flex mb-4' >
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
          <FoodCategoryTable
            data={categories}
            onEdit={(row) => {
              setSelectedCategory(row)
              setModalMode("edit")
              setOpenAddModal(true)
            }}
          />
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

export default page

export function FoodCategoryTable({
  data,
  onEdit,
}: {
  data: FoodCategory[]
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
      pageSize={5}   // change rows per page dynamically
    />
  );
}
