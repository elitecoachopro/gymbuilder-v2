export type UserRole = 'client' | 'supplier' | 'admin';
export type SupplierStatus = 'pending' | 'approved' | 'rejected';
export type SupplierPlan = 'free' | 'starter' | 'professional' | 'enterprise';
export type ProductCategory = 'cardio' | 'strength' | 'functional' | 'accessories' | 'wellness' | 'lockers' | 'reception';
export type ProductCondition = 'new' | 'used';
export type ProductStatus = 'active' | 'inactive' | 'featured';
export type BrandSegment = 'budget' | 'mid' | 'premium';
export type PromotionType = 'oferta_zilei' | 'anunturile_zilei';
export type PromotionStatus = 'active' | 'pending' | 'expired';
export type ConsultationStatus = 'new' | 'contacted' | 'completed';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  email_verified: boolean;
  verification_token: string | null;
  reset_token: string | null;
  reset_token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupplierProfile {
  id: string;
  user_id: string;
  company_name: string;
  country: string;
  city: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  phone: string | null;
  status: SupplierStatus;
  plan: SupplierPlan;
  plan_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  country: string | null;
  logo_url: string | null;
  segment: BrandSegment;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  supplier_id: string;
  name: string;
  description: string | null;
  category: ProductCategory;
  brand_id: string | null;
  condition: ProductCondition;
  price_eur: number;
  images: string[];
  specs: Record<string, string>;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
  // Joined fields
  brand?: Brand;
  supplier?: SupplierProfile;
}

export interface Promotion {
  id: string;
  supplier_id: string;
  product_id: string | null;
  title: string;
  description: string | null;
  type: PromotionType;
  price_eur: number;
  starts_at: string;
  ends_at: string;
  status: PromotionStatus;
  created_at: string;
  // Joined fields
  product?: Product;
  supplier?: SupplierProfile;
}

export interface ConsultationRequest {
  id: string;
  client_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  business_stage: string | null;
  message: string | null;
  status: ConsultationStatus;
  created_at: string;
  updated_at: string;
}
