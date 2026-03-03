"use client"
import ComponentCard from '@/components/common/ComponentCard'
import PageBreadcrumb from '@/components/common/PageBreadCrumb'
import AddMenuForm from '@/components/form/AddMenuForm'
import AppTable from '@/components/tables/AppTable'
import BasicTableOne from '@/components/tables/BasicTableOne'
import Badge from '@/components/ui/badge/Badge'
import Button from '@/components/ui/button/Button'
import Image from 'next/image'
import React, { useState } from 'react'

const foodCategoriesMaster = [
  {
    id: 1,
    slug: "starters",
    title: "Starters",
    description: "Light dishes served before the main course.",
    logo: "starters.png",
    status: "active",
    isActive: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 2,
    slug: "soups",
    title: "Soups",
    description: "Warm and flavorful liquid-based dishes.",
    logo: "soups.png",
    status: "active",
    isActive: true,
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 3,
    slug: "salads-raita",
    title: "Salads & Raita",
    description: "Fresh salads and yogurt-based sides.",
    logo: "salads.png",
    status: "active",
    isActive: true,
    sortOrder: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 4,
    slug: "main-course-veg",
    title: "Main Course - Veg",
    description: "Vegetarian main course dishes.",
    logo: "veg-main.png",
    status: "active",
    isActive: true,
    sortOrder: 4,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 5,
    slug: "main-course-non-veg",
    title: "Main Course - Non Veg",
    description: "Non-vegetarian main course dishes.",
    logo: "nonveg-main.png",
    status: "active",
    isActive: true,
    sortOrder: 5,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 6,
    slug: "rice-biryani",
    title: "Rice & Biryani",
    description: "Rice-based specialties and biryanis.",
    logo: "rice.png",
    status: "active",
    isActive: true,
    sortOrder: 6,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 7,
    slug: "breads",
    title: "Breads",
    description: "Indian breads and baked flatbreads.",
    logo: "breads.png",
    status: "active",
    isActive: true,
    sortOrder: 7,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 8,
    slug: "chinese",
    title: "Chinese",
    description: "Popular Indo-Chinese dishes.",
    logo: "chinese.png",
    status: "active",
    isActive: true,
    sortOrder: 8,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 9,
    slug: "fast-food",
    title: "Fast Food",
    description: "Quick and ready-to-eat meals.",
    logo: "fastfood.png",
    status: "active",
    isActive: true,
    sortOrder: 9,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 10,
    slug: "street-food",
    title: "Street Food",
    description: "Local and roadside specialties.",
    logo: "streetfood.png",
    status: "active",
    isActive: true,
    sortOrder: 10,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 11,
    slug: "south-indian",
    title: "South Indian",
    description: "Traditional South Indian dishes.",
    logo: "southindian.png",
    status: "active",
    isActive: true,
    sortOrder: 11,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 12,
    slug: "bbq-grill",
    title: "BBQ & Grill",
    description: "Grilled and barbecue specialties.",
    logo: "bbq.png",
    status: "active",
    isActive: true,
    sortOrder: 12,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 13,
    slug: "beverages",
    title: "Beverages",
    description: "Refreshing drinks and beverages.",
    logo: "beverages.png",
    status: "active",
    isActive: true,
    sortOrder: 13,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 14,
    slug: "desserts",
    title: "Desserts",
    description: "Sweet dishes served after meals.",
    logo: "desserts.png",
    status: "active",
    isActive: true,
    sortOrder: 14,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 15,
    slug: "breakfast",
    title: "Breakfast",
    description: "Morning meals and light dishes.",
    logo: "breakfast.png",
    status: "active",
    isActive: true,
    sortOrder: 15,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 16,
    slug: "snacks",
    title: "Snacks",
    description: "Light bites for anytime hunger.",
    logo: "snacks.png",
    status: "active",
    isActive: true,
    sortOrder: 16,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 17,
    slug: "bakery",
    title: "Bakery",
    description: "Freshly baked breads and sweets.",
    logo: "bakery.png",
    status: "active",
    isActive: true,
    sortOrder: 17,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 18,
    slug: "pizza",
    title: "Pizza",
    description: "Italian style baked pizzas.",
    logo: "pizza.png",
    status: "active",
    isActive: true,
    sortOrder: 18,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 19,
    slug: "burgers",
    title: "Burgers",
    description: "Veg and non-veg burger varieties.",
    logo: "burgers.png",
    status: "active",
    isActive: true,
    sortOrder: 19,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 20,
    slug: "specials",
    title: "Specials / Chef Special",
    description: "Exclusive dishes recommended by the chef.",
    logo: "specials.png",
    status: "active",
    isActive: true,
    sortOrder: 20,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export interface FoodCategory {
  id: number;
  slug: string;
  title: string;
  description: string;
  logo: string;
  status: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const columns = [
  {
    header: "Logo",
    accessor: "logo",
    render: (row: FoodCategory) => (
      <div className="w-10 h-10 rounded overflow-hidden">
        <Image
          src={`/images/categories/${row.logo}`}
          alt={row.title}
          width={40}
          height={40}
        />
      </div>
    ),
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
      new Date(row.createdAt).toLocaleDateString(),
  },
];


const page = () => {

  const [openAddModal, setOpenAddModal] = useState(false)


  return (
    <div>
      <PageBreadcrumb pageTitle="Basic Table" />
      <div className="space-y-6">
        <ComponentCard title="Menu Categories"  >
          <div className='justify-end' >
           <Button size='sm' onClick={()=>setOpenAddModal(true)} ><p>Create New</p></Button>
          </div>
          <FoodCategoryTable/>
        </ComponentCard>
      </div>
      <AddMenuForm
        isOpen={openAddModal}
        closeModal={()=>setOpenAddModal(false)}
        handleSave={()=>{}}
       />
    </div>
  )
}

export default page

export function FoodCategoryTable() {
  return (
    <AppTable<FoodCategory>
      data={foodCategoriesMaster}
      columns={columns}
      pageSize={5}   // change rows per page dynamically
    />
  );
}
