import api from "./axios";
import type {
  LoginResponse,
  User,
  Fabric,
  SizeChart,
  Product,
  Measurement,
  WearCategory,
} from "@/types";

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) =>
    api.post<LoginResponse>("/token/", { username, password }),

  refreshToken: (refresh: string) =>
    api.post<{ access: string }>("/token/refresh/", { refresh }),
};

// ─── Users ───────────────────────────────────────────────────────────────────
export const userApi = {
  getMe: () => api.get<User>("/users/me/"),

  updateMe: (data: Partial<Pick<User, "email" | "company_name" | "website" | "phone_number">>) =>
    api.patch<User>("/users/me/", data),

  changePassword: (payload: {
    old_password: string;
    new_password: string;
    new_password_confirm: string;
  }) => api.post("/users/change-password/", payload),
};

// ─── Fabrics ──────────────────────────────────────────────────────────────────
export const fabricApi = {
  list: () => api.get<Fabric[]>("/products/fabrics/"),

  create: (data: Omit<Fabric, "id">) =>
    api.post<Fabric>("/products/fabrics/", data),

  update: (id: number, data: Partial<Omit<Fabric, "id">>) =>
    api.patch<Fabric>(`/products/fabrics/${id}/`, data),

  delete: (id: number) =>
    api.delete(`/products/fabrics/${id}/`),
};

// ─── SizeCharts ───────────────────────────────────────────────────────────────
export const sizeChartApi = {
  list: () => api.get<SizeChart[]>("/products/size-charts/"),

  create: (data: { name: string; fit: string; wear_category: WearCategory }) =>
    api.post<SizeChart>("/products/size-charts/", data),

  update: (id: number, data: Partial<SizeChart>) =>
    api.patch<SizeChart>(`/products/size-charts/${id}/`, data),

  delete: (id: number) =>
    api.delete(`/products/size-charts/${id}/`),
};

// ─── Products ─────────────────────────────────────────────────────────────────
export const productApi = {
  list: () => api.get<Product[]>("/products/products/"),

  create: (data: Omit<Product, "id" | "fabric_name">) =>
    api.post<Product>("/products/products/", data),

  update: (id: number, data: Partial<Omit<Product, "id" | "fabric_name">>) =>
    api.patch<Product>(`/products/products/${id}/`, data),

  delete: (id: number) =>
    api.delete(`/products/products/${id}/`),
};

// ─── Measurements ─────────────────────────────────────────────────────────────
export const measurementApi = {
  list: () => api.get<Measurement[]>("/products/measurements/"),

  create: (data: Measurement) =>
    api.post<Measurement>("/products/measurements/", data),

  update: (id: number, data: Partial<Measurement>) =>
    api.patch<Measurement>(`/products/measurements/${id}/`, data),

  delete: (id: number) =>
    api.delete(`/products/measurements/${id}/`),
};

// ─── Public API ──────────────────────────────────────────────────────────────
export const publicApi = {
  getUserProfile: (userId: number) =>
    api.get<User>(`/users/public/${userId}/`),

  getUserProducts: (userId: number) =>
    api.get<Product[]>(`/products/public/user/${userId}/`),

  recommendSize: (payload: {
    product_id: number;
    customer_id: number;
    height: number;
    weight: number;
    age: number;
    shape: string;
    usual_size: string;
    fit_pref: string;
    fit_issues: string[];
    measurements: Record<string, number | null> | null;
  }) =>
    api.post<any>("/products/findRightFit/", payload),
};
