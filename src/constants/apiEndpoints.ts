export const API_ENDPOINTS = {
  users: {
    list: "/api/users",
    detail: (id: string | number) => `/api/users?id=${encodeURIComponent(String(id))}`,
  },
  shops: {
    list: "/api/shops",
    detail: (id: string | number) => `/api/shops?id=${encodeURIComponent(String(id))}`,
  },
  menuCategories: {
    list: "/api/menu-categories",
    bySlug: (slug: string) =>
      `/api/menu-categories?slug=${encodeURIComponent(slug)}`,
    byId: (id: string | number) =>
      `/api/menu-categories?id=${encodeURIComponent(String(id))}`,
  },
  appSettings: {
    list: "/api/app-settings",
    detail: (id: string | number) =>
      `/api/app-settings?id=${encodeURIComponent(String(id))}`,
  },
} as const
