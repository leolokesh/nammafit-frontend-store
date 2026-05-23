// ─── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  username: string;
  email: string;
  company_name: string;
  website: string;
  reference_id: string;
  phone_number: string;
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

// ─── Fit ──────────────────────────────────────────────────────────────────────
export interface Fit {
  id: number;
  fit_name: string;
}

// ─── Product ──────────────────────────────────────────────────────────────────
export type WearCategory = "TOPWEAR" | "BOTTOMWEAR" | "FULLBODY";

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
  images: ProductImage[];
}

// ─── Measurement ──────────────────────────────────────────────────────────────
export type SizeLabel = "XS" | "S" | "M" | "L" | "XL";

export interface Measurement {
  id?: number;
  product: number;
  fit: number;
  size_label: SizeLabel;
  bust?: number | null;
  shoulder?: number | null;
  waist?: number | null;
  hip?: number | null;
  inseam?: number | null;
  thighs?: number | null;
}
