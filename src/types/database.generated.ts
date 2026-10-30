export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      account_deletion_requests: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          status: string
          user_email: string
          user_id: string | null
          user_role: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          status?: string
          user_email: string
          user_id?: string | null
          user_role: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          status?: string
          user_email?: string
          user_id?: string | null
          user_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_deletion_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_logs: {
        Row: {
          created_at: string | null
          email_attempted: string
          event_type: string
          id: string
          ip_address: string
          reason: string | null
        }
        Insert: {
          created_at?: string | null
          email_attempted: string
          event_type?: string
          id?: string
          ip_address: string
          reason?: string | null
        }
        Update: {
          created_at?: string | null
          email_attempted?: string
          event_type?: string
          id?: string
          ip_address?: string
          reason?: string | null
        }
        Relationships: []
      }
      brands: {
        Row: {
          country: string | null
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          segment: Database["public"]["Enums"]["brand_segment"]
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          segment?: Database["public"]["Enums"]["brand_segment"]
        }
        Update: {
          country?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          segment?: Database["public"]["Enums"]["brand_segment"]
        }
        Relationships: []
      }
      budget_estimates: {
        Row: {
          area_sqm: number
          breakdown: Json
          created_at: string
          gym_type: string
          id: string
          selected_zones: Json
          total_max: number
          total_min: number
          user_id: string
        }
        Insert: {
          area_sqm: number
          breakdown: Json
          created_at?: string
          gym_type: string
          id?: string
          selected_zones: Json
          total_max: number
          total_min: number
          user_id: string
        }
        Update: {
          area_sqm?: number
          breakdown?: Json
          created_at?: string
          gym_type?: string
          id?: string
          selected_zones?: Json
          total_max?: number
          total_min?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_estimates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      consultation_requests: {
        Row: {
          business_stage: string | null
          client_id: string | null
          created_at: string | null
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["consultation_status"]
          updated_at: string | null
        }
        Insert: {
          business_stage?: string | null
          client_id?: string | null
          created_at?: string | null
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["consultation_status"]
          updated_at?: string | null
        }
        Update: {
          business_stage?: string | null
          client_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["consultation_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultation_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          admin_reply: string | null
          created_at: string | null
          email: string
          id: string
          idempotency_key: string | null
          message: string
          name: string
          replied_at: string | null
          status: string
          subject: string
        }
        Insert: {
          admin_reply?: string | null
          created_at?: string | null
          email: string
          id?: string
          idempotency_key?: string | null
          message: string
          name: string
          replied_at?: string | null
          status?: string
          subject: string
        }
        Update: {
          admin_reply?: string | null
          created_at?: string | null
          email?: string
          id?: string
          idempotency_key?: string | null
          message?: string
          name?: string
          replied_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      contact_requests: {
        Row: {
          client_email: string
          client_id: string | null
          client_name: string
          client_phone: string | null
          created_at: string | null
          id: string
          idempotency_key: string | null
          message: string | null
          product_id: string | null
          status: Database["public"]["Enums"]["contact_request_status"]
          supplier_id: string
          updated_at: string | null
          viewed_at: string | null
        }
        Insert: {
          client_email: string
          client_id?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string | null
          id?: string
          idempotency_key?: string | null
          message?: string | null
          product_id?: string | null
          status?: Database["public"]["Enums"]["contact_request_status"]
          supplier_id: string
          updated_at?: string | null
          viewed_at?: string | null
        }
        Update: {
          client_email?: string
          client_id?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string | null
          id?: string
          idempotency_key?: string | null
          message?: string | null
          product_id?: string | null
          status?: Database["public"]["Enums"]["contact_request_status"]
          supplier_id?: string
          updated_at?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_requests_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "public_supplier_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_requests_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_projects: {
        Row: {
          client_id: string
          configuration: Json | null
          created_at: string | null
          id: string
          length_m: number
          name: string
          status: string
          total_area: number
          updated_at: string | null
          variant: string
          width_m: number
          zones: Json
        }
        Insert: {
          client_id: string
          configuration?: Json | null
          created_at?: string | null
          id?: string
          length_m: number
          name?: string
          status?: string
          total_area: number
          updated_at?: string | null
          variant: string
          width_m: number
          zones?: Json
        }
        Update: {
          client_id?: string
          configuration?: Json | null
          created_at?: string | null
          id?: string
          length_m?: number
          name?: string
          status?: string
          total_area?: number
          updated_at?: string | null
          variant?: string
          width_m?: number
          zones?: Json
        }
        Relationships: [
          {
            foreignKeyName: "gym_projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          request_id: string
          sender_email: string
          sender_name: string
          sender_type: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          request_id: string
          sender_email: string
          sender_name: string
          sender_type: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          request_id?: string
          sender_email?: string
          sender_name?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "contact_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          status: string
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          status?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          status?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string
          description_override: string | null
          id: string
          image_url: string | null
          label: string
          price_override: number | null
          product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description_override?: string | null
          id?: string
          image_url?: string | null
          label: string
          price_override?: number | null
          product_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description_override?: string | null
          id?: string
          image_url?: string | null
          label?: string
          price_override?: number | null
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_views: {
        Row: {
          id: string
          product_id: string
          session_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          product_id: string
          session_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          session_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_views_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_views_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand_id: string | null
          category: Database["public"]["Enums"]["product_category"]
          condition: Database["public"]["Enums"]["product_condition"]
          created_at: string | null
          description: string | null
          id: string
          images: Json | null
          images_360: Json | null
          listed_price_amount: number | null
          listed_price_currency: string | null
          name: string
          price_eur: number | null
          source_url: string | null
          specs: Json | null
          status: Database["public"]["Enums"]["product_status"]
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          brand_id?: string | null
          category: Database["public"]["Enums"]["product_category"]
          condition?: Database["public"]["Enums"]["product_condition"]
          created_at?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          images_360?: Json | null
          listed_price_amount?: number | null
          listed_price_currency?: string | null
          name: string
          price_eur?: number | null
          source_url?: string | null
          specs?: Json | null
          status?: Database["public"]["Enums"]["product_status"]
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          brand_id?: string | null
          category?: Database["public"]["Enums"]["product_category"]
          condition?: Database["public"]["Enums"]["product_condition"]
          created_at?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          images_360?: Json | null
          listed_price_amount?: number | null
          listed_price_currency?: string | null
          name?: string
          price_eur?: number | null
          source_url?: string | null
          specs?: Json | null
          status?: Database["public"]["Enums"]["product_status"]
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "public_supplier_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          created_at: string | null
          description: string | null
          ends_at: string
          id: string
          image_url: string | null
          price_eur: number | null
          product_id: string | null
          starts_at: string
          status: Database["public"]["Enums"]["promotion_status"]
          supplier_id: string
          title: string
          type: Database["public"]["Enums"]["promotion_type"]
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          ends_at: string
          id?: string
          image_url?: string | null
          price_eur?: number | null
          product_id?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["promotion_status"]
          supplier_id: string
          title: string
          type: Database["public"]["Enums"]["promotion_type"]
        }
        Update: {
          created_at?: string | null
          description?: string | null
          ends_at?: string
          id?: string
          image_url?: string | null
          price_eur?: number | null
          product_id?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["promotion_status"]
          supplier_id?: string
          title?: string
          type?: Database["public"]["Enums"]["promotion_type"]
        }
        Relationships: [
          {
            foreignKeyName: "promotions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "public_supplier_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_upload_sessions: {
        Row: {
          claimed_by: string | null
          created_at: string
          expires_at: string
          id: string
          ip_hash: string
          token_hash: string
          upload_count: number
        }
        Insert: {
          claimed_by?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          ip_hash: string
          token_hash: string
          upload_count?: number
        }
        Update: {
          claimed_by?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          ip_hash?: string
          token_hash?: string
          upload_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "registration_upload_sessions_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      request_rate_limits: {
        Row: {
          key_hash: string
          request_count: number
          resets_at: string
        }
        Insert: {
          key_hash: string
          request_count?: number
          resets_at: string
        }
        Update: {
          key_hash?: string
          request_count?: number
          resets_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          body: string | null
          client_email: string
          client_name: string
          created_at: string | null
          id: string
          rating: number
          supplier_id: string
          title: string
          verified: boolean
        }
        Insert: {
          body?: string | null
          client_email: string
          client_name: string
          created_at?: string | null
          id?: string
          rating: number
          supplier_id: string
          title: string
          verified?: boolean
        }
        Update: {
          body?: string | null
          client_email?: string
          client_name?: string
          created_at?: string | null
          id?: string
          rating?: number
          supplier_id?: string
          title?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reviews_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "public_supplier_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_gallery: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          supplier_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          supplier_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_gallery_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "public_supplier_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_gallery_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_profiles: {
        Row: {
          catalog_url: string | null
          city: string
          company_name: string
          contact_email: string | null
          country: string
          created_at: string | null
          description: string | null
          id: string
          listing_checked_at: string | null
          listing_source_url: string | null
          logo_url: string | null
          phone: string | null
          plan: Database["public"]["Enums"]["supplier_plan"]
          plan_expires_at: string | null
          requested_plan: Database["public"]["Enums"]["supplier_plan"] | null
          status: Database["public"]["Enums"]["supplier_status"]
          updated_at: string | null
          user_id: string | null
          verification_photos: Json
          verified: boolean
          website: string | null
        }
        Insert: {
          catalog_url?: string | null
          city: string
          company_name: string
          contact_email?: string | null
          country: string
          created_at?: string | null
          description?: string | null
          id?: string
          listing_checked_at?: string | null
          listing_source_url?: string | null
          logo_url?: string | null
          phone?: string | null
          plan?: Database["public"]["Enums"]["supplier_plan"]
          plan_expires_at?: string | null
          requested_plan?: Database["public"]["Enums"]["supplier_plan"] | null
          status?: Database["public"]["Enums"]["supplier_status"]
          updated_at?: string | null
          user_id?: string | null
          verification_photos?: Json
          verified?: boolean
          website?: string | null
        }
        Update: {
          catalog_url?: string | null
          city?: string
          company_name?: string
          contact_email?: string | null
          country?: string
          created_at?: string | null
          description?: string | null
          id?: string
          listing_checked_at?: string | null
          listing_source_url?: string | null
          logo_url?: string | null
          phone?: string | null
          plan?: Database["public"]["Enums"]["supplier_plan"]
          plan_expires_at?: string | null
          requested_plan?: Database["public"]["Enums"]["supplier_plan"] | null
          status?: Database["public"]["Enums"]["supplier_status"]
          updated_at?: string | null
          user_id?: string | null
          verification_photos?: Json
          verified?: boolean
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          email_verified: boolean | null
          full_name: string
          id: string
          password_hash: string
          reset_token: string | null
          reset_token_expires_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          session_version: number
          updated_at: string | null
          verification_token: string | null
          verification_token_expires_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          email_verified?: boolean | null
          full_name: string
          id?: string
          password_hash: string
          reset_token?: string | null
          reset_token_expires_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          session_version?: number
          updated_at?: string | null
          verification_token?: string | null
          verification_token_expires_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          email_verified?: boolean | null
          full_name?: string
          id?: string
          password_hash?: string
          reset_token?: string | null
          reset_token_expires_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          session_version?: number
          updated_at?: string | null
          verification_token?: string | null
          verification_token_expires_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      public_catalog_products: {
        Row: {
          brand_country: string | null
          brand_id: string | null
          brand_name: string | null
          category: Database["public"]["Enums"]["product_category"] | null
          condition: Database["public"]["Enums"]["product_condition"] | null
          created_at: string | null
          description: string | null
          id: string | null
          images: Json | null
          images_360: Json | null
          listed_price_amount: number | null
          listed_price_currency: string | null
          market: string | null
          name: string | null
          price_eur: number | null
          source_url: string | null
          specs: Json | null
          status: Database["public"]["Enums"]["product_status"] | null
          supplier_country: string | null
          supplier_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "public_supplier_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      public_promotions: {
        Row: {
          created_at: string | null
          description: string | null
          ends_at: string | null
          id: string | null
          image_url: string | null
          price_eur: number | null
          product_id: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["promotion_status"] | null
          supplier_id: string | null
          title: string | null
          type: Database["public"]["Enums"]["promotion_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "promotions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "public_supplier_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      public_supplier_directory: {
        Row: {
          catalog_url: string | null
          city: string | null
          company_name: string | null
          contact_email: string | null
          country: string | null
          created_at: string | null
          description: string | null
          id: string | null
          listing_checked_at: string | null
          listing_source_url: string | null
          logo_url: string | null
          market: string | null
          phone: string | null
          plan: Database["public"]["Enums"]["supplier_plan"] | null
          status: Database["public"]["Enums"]["supplier_status"] | null
          verified: boolean | null
          website: string | null
        }
        Insert: {
          catalog_url?: string | null
          city?: string | null
          company_name?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          listing_checked_at?: string | null
          listing_source_url?: string | null
          logo_url?: string | null
          market?: never
          phone?: string | null
          plan?: Database["public"]["Enums"]["supplier_plan"] | null
          status?: Database["public"]["Enums"]["supplier_status"] | null
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          catalog_url?: string | null
          city?: string | null
          company_name?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          listing_checked_at?: string | null
          listing_source_url?: string | null
          logo_url?: string | null
          market?: never
          phone?: string | null
          plan?: Database["public"]["Enums"]["supplier_plan"] | null
          status?: Database["public"]["Enums"]["supplier_status"] | null
          verified?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      catalog_market: { Args: { country: string }; Returns: string }
      consume_request_quota: {
        Args: { p_key_hash: string; p_limit: number; p_window_ms: number }
        Returns: Json
      }
      issue_registration_upload: {
        Args: { p_ip_hash: string; p_token_hash: string }
        Returns: string
      }
      public_marketplace_stats: { Args: never; Returns: Json }
      release_registration_upload: {
        Args: { p_session_id: string }
        Returns: undefined
      }
      reserve_registration_upload: {
        Args: { p_token_hash: string }
        Returns: string
      }
      send_request_message: {
        Args: { p_content: string; p_request_id: string; p_user_id: string }
        Returns: {
          content: string
          created_at: string
          id: string
          request_id: string
          sender_email: string
          sender_name: string
          sender_type: string
        }[]
        SetofOptions: {
          from: "*"
          to: "messages"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      supplier_product_analytics: {
        Args: { p_supplier_id: string }
        Returns: Json
      }
      supplier_product_counts: {
        Args: { p_supplier_ids: string[] }
        Returns: {
          product_count: number
          supplier_id: string
        }[]
      }
      supplier_review_stats: { Args: { p_supplier_id: string }; Returns: Json }
    }
    Enums: {
      brand_segment: "budget" | "mid" | "premium"
      consultation_status: "new" | "contacted" | "completed"
      contact_request_status: "sent" | "replied" | "completed" | "viewed"
      product_category:
        | "cardio"
        | "strength"
        | "functional"
        | "accessories"
        | "wellness"
        | "lockers"
        | "reception"
      product_condition: "new" | "used"
      product_status: "active" | "inactive" | "featured"
      promotion_status: "active" | "pending" | "expired"
      promotion_type: "oferta_zilei" | "anunturile_zilei" | "super_pret"
      supplier_plan: "free" | "starter" | "professional" | "enterprise"
      supplier_status: "pending" | "approved" | "rejected"
      user_role: "client" | "supplier" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      brand_segment: ["budget", "mid", "premium"],
      consultation_status: ["new", "contacted", "completed"],
      contact_request_status: ["sent", "replied", "completed", "viewed"],
      product_category: [
        "cardio",
        "strength",
        "functional",
        "accessories",
        "wellness",
        "lockers",
        "reception",
      ],
      product_condition: ["new", "used"],
      product_status: ["active", "inactive", "featured"],
      promotion_status: ["active", "pending", "expired"],
      promotion_type: ["oferta_zilei", "anunturile_zilei", "super_pret"],
      supplier_plan: ["free", "starter", "professional", "enterprise"],
      supplier_status: ["pending", "approved", "rejected"],
      user_role: ["client", "supplier", "admin"],
    },
  },
} as const

