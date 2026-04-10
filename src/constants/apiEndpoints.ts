const AUTH_BASE = "/api/v1/auth";

export const API_ENDPOINTS = {
  auth: {
    login: `${AUTH_BASE}/login`,
    profile: `${AUTH_BASE}/profile`,
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
  menuItems: {
    list: (params?: { page?: number; limit?: number; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.page != null) q.set("page", String(params.page));
      if (params?.limit != null) q.set("limit", String(params.limit));
      if (params?.search != null && params.search !== "")
        q.set("search", params.search);
      const s = q.toString();
      return s ? `/api/v1/menu-items?${s}` : "/api/v1/menu-items";
    },
    detail: (id: string | number) =>
      `/api/v1/menu-items?id=${encodeURIComponent(String(id))}`,
  },
  appSettings: {
    list: "/api/v1/app-setting",
    detail: (id: string | number) =>
      `/api/v1/app-setting?id=${encodeURIComponent(String(id))}`,
  },
} as const
