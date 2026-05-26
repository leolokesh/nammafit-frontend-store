// ─── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  username: string;
  email: string;
  company_name: string;
  website: string;
  store_id: string;
  phone_number: string;
  recommendations_count?: number;
  last_recommendation_at?: string | null;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

// ─── Fabric ───────────────────────────────────────────────────────────────────
export type StretchType = "Non-Stretch" | "Low" | "Medium" | "High";
export type StructureType = "Structured" | "Flowy" | "Knit" | "Rigid";
export type WeightCategory = "Light" | "Medium" | "Heavy";

export interface Fabric {
  id: number;
  name: string;
  stretch_type: StretchType;
  structure_type: StructureType;
  weight_category: WeightCategory;
}

export type WearCategory = "TOPWEAR" | "BOTTOMWEAR" | "FULL_BODY";

// ─── SizeChart ────────────────────────────────────────────────────────────────
export interface SizeChart {
  id: number;
  name: string;
  fit: string;
  wear_category: WearCategory;
  created_at?: string;
  updated_at?: string;
}

// ─── Product ──────────────────────────────────────────────────────────────────

export interface ProductImage {
  id?: number;
  image_url: string;
}

export interface Product {
  id: number;
  name: string;
  wear_category: WearCategory;
  fabric: number;
  fabric_name?: string;
  size_chart?: number | null;
  images: ProductImage[];
}

// ─── Measurement ──────────────────────────────────────────────────────────────
export type SizeLabel = "XS" | "S" | "M" | "L" | "XL";

export interface Measurement {
  id?: number;
  size_chart: number;
  size_label: SizeLabel;
  bust?: number | null;
  shoulder?: number | null;
  waist?: number | null;
  hip?: number | null;
  inseam?: number | null;
  thighs?: number | null;
}
