export const API_ENDPOINTS = {
  users: {
    list: "/api/v1/user",
    detail: (id: string | number) => `/api/v1/user?id=${encodeURIComponent(String(id))}`,
  },
  shops: {
    list: "/api/v1/shop",
    detail: (id: string | number) => `/api/v1/shop?id=${encodeURIComponent(String(id))}`,
  },
  menuCategories: {
    list: "/api/v1/menu-category",
    bySlug: (slug: string) =>
      `/api/v1/menu-category?slug=${encodeURIComponent(slug)}`,
    byId: (id: string | number) =>
      `/api/v1/menu-category?id=${encodeURIComponent(String(id))}`,
  },
  appSettings: {
    list: "/api/v1/app-setting",
    detail: (id: string | number) =>
      `/api/v1/app-setting?id=${encodeURIComponent(String(id))}`,
  },
} as const
