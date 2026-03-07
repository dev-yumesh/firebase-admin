import { configureStore } from "@reduxjs/toolkit"
import usersReducer from "@/store/features/users/usersSlice"
import shopsReducer from "@/store/features/shops/shopsSlice"
import menuCategoriesReducer from "@/store/features/menuCategories/menuCategoriesSlice"

export const store = configureStore({
  reducer: {
    users: usersReducer,
    shops: shopsReducer,
    menuCategories: menuCategoriesReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

