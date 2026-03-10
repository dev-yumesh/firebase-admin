export const API_ENDPOINTS = {
  users: {
    list: "/api/v1/users",
    detail: (id: string | number) => `/api/v1/users?id=${encodeURIComponent(String(id))}`,
  },
  shops: {
    list: "/api/v1/shops",
    detail: (id: string | number) => `/api/v1/shops?id=${encodeURIComponent(String(id))}`,
  },
  menuCategories: {
    list: "/api/v1/menu-categories",
    bySlug: (slug: string) =>
      `/api/v1/menu-categories?slug=${encodeURIComponent(slug)}`,
    byId: (id: string | number) =>
      `/api/v1/menu-categories?id=${encodeURIComponent(String(id))}`,
  },
  appSettings: {
    list: "/api/v1/app-settings",
    detail: (id: string | number) =>
      `/api/v1/app-settings?id=${encodeURIComponent(String(id))}`,
  },
} as const
