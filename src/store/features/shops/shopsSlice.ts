import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import { API_ENDPOINTS } from "@/constants/apiEndpoints"
import axiosClient from "@/lib/axiosClient"
import type { Pagination } from "@/store/types"
import { AxiosError } from "axios"

export interface AdminShop {
  id: string | number
  shopName?: string
  shopEmail?: string
  shopType?: string
  ownerId?: string
  shopQR?: string
  logoURL?: string
  hasSeating?: boolean
  isEmailVerified?: boolean
  isOwnerVerified?: boolean
  isVerified?: boolean
  isActive?: boolean
  status?: string
  createdAt?: string | null
  updatedAt?: string | null
}

interface ShopsListResponse {
  items: AdminShop[]
  pagination: Pagination
}

interface ShopsState {
  items: AdminShop[]
  pagination: Pagination
  loading: boolean
  error: string | null
  selected: AdminShop | null
  detailLoading: boolean
  detailError: string | null
}

const initialState: ShopsState = {
  items: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  },
  loading: false,
  error: null,
  selected: null,
  detailLoading: false,
  detailError: null,
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    return (error.response?.data as any)?.error || error.message
  }
  return error instanceof Error ? error.message : "Request failed"
}

export const fetchShopsThunk = createAsyncThunk<
  ShopsListResponse,
  { page: number; limit: number; search?: string },
  { rejectValue: string }
>("shops/fetchList", async ({ page, limit, search }, { rejectWithValue }) => {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    })

    if (search?.trim()) {
      params.set("search", search.trim())
    }

    const { data } = await axiosClient.get(`${API_ENDPOINTS.shops.list}?${params.toString()}`)

    return {
      items: data?.items || [],
      pagination: {
        page: Number(data?.pagination?.page || page),
        limit: Number(data?.pagination?.limit || limit),
        total: Number(data?.pagination?.total || 0),
        totalPages: Math.max(1, Number(data?.pagination?.totalPages || 1)),
      },
    }
  } catch (error) {
    return rejectWithValue(getErrorMessage(error))
  }
})

export const fetchShopByIdThunk = createAsyncThunk<
  AdminShop,
  string | number,
  { rejectValue: string }
>("shops/fetchById", async (id, { rejectWithValue }) => {
  try {
    const { data } = await axiosClient.get(API_ENDPOINTS.shops.detail(id))
    return data
  } catch (error) {
    return rejectWithValue(getErrorMessage(error))
  }
})

const shopsSlice = createSlice({
  name: "shops",
  initialState,
  reducers: {
    clearSelectedShop: (state) => {
      state.selected = null
      state.detailError = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShopsThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchShopsThunk.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.items
        state.pagination = action.payload.pagination
      })
      .addCase(fetchShopsThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || "Failed to fetch shops"
      })
      .addCase(fetchShopByIdThunk.pending, (state) => {
        state.detailLoading = true
        state.detailError = null
      })
      .addCase(fetchShopByIdThunk.fulfilled, (state, action) => {
        state.detailLoading = false
        state.selected = action.payload
      })
      .addCase(fetchShopByIdThunk.rejected, (state, action) => {
        state.detailLoading = false
        state.detailError = action.payload || "Failed to fetch shop details"
      })
  },
})

export const { clearSelectedShop } = shopsSlice.actions
export default shopsSlice.reducer

