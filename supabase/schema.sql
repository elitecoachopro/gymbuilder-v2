-- GymBuilder Database Schema
-- Run this in Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUM Types
CREATE TYPE user_role AS ENUM ('client', 'supplier', 'admin');
CREATE TYPE supplier_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE supplier_plan AS ENUM ('free', 'starter', 'professional', 'enterprise');
CREATE TYPE product_category AS ENUM ('cardio', 'strength', 'functional', 'accessories', 'wellness', 'lockers', 'reception');
CREATE TYPE product_condition AS ENUM ('new', 'used');
CREATE TYPE product_status AS ENUM ('active', 'inactive', 'featured');
CREATE TYPE brand_segment AS ENUM ('budget', 'mid', 'premium');
CREATE TYPE promotion_type AS ENUM ('oferta_zilei', 'anunturile_zilei');
CREATE TYPE promotion_status AS ENUM ('active', 'pending', 'expired');
CREATE TYPE consultation_status AS ENUM ('new', 'contacted', 'completed');

-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'client',
  avatar_url TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  reset_token TEXT,
  reset_token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplier Profiles Table
CREATE TABLE supplier_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  phone TEXT,
  status supplier_status NOT NULL DEFAULT 'pending',
  plan supplier_plan NOT NULL DEFAULT 'free',
  plan_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brands Table
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  country TEXT,
  logo_url TEXT,
  segment brand_segment NOT NULL DEFAULT 'mid',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories Table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES supplier_profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category product_category NOT NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  condition product_condition NOT NULL DEFAULT 'new',
  price_eur DECIMAL(10,2) NOT NULL,
  images JSONB DEFAULT '[]'::jsonb,
  specs JSONB DEFAULT '{}'::jsonb,
  status product_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promotions Table
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES supplier_profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type promotion_type NOT NULL,
  price_eur DECIMAL(10,2) NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status promotion_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consultation Requests Table
CREATE TABLE consultation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  business_stage TEXT,
  message TEXT,
  status consultation_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews Table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES supplier_profiles(id) ON DELETE CASCADE NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  body TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact Requests (Cereri de Ofertă) Table
CREATE TYPE contact_request_status AS ENUM ('sent', 'replied', 'completed');
CREATE TABLE contact_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES users(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  supplier_id UUID REFERENCES supplier_profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  message TEXT,
  status contact_request_status NOT NULL DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favorites Table
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Indexes
CREATE INDEX idx_contact_requests_client ON contact_requests(client_id);
CREATE INDEX idx_contact_requests_supplier ON contact_requests(supplier_id);
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_product ON favorites(product_id);
CREATE INDEX idx_reviews_supplier ON reviews(supplier_id);
CREATE INDEX idx_reviews_verified ON reviews(verified);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_supplier_profiles_status ON supplier_profiles(status);
CREATE INDEX idx_supplier_profiles_plan ON supplier_profiles(plan);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_promotions_type ON promotions(type);
CREATE INDEX idx_promotions_status ON promotions(status);
CREATE INDEX idx_promotions_dates ON promotions(starts_at, ends_at);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: users can read their own data, admins can read all
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Supplier Profiles: public read for approved, owners can edit
CREATE POLICY "Public can view approved suppliers" ON supplier_profiles FOR SELECT USING (status = 'approved');
CREATE POLICY "Owners can view own profile" ON supplier_profiles FOR SELECT USING (user_id::text = auth.uid()::text);
CREATE POLICY "Owners can update own profile" ON supplier_profiles FOR UPDATE USING (user_id::text = auth.uid()::text);
CREATE POLICY "Authenticated can insert supplier profile" ON supplier_profiles FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

-- Brands: public read
CREATE POLICY "Public can view brands" ON brands FOR SELECT USING (true);

-- Categories: public read
CREATE POLICY "Public can view categories" ON categories FOR SELECT USING (true);

-- Products: public read for active, suppliers can manage own
CREATE POLICY "Public can view active products" ON products FOR SELECT USING (status IN ('active', 'featured'));
CREATE POLICY "Suppliers can manage own products" ON products FOR ALL USING (
  supplier_id IN (SELECT id FROM supplier_profiles WHERE user_id::text = auth.uid()::text)
);

-- Promotions: public read for active
CREATE POLICY "Public can view active promotions" ON promotions FOR SELECT USING (status = 'active');
CREATE POLICY "Suppliers can manage own promotions" ON promotions FOR ALL USING (
  supplier_id IN (SELECT id FROM supplier_profiles WHERE user_id::text = auth.uid()::text)
);

-- Consultation Requests: authenticated can insert
CREATE POLICY "Anyone can create consultation request" ON consultation_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all consultations" ON consultation_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);

-- Seed Categories
INSERT INTO categories (name, slug, icon) VALUES
  ('Cardio', 'cardio', 'heart-pulse'),
  ('Strength', 'strength', 'dumbbell'),
  ('Functional', 'functional', 'activity'),
  ('Accessories', 'accessories', 'wrench'),
  ('Wellness', 'wellness', 'sparkles'),
  ('Lockers', 'lockers', 'lock'),
  ('Reception', 'reception', 'door-open');

-- Seed Brands
INSERT INTO brands (name, country, segment) VALUES
  ('Life Fitness', 'USA', 'premium'),
  ('Technogym', 'Italy', 'premium'),
  ('Precor', 'USA', 'premium'),
  ('Matrix', 'USA', 'premium'),
  ('Hammer Strength', 'USA', 'premium'),
  ('Cybex', 'USA', 'premium'),
  ('Star Trac', 'USA', 'mid'),
  ('Body-Solid', 'USA', 'mid'),
  ('Impulse', 'China', 'mid'),
  ('BH Fitness', 'Spain', 'mid'),
  ('Nautilus', 'USA', 'mid'),
  ('Hoist', 'USA', 'mid'),
  ('SportsArt', 'Taiwan', 'mid'),
  ('DHZ Fitness', 'China', 'budget'),
  ('Shua', 'China', 'budget'),
  ('Realleader', 'China', 'budget');
