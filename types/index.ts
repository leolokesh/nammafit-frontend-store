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
export interface Fabric {
  id: number;
  name: string;
  color?: string;
  image_url?: string;
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
  price?: number;
  mrp?: number;
  description?: string;
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

// ─── Digital Ledger ────────────────────────────────────────────────────────────
export interface CustomerMeasurements {
  bust?: string | null;
  shoulder?: string | null;
  waist?: string | null;
  hip?: string | null;
  inseam?: string | null;
  thigh?: string | null;
  neck?: string | null;
  sleeve_length?: string | null;
  top_length?: string | null;
  bottom_length?: string | null;
}

export interface Customer {
  id?: number;
  name: string;
  phone: string;
  height?: number | null;
  weight?: number | null;
  notes?: string;
  measurements?: CustomerMeasurements | null;
  created_at?: string;
  updated_at?: string;
}

export type StitchingOrderStatus = "Pending" | "In Progress" | "Ready for Trial" | "Delivered";

export interface StitchingOrder {
  id?: number;
  customer: number; // ID of the customer
  customer_name?: string;
  customer_phone?: string;
  order_id?: string; // e.g. ORD-1001 (auto generated)
  garment_type: string;
  fabric_details?: string;
  advance_amount: string; // Decimals are serialized as strings in JSON response
  remaining_amount: string;
  delivery_date: string; // YYYY-MM-DD
  status: StitchingOrderStatus;
  created_at?: string;
  updated_at?: string;
}

