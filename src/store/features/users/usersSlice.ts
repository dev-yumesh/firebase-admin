import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import { API_ENDPOINTS } from "@/constants/apiEndpoints"
import axiosClient from "@/lib/axiosClient"
import type { Pagination } from "@/store/types"
import { AxiosError } from "axios"

export interface AdminUser {
  id: string | number
  name?: string
  email?: string
  phone?: string
  role?: string
  isEmailVerified?: boolean
  isPhoneVerified?: boolean
  isActive?: boolean
  status?: string
  createdAt?: string | null
  updatedAt?: string | null
}

interface UsersListResponse {
  items: AdminUser[]
  pagination: Pagination
}

interface UsersState {
  items: AdminUser[]
  pagination: Pagination
  loading: boolean
  error: string | null
  selected: AdminUser | null
  detailLoading: boolean
  detailError: string | null
}

const initialState: UsersState = {
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

export const fetchUsersThunk = createAsyncThunk<
  UsersListResponse,
  { page: number; limit: number; search?: string },
  { rejectValue: string }
>("users/fetchList", async ({ page, limit, search }, { rejectWithValue }) => {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    })

    if (search?.trim()) {
      params.set("search", search.trim())
    }

    const { data } = await axiosClient.get(`${API_ENDPOINTS.users.list}?${params.toString()}`)
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
})

export const fetchUserByIdThunk = createAsyncThunk<
  AdminUser,
  string | number,
  { rejectValue: string }
>("users/fetchById", async (id, { rejectWithValue }) => {
  try {
    const { data } = await axiosClient.get(API_ENDPOINTS.users.detail(id))
    return data?.data ?? data
  } catch (error) {
    return rejectWithValue(getErrorMessage(error))
  }
})

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearSelectedUser: (state) => {
      state.selected = null
      state.detailError = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsersThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUsersThunk.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.items
        state.pagination = action.payload.pagination
      })
      .addCase(fetchUsersThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || "Failed to fetch users"
      })
      .addCase(fetchUserByIdThunk.pending, (state) => {
        state.detailLoading = true
        state.detailError = null
      })
      .addCase(fetchUserByIdThunk.fulfilled, (state, action) => {
        state.detailLoading = false
        state.selected = action.payload
      })
      .addCase(fetchUserByIdThunk.rejected, (state, action) => {
        state.detailLoading = false
        state.detailError = action.payload || "Failed to fetch user details"
      })
  },
})

export const { clearSelectedUser } = usersSlice.actions
export default usersSlice.reducer

