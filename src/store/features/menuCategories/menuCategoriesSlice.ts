import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import { API_ENDPOINTS } from "@/constants/apiEndpoints"
import axiosClient from "@/lib/axiosClient"
import type { Pagination } from "@/store/types"
import { AxiosError } from "axios"

export interface MenuCategory {
  id: string | number
  slug: string
  title: string
  description: string
  logo?: string
  icon?: string
  color?: string
  groupType?: string
  isSystemDefined?: boolean
  isFilterable?: boolean
  isMultiSelectable?: boolean
  status: string
  isActive: boolean
  sortOrder: number
  createdAt?: string | null
  updatedAt?: string | null
}

interface CategoriesListResponse {
  items: MenuCategory[]
  pagination: Pagination
}

interface CategoriesState {
  items: MenuCategory[]
  pagination: Pagination
  loading: boolean
  error: string | null
}

const initialState: CategoriesState = {
  items: [],
  pagination: {
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 1,
  },
  loading: false,
  error: null,
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    return (error.response?.data as any)?.error || error.message
  }
  return error instanceof Error ? error.message : "Request failed"
}

export const fetchMenuCategoriesThunk = createAsyncThunk<
  CategoriesListResponse,
  { page: number; limit: number; search?: string },
  { rejectValue: string }
>(
  "menuCategories/fetchList",
  async ({ page, limit, search }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      })

      if (search?.trim()) {
        params.set("search", search.trim())
      }

      const { data } = await axiosClient.get(
        `${API_ENDPOINTS.menuCategories.list}?${params.toString()}`,
      )

      if (Array.isArray(data)) {
        return {
          items: data,
          pagination: {
            page,
            limit,
            total: data.length,
            totalPages: Math.max(1, Math.ceil(data.length / limit)),
          },
        }
      }

      const payload = data?.data ?? data
      const items = payload?.items ?? []
      const apiPagination = payload?.pagination ?? {}

      return {
        items,
        pagination: {
          page: Number(apiPagination?.page || page),
          limit: Number(apiPagination?.limit || limit),
          total: Number(apiPagination?.total || 0),
          totalPages: Math.max(1, Number(apiPagination?.totalPages || 1)),
        },
      }
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  },
)

export const createMenuCategoryThunk = createAsyncThunk<
  void,
  Record<string, any>,
  { rejectValue: string }
>("menuCategories/create", async (payload, { rejectWithValue }) => {
  try {
    await axiosClient.post(API_ENDPOINTS.menuCategories.list, payload)
  } catch (error) {
    return rejectWithValue(getErrorMessage(error))
  }
})

export const updateMenuCategoryThunk = createAsyncThunk<
  void,
  { slug: string; payload: Record<string, any> },
  { rejectValue: string }
>("menuCategories/update", async ({ slug, payload }, { rejectWithValue }) => {
  try {
    await axiosClient.put(API_ENDPOINTS.menuCategories.bySlug(slug), payload)
  } catch (error) {
    return rejectWithValue(getErrorMessage(error))
  }
})

const menuCategoriesSlice = createSlice({
  name: "menuCategories",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMenuCategoriesThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMenuCategoriesThunk.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.items
        state.pagination = action.payload.pagination
      })
      .addCase(fetchMenuCategoriesThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || "Failed to fetch categories"
      })
      .addCase(createMenuCategoryThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createMenuCategoryThunk.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(createMenuCategoryThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || "Failed to create category"
      })
      .addCase(updateMenuCategoryThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateMenuCategoryThunk.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(updateMenuCategoryThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || "Failed to update category"
      })
  },
})

export default menuCategoriesSlice.reducer
