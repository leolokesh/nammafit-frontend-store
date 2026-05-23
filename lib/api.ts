import api from "./axios";
import type {
  LoginResponse,
  User,
  Fabric,
  Fit,
  Product,
  Measurement,
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

  updateMe: (data: Partial<Pick<User, "company_name" | "website" | "phone_number">>) =>
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
};

// ─── Fits ─────────────────────────────────────────────────────────────────────
export const fitApi = {
  list: () => api.get<Fit[]>("/products/fits/"),

  create: (fit_name: string) =>
    api.post<Fit>("/products/fits/", { fit_name }),
};

// ─── Products ─────────────────────────────────────────────────────────────────
export const productApi = {
  list: () => api.get<Product[]>("/products/products/"),

  create: (data: Omit<Product, "id" | "fabric_name">) =>
    api.post<Product>("/products/products/", data),

  update: (id: number, data: Partial<Omit<Product, "id" | "fabric_name">>) =>
    api.patch<Product>(`/products/products/${id}/`, data),
};

// ─── Measurements ─────────────────────────────────────────────────────────────
export const measurementApi = {
  list: () => api.get<Measurement[]>("/products/measurements/"),

  create: (data: Measurement) =>
    api.post<Measurement>("/products/measurements/", data),

  update: (id: number, data: Partial<Measurement>) =>
    api.patch<Measurement>(`/products/measurements/${id}/`, data),
};
