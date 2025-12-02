/**
 * Database Types
 * 
 * TypeScript types matching the Supabase database schema
 * These types should match the tables defined in supabase/schema.sql
 */

export interface Database {
  public: {
    Tables: {
      blops: {
        Row: {
          id: string
          user_id: string
          workspace_id: string | null
          x: number
          y: number
          shape: 'circle' | 'square' | 'pill' | 'diamond'
          color: string
          content: string
          type: 'text' | 'link' | 'url' | 'file' | 'image' | 'embed'
          tags: string[] | null
          connections: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workspace_id?: string | null
          x: number
          y: number
          shape: 'circle' | 'square' | 'pill' | 'diamond'
          color: string
          content: string
          type: 'text' | 'link' | 'url' | 'file' | 'image' | 'embed'
          tags?: string[] | null
          connections?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workspace_id?: string | null
          x?: number
          y?: number
          shape?: 'circle' | 'square' | 'pill' | 'diamond'
          color?: string
          content?: string
          type?: 'text' | 'link' | 'url' | 'file' | 'image' | 'embed'
          tags?: string[] | null
          connections?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      websites: {
        Row: {
          id: string
          user_id: string
          workspace_id: string | null
          url: string
          name: string
          tech_stack: {
            frontend?: string
            backend?: string
            hosting?: string
            analytics?: string
            payments?: string
          }
          linked_blops: string[] | null
          subscription_ids: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workspace_id?: string | null
          url: string
          name: string
          tech_stack?: {
            frontend?: string
            backend?: string
            hosting?: string
            analytics?: string
            payments?: string
          }
          linked_blops?: string[] | null
          subscription_ids?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workspace_id?: string | null
          url?: string
          name?: string
          tech_stack?: {
            frontend?: string
            backend?: string
            hosting?: string
            analytics?: string
            payments?: string
          }
          linked_blops?: string[] | null
          subscription_ids?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          workspace_id: string | null
          name: string
          cost: number
          period: 'monthly' | 'annual'
          renewal_date: string
          category: string
          website_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workspace_id?: string | null
          name: string
          cost: number
          period: 'monthly' | 'annual'
          renewal_date: string
          category: string
          website_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workspace_id?: string | null
          name?: string
          cost?: number
          period?: 'monthly' | 'annual'
          renewal_date?: string
          category?: string
          website_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      properties: {
        Row: {
          id: string
          user_id: string
          workspace_id: string | null
          address: string
          type: string
          status: 'rented' | 'vacant' | 'under_maintenance' | 'sold'
          mortgage_holder: string | null
          purchase_price: number
          current_est_value: number
          monthly_mortgage_payment: number
          monthly_insurance: number
          monthly_property_tax: number
          monthly_other_costs: number
          monthly_gross_rent: number
          ownership: '100% ownership' | '50% partner' | '25% partner' | '75% partner' | '33% partner' | '67% partner' | null
          linked_websites: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workspace_id?: string | null
          address: string
          type: string
          status: 'rented' | 'vacant' | 'under_maintenance' | 'sold'
          mortgage_holder?: string | null
          purchase_price?: number
          current_est_value?: number
          monthly_mortgage_payment?: number
          monthly_insurance?: number
          monthly_property_tax?: number
          monthly_other_costs?: number
          monthly_gross_rent?: number
          ownership?: '100% ownership' | '50% partner' | '25% partner' | '75% partner' | '33% partner' | '67% partner' | null
          linked_websites?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workspace_id?: string | null
          address?: string
          type?: string
          status?: 'rented' | 'vacant' | 'under_maintenance' | 'sold'
          mortgage_holder?: string | null
          purchase_price?: number
          current_est_value?: number
          monthly_mortgage_payment?: number
          monthly_insurance?: number
          monthly_property_tax?: number
          monthly_other_costs?: number
          monthly_gross_rent?: number
          ownership?: '100% ownership' | '50% partner' | '25% partner' | '75% partner' | '33% partner' | '67% partner' | null
          linked_websites?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      rent_roll_units: {
        Row: {
          id: string
          property_id: string
          unit_name: string
          tenant_name: string
          monthly_rent: number
          lease_start: string
          lease_end: string
          security_deposit: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          unit_name: string
          tenant_name: string
          monthly_rent: number
          lease_start: string
          lease_end: string
          security_deposit?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          unit_name?: string
          tenant_name?: string
          monthly_rent?: number
          lease_start?: string
          lease_end?: string
          security_deposit?: number
          created_at?: string
          updated_at?: string
        }
      }
      work_requests: {
        Row: {
          id: string
          property_id: string
          date_logged: string
          description: string
          status: 'new' | 'in_progress' | 'completed'
          cost: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          date_logged?: string
          description: string
          status?: 'new' | 'in_progress' | 'completed'
          cost?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          date_logged?: string
          description?: string
          status?: 'new' | 'in_progress' | 'completed'
          cost?: number
          created_at?: string
          updated_at?: string
        }
      }
      agency_clients: {
        Row: {
          id: string
          user_id: string
          workspace_id: string | null
          name: string
          status: string
          contacts_count: number
          websites_count: number
          tasks_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workspace_id?: string | null
          name: string
          status?: string
          contacts_count?: number
          websites_count?: number
          tasks_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workspace_id?: string | null
          name?: string
          status?: string
          contacts_count?: number
          websites_count?: number
          tasks_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      ghl_clients: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          phone: string | null
          company: string | null
          subscription_plan: 'starter' | 'professional' | 'agency' | 'enterprise' | 'custom'
          status: 'active' | 'inactive' | 'cancelled'
          ghl_location_id: string | null
          ghl_api_key: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email: string
          phone?: string | null
          company?: string | null
          subscription_plan: 'starter' | 'professional' | 'agency' | 'enterprise' | 'custom'
          status?: 'active' | 'inactive' | 'cancelled'
          ghl_location_id?: string | null
          ghl_api_key?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string
          phone?: string | null
          company?: string | null
          subscription_plan?: 'starter' | 'professional' | 'agency' | 'enterprise' | 'custom'
          status?: 'active' | 'inactive' | 'cancelled'
          ghl_location_id?: string | null
          ghl_api_key?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ghl_weekly_metrics: {
        Row: {
          id: string
          client_id: string
          week_start: string
          week_end: string
          views: number
          leads: number
          conversions: number
          revenue: number | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          week_start: string
          week_end: string
          views?: number
          leads?: number
          conversions?: number
          revenue?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          week_start?: string
          week_end?: string
          views?: number
          leads?: number
          conversions?: number
          revenue?: number | null
          created_at?: string
        }
      }
    }
  }
}

// Helper types for easier access
export type BlopRow = Database['public']['Tables']['blops']['Row']
export type WebsiteRow = Database['public']['Tables']['websites']['Row']
export type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row']
export type PropertyRow = Database['public']['Tables']['properties']['Row']
export type RentRollUnitRow = Database['public']['Tables']['rent_roll_units']['Row']
export type WorkRequestRow = Database['public']['Tables']['work_requests']['Row']
export type AgencyClientRow = Database['public']['Tables']['agency_clients']['Row']
export type GHLClientRow = Database['public']['Tables']['ghl_clients']['Row']
export type GHLWeeklyMetricRow = Database['public']['Tables']['ghl_weekly_metrics']['Row']

