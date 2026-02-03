/**
 * Supabase client configuration for SiteSpector
 * 
 * Two clients available:
 * - supabase: For client components (uses cookies)
 * - supabaseServer: For server components (if needed)
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

// Client for client components (recommended)
export const supabase = createClientComponentClient()

// Client for server components or standalone operations
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Type definitions for database tables
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      workspaces: {
        Row: {
          id: string
          name: string
          slug: string
          type: 'personal' | 'team'
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          type: 'personal' | 'team'
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          slug?: string
          updated_at?: string
        }
      }
      workspace_members: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          created_at?: string
        }
        Update: {
          role?: 'owner' | 'admin' | 'member'
        }
      }
      invites: {
        Row: {
          id: string
          workspace_id: string
          email: string
          role: 'admin' | 'member'
          invited_by: string
          token: string
          expires_at: string
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          email: string
          role: 'admin' | 'member'
          invited_by: string
          token: string
          expires_at: string
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          accepted_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          workspace_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          plan: 'free' | 'pro' | 'enterprise'
          status: 'active' | 'canceled' | 'past_due' | 'trialing'
          current_period_start: string | null
          current_period_end: string | null
          cancel_at: string | null
          audit_limit: number
          audits_used_this_month: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan?: 'free' | 'pro' | 'enterprise'
          status?: 'active' | 'canceled' | 'past_due' | 'trialing'
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at?: string | null
          audit_limit?: number
          audits_used_this_month?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan?: 'free' | 'pro' | 'enterprise'
          status?: 'active' | 'canceled' | 'past_due' | 'trialing'
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at?: string | null
          audit_limit?: number
          audits_used_this_month?: number
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          workspace_id: string
          stripe_invoice_id: string
          amount_paid: number
          currency: string
          status: string
          invoice_pdf: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          stripe_invoice_id: string
          amount_paid: number
          currency?: string
          status: string
          invoice_pdf?: string | null
          created_at?: string
        }
        Update: {
          status?: string
          invoice_pdf?: string | null
        }
      }
    }
  }
}
