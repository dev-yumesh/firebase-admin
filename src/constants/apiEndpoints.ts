const AUTH_BASE = "/api/v1/auth";

export const API_ENDPOINTS = {
  auth: {
    login: `${AUTH_BASE}/login`,
  },
  users: {
    list: AUTH_BASE,
    detail: (id: string | number) =>
      `${AUTH_BASE}?id=${encodeURIComponent(String(id))}`,
    shopOwnerRegister: `${AUTH_BASE}/register`,
  },
  shops: {
    list: "/api/v1/shop",
    detail: (id: string | number) => `/api/v1/shop?id=${encodeURIComponent(String(id))}`,
  },
  menuCategories: {
    list: "/api/v1/menu-categories",
    bySlug: (slug: string) =>
      `/api/v1/menu-categories?slug=${encodeURIComponent(slug)}`,
    byId: (id: string | number) =>
      `/api/v1/menu-categories?id=${encodeURIComponent(String(id))}`,
  },
  appSettings: {
    list: "/api/v1/app-setting",
    detail: (id: string | number) =>
      `/api/v1/app-setting?id=${encodeURIComponent(String(id))}`,
  },
} as const
