import axios from "axios";
import { readAuthSession } from "@/lib/authSession";

const axiosClient = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;
  const url = String(config.url || "");
  if (!url.startsWith("/api/")) return config;
  const token = readAuthSession()?.idToken;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;

