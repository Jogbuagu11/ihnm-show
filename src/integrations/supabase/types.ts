export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      budgets: {
        Row: {
          category: string
          monthly_cents: number
        }
        Insert: {
          category: string
          monthly_cents?: number
        }
        Update: {
          category?: string
          monthly_cents?: number
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          goal_cents: number
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          goal_cents?: number
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          goal_cents?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          organization: string | null
          phone: string | null
          status: string
          topic: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          organization?: string | null
          phone?: string | null
          status?: string
          topic: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          organization?: string | null
          phone?: string | null
          status?: string
          topic?: string
        }
        Relationships: []
      }
      episodes: {
        Row: {
          aired_on: string
          chat_url: string | null
          created_at: string
          description: string | null
          guests: string[]
          id: string
          kind: Database["public"]["Enums"]["episode_type"]
          live_at: string | null
          slug: string
          sponsor_logo_url: string | null
          sponsor_name: string | null
          sponsor_url: string | null
          tags: string[]
          thumbnail: string | null
          title: string
          youtube_url: string | null
        }
        Insert: {
          aired_on?: string
          chat_url?: string | null
          created_at?: string
          description?: string | null
          guests?: string[]
          id?: string
          kind?: Database["public"]["Enums"]["episode_type"]
          live_at?: string | null
          slug: string
          sponsor_logo_url?: string | null
          sponsor_name?: string | null
          sponsor_url?: string | null
          tags?: string[]
          thumbnail?: string | null
          title: string
          youtube_url?: string | null
        }
        Update: {
          aired_on?: string
          chat_url?: string | null
          created_at?: string
          description?: string | null
          guests?: string[]
          id?: string
          kind?: Database["public"]["Enums"]["episode_type"]
          live_at?: string | null
          slug?: string
          sponsor_logo_url?: string | null
          sponsor_name?: string | null
          sponsor_url?: string | null
          tags?: string[]
          thumbnail?: string | null
          title?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount_cents: number
          category: string
          created_at: string
          id: string
          memo: string | null
          receipt_path: string | null
          spent_on: string
          vendor: string | null
        }
        Insert: {
          amount_cents: number
          category: string
          created_at?: string
          id?: string
          memo?: string | null
          receipt_path?: string | null
          spent_on?: string
          vendor?: string | null
        }
        Update: {
          amount_cents?: number
          category?: string
          created_at?: string
          id?: string
          memo?: string | null
          receipt_path?: string | null
          spent_on?: string
          vendor?: string | null
        }
        Relationships: []
      }
      expert_bookings: {
        Row: {
          briefing: string | null
          briefing_sent_at: string | null
          clip_1: string | null
          clip_2: string | null
          clip_3: string | null
          clip_4: string | null
          clip_5: string | null
          clips_sent_at: string | null
          created_at: string
          expert_id: string
          id: string
          posted: boolean
          status: string
          taping_id: string
        }
        Insert: {
          briefing?: string | null
          briefing_sent_at?: string | null
          clip_1?: string | null
          clip_2?: string | null
          clip_3?: string | null
          clip_4?: string | null
          clip_5?: string | null
          clips_sent_at?: string | null
          created_at?: string
          expert_id: string
          id?: string
          posted?: boolean
          status?: string
          taping_id: string
        }
        Update: {
          briefing?: string | null
          briefing_sent_at?: string | null
          clip_1?: string | null
          clip_2?: string | null
          clip_3?: string | null
          clip_4?: string | null
          clip_5?: string | null
          clips_sent_at?: string | null
          created_at?: string
          expert_id?: string
          id?: string
          posted?: boolean
          status?: string
          taping_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_bookings_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "experts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expert_bookings_taping_id_fkey"
            columns: ["taping_id"]
            isOneToOne: false
            referencedRelation: "tapings"
            referencedColumns: ["id"]
          },
        ]
      }
      experts: {
        Row: {
          created_at: string
          email: string | null
          field: string | null
          id: string
          name: string
          notes: string | null
          past_appearances: string | null
          phone: string | null
          topics: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          field?: string | null
          id?: string
          name: string
          notes?: string | null
          past_appearances?: string | null
          phone?: string | null
          topics?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          field?: string | null
          id?: string
          name?: string
          notes?: string | null
          past_appearances?: string | null
          phone?: string | null
          topics?: string | null
        }
        Relationships: []
      }
      finance_settings: {
        Row: {
          fundraising_goal_cents: number
          id: number
          monthly_operating_cents: number
        }
        Insert: {
          fundraising_goal_cents?: number
          id?: number
          monthly_operating_cents?: number
        }
        Update: {
          fundraising_goal_cents?: number
          id?: number
          monthly_operating_cents?: number
        }
        Relationships: []
      }
      group_requests: {
        Row: {
          church_name: string
          contact_name: string
          created_at: string
          email: string
          id: string
          notes: string | null
          phone: string | null
          seats: number
          status: string
          taping_id: string
          user_id: string
        }
        Insert: {
          church_name: string
          contact_name: string
          created_at?: string
          email: string
          id?: string
          notes?: string | null
          phone?: string | null
          seats: number
          status?: string
          taping_id: string
          user_id: string
        }
        Update: {
          church_name?: string
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          notes?: string | null
          phone?: string | null
          seats?: number
          status?: string
          taping_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_requests_taping_id_fkey"
            columns: ["taping_id"]
            isOneToOne: false
            referencedRelation: "tapings"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_releases: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          role: string
          signature: string | null
          signed_at: string | null
          taping_id: string
          token: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          role?: string
          signature?: string | null
          signed_at?: string | null
          taping_id: string
          token?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          role?: string
          signature?: string | null
          signed_at?: string | null
          taping_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_releases_taping_id_fkey"
            columns: ["taping_id"]
            isOneToOne: false
            referencedRelation: "tapings"
            referencedColumns: ["id"]
          },
        ]
      }
      hour_packs: {
        Row: {
          created_at: string
          email: string
          hours: number
          hours_used: number
          id: string
          name: string
          price_cents: number
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          hours: number
          hours_used?: number
          id?: string
          name: string
          price_cents: number
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          hours?: number
          hours_used?: number
          id?: string
          name?: string
          price_cents?: number
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      income: {
        Row: {
          amount_cents: number
          campaign_id: string | null
          created_at: string
          id: string
          invoice_id: string | null
          memo: string | null
          partner_id: string | null
          received_on: string
          sponsor_id: string | null
          stream: string
        }
        Insert: {
          amount_cents: number
          campaign_id?: string | null
          created_at?: string
          id?: string
          invoice_id?: string | null
          memo?: string | null
          partner_id?: string | null
          received_on?: string
          sponsor_id?: string | null
          stream: string
        }
        Update: {
          amount_cents?: number
          campaign_id?: string | null
          created_at?: string
          id?: string
          invoice_id?: string | null
          memo?: string | null
          partner_id?: string | null
          received_on?: string
          sponsor_id?: string | null
          stream?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_cents: number
          client_name: string
          created_at: string
          description: string | null
          due_on: string
          email: string | null
          id: string
          issued_on: string
          kind: string
          number: string
          paid_on: string | null
          pay_url: string | null
          status: string
        }
        Insert: {
          amount_cents?: number
          client_name: string
          created_at?: string
          description?: string | null
          due_on?: string
          email?: string | null
          id?: string
          issued_on?: string
          kind?: string
          number?: string
          paid_on?: string | null
          pay_url?: string | null
          status?: string
        }
        Update: {
          amount_cents?: number
          client_name?: string
          created_at?: string
          description?: string | null
          due_on?: string
          email?: string | null
          id?: string
          issued_on?: string
          kind?: string
          number?: string
          paid_on?: string | null
          pay_url?: string | null
          status?: string
        }
        Relationships: []
      }
      newsletter_signups: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          id: string
          path: string
          session_id: string
          source: string
        }
        Insert: {
          created_at?: string
          id?: string
          path: string
          session_id: string
          source?: string
        }
        Update: {
          created_at?: string
          id?: string
          path?: string
          session_id?: string
          source?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          amount_cents: number
          campaign_id: string | null
          created_at: string
          email: string | null
          frequency: string
          id: string
          name: string
          start_date: string
          status: string
          user_id: string | null
        }
        Insert: {
          amount_cents?: number
          campaign_id?: string | null
          created_at?: string
          email?: string | null
          frequency?: string
          id?: string
          name: string
          start_date?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          campaign_id?: string | null
          created_at?: string
          email?: string | null
          frequency?: string
          id?: string
          name?: string
          start_date?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partners_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_requests: {
        Row: {
          body: string
          created_at: string
          email: string | null
          id: string
          kind: string
          name: string | null
          share_on_air: boolean
          status: string
        }
        Insert: {
          body: string
          created_at?: string
          email?: string | null
          id?: string
          kind?: string
          name?: string | null
          share_on_air?: boolean
          status?: string
        }
        Update: {
          body?: string
          created_at?: string
          email?: string | null
          id?: string
          kind?: string
          name?: string | null
          share_on_air?: boolean
          status?: string
        }
        Relationships: []
      }
      rental_inquiries: {
        Row: {
          admin_note: string | null
          created_at: string
          details: string
          email: string
          event_type: string
          headcount: number
          id: string
          name: string
          pay_url: string | null
          phone: string | null
          preferred_date: string | null
          quote_cents: number | null
          status: string
          user_id: string | null
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          details: string
          email: string
          event_type: string
          headcount?: number
          id?: string
          name: string
          pay_url?: string | null
          phone?: string | null
          preferred_date?: string | null
          quote_cents?: number | null
          status?: string
          user_id?: string | null
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          details?: string
          email?: string
          event_type?: string
          headcount?: number
          id?: string
          name?: string
          pay_url?: string | null
          phone?: string | null
          preferred_date?: string | null
          quote_cents?: number | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      rental_settings: {
        Row: {
          deposit_pct: number
          edited_video_cents: number
          full_day_cents: number
          half_day_cents: number
          id: number
          max_capacity: number
          operator_hourly_cents: number
          pack_discount_pct: number
          pack_hours: number
          package_hourly_cents: number
          podcast_hourly_cents: number
          security_deposit_cents: number
          setup_hourly_cents: number
          shuttle_cents: number
        }
        Insert: {
          deposit_pct?: number
          edited_video_cents?: number
          full_day_cents?: number
          half_day_cents?: number
          id?: number
          max_capacity?: number
          operator_hourly_cents?: number
          pack_discount_pct?: number
          pack_hours?: number
          package_hourly_cents?: number
          podcast_hourly_cents?: number
          security_deposit_cents?: number
          setup_hourly_cents?: number
          shuttle_cents?: number
        }
        Update: {
          deposit_pct?: number
          edited_video_cents?: number
          full_day_cents?: number
          half_day_cents?: number
          id?: number
          max_capacity?: number
          operator_hourly_cents?: number
          pack_discount_pct?: number
          pack_hours?: number
          package_hourly_cents?: number
          podcast_hourly_cents?: number
          security_deposit_cents?: number
          setup_hourly_cents?: number
          shuttle_cents?: number
        }
        Relationships: []
      }
      rentals: {
        Row: {
          addons: Json
          agreement_name: string | null
          agreement_path: string | null
          agreement_signed_at: string | null
          balance_due_on: string | null
          balance_paid: boolean
          created_at: string
          deposit_cents: number
          deposit_paid: boolean
          email: string | null
          ends_at: string
          headcount: number
          id: string
          invoice_id: string | null
          notes: string | null
          pack_hours_used: number
          phone: string | null
          quote_cents: number
          rate_cents: number
          rate_type: string
          refund_pct: number | null
          rental_type: string
          renter: string
          security_deposit_cents: number
          security_note: string | null
          security_photo_path: string | null
          security_status: string
          starts_at: string
          status: string
          user_id: string | null
        }
        Insert: {
          addons?: Json
          agreement_name?: string | null
          agreement_path?: string | null
          agreement_signed_at?: string | null
          balance_due_on?: string | null
          balance_paid?: boolean
          created_at?: string
          deposit_cents?: number
          deposit_paid?: boolean
          email?: string | null
          ends_at: string
          headcount?: number
          id?: string
          invoice_id?: string | null
          notes?: string | null
          pack_hours_used?: number
          phone?: string | null
          quote_cents?: number
          rate_cents?: number
          rate_type?: string
          refund_pct?: number | null
          rental_type?: string
          renter: string
          security_deposit_cents?: number
          security_note?: string | null
          security_photo_path?: string | null
          security_status?: string
          starts_at: string
          status?: string
          user_id?: string | null
        }
        Update: {
          addons?: Json
          agreement_name?: string | null
          agreement_path?: string | null
          agreement_signed_at?: string | null
          balance_due_on?: string | null
          balance_paid?: boolean
          created_at?: string
          deposit_cents?: number
          deposit_paid?: boolean
          email?: string | null
          ends_at?: string
          headcount?: number
          id?: string
          invoice_id?: string | null
          notes?: string | null
          pack_hours_used?: number
          phone?: string | null
          quote_cents?: number
          rate_cents?: number
          rate_type?: string
          refund_pct?: number | null
          rental_type?: string
          renter?: string
          security_deposit_cents?: number
          security_note?: string | null
          security_photo_path?: string | null
          security_status?: string
          starts_at?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rentals_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          accessible_seating: boolean
          checked_in_at: string | null
          created_at: string
          email: string
          filming_consent: boolean
          full_name: string
          id: string
          minor_names: string[]
          no_show_at: string | null
          qr_code: string
          question: string | null
          seats: number
          sms_opt_in: boolean
          sms_phone: string | null
          status: string
          taping_id: string
          ticket_type: Database["public"]["Enums"]["ticket_type"]
          user_id: string
        }
        Insert: {
          accessible_seating?: boolean
          checked_in_at?: string | null
          created_at?: string
          email: string
          filming_consent: boolean
          full_name: string
          id?: string
          minor_names?: string[]
          no_show_at?: string | null
          qr_code?: string
          question?: string | null
          seats?: number
          sms_opt_in?: boolean
          sms_phone?: string | null
          status?: string
          taping_id: string
          ticket_type?: Database["public"]["Enums"]["ticket_type"]
          user_id: string
        }
        Update: {
          accessible_seating?: boolean
          checked_in_at?: string | null
          created_at?: string
          email?: string
          filming_consent?: boolean
          full_name?: string
          id?: string
          minor_names?: string[]
          no_show_at?: string | null
          qr_code?: string
          question?: string | null
          seats?: number
          sms_opt_in?: boolean
          sms_phone?: string | null
          status?: string
          taping_id?: string
          ticket_type?: Database["public"]["Enums"]["ticket_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_taping_id_fkey"
            columns: ["taping_id"]
            isOneToOne: false
            referencedRelation: "tapings"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_claims: {
        Row: {
          created_at: string
          hours: number | null
          id: string
          shift_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hours?: number | null
          id?: string
          shift_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hours?: number | null
          id?: string
          shift_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_claims_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          notes: string | null
          role: string
          slots: number
          starts_at: string
          taping_id: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          notes?: string | null
          role: string
          slots?: number
          starts_at: string
          taping_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          notes?: string | null
          role?: string
          slots?: number
          starts_at?: string
          taping_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_taping_id_fkey"
            columns: ["taping_id"]
            isOneToOne: false
            referencedRelation: "tapings"
            referencedColumns: ["id"]
          },
        ]
      }
      shuttle_bookings: {
        Row: {
          arrived_at: string | null
          created_at: string
          direction: string
          id: string
          loop_time: string
          reservation_id: string
          running_late_at: string | null
          seats: number
          status: string
          taping_id: string
          user_id: string
        }
        Insert: {
          arrived_at?: string | null
          created_at?: string
          direction?: string
          id?: string
          loop_time: string
          reservation_id: string
          running_late_at?: string | null
          seats?: number
          status?: string
          taping_id: string
          user_id: string
        }
        Update: {
          arrived_at?: string | null
          created_at?: string
          direction?: string
          id?: string
          loop_time?: string
          reservation_id?: string
          running_late_at?: string | null
          seats?: number
          status?: string
          taping_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shuttle_bookings_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shuttle_bookings_taping_id_fkey"
            columns: ["taping_id"]
            isOneToOne: false
            referencedRelation: "tapings"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          giving_enabled: boolean
          id: number
          merch_enabled: boolean
        }
        Insert: {
          giving_enabled?: boolean
          id?: number
          merch_enabled?: boolean
        }
        Update: {
          giving_enabled?: boolean
          id?: number
          merch_enabled?: boolean
        }
        Relationships: []
      }
      sponsor_deliverables: {
        Row: {
          clip_posted: boolean
          created_at: string
          episode_id: string | null
          id: string
          logo_shown: boolean
          mention_made: boolean
          notes: string | null
          sponsor_id: string
        }
        Insert: {
          clip_posted?: boolean
          created_at?: string
          episode_id?: string | null
          id?: string
          logo_shown?: boolean
          mention_made?: boolean
          notes?: string | null
          sponsor_id: string
        }
        Update: {
          clip_posted?: boolean
          created_at?: string
          episode_id?: string | null
          id?: string
          logo_shown?: boolean
          mention_made?: boolean
          notes?: string | null
          sponsor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_deliverables_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_deliverables_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          agreement_path: string | null
          business: string
          contact: string | null
          created_at: string
          email: string | null
          end_date: string | null
          id: string
          package: string | null
          price_cents: number
          start_date: string | null
          status: string
        }
        Insert: {
          agreement_path?: string | null
          business: string
          contact?: string | null
          created_at?: string
          email?: string | null
          end_date?: string | null
          id?: string
          package?: string | null
          price_cents?: number
          start_date?: string | null
          status?: string
        }
        Update: {
          agreement_path?: string | null
          business?: string
          contact?: string | null
          created_at?: string
          email?: string | null
          end_date?: string | null
          id?: string
          package?: string | null
          price_cents?: number
          start_date?: string | null
          status?: string
        }
        Relationships: []
      }
      staff_invites: {
        Row: {
          created_at: string
          email: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          email: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          email?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      submissions: {
        Row: {
          content: string
          created_at: string
          email: string
          id: string
          kind: string
          name: string
          status: string
          taping_id: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          email: string
          id?: string
          kind: string
          name: string
          status?: string
          taping_id?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          email?: string
          id?: string
          kind?: string
          name?: string
          status?: string
          taping_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_taping_id_fkey"
            columns: ["taping_id"]
            isOneToOne: false
            referencedRelation: "tapings"
            referencedColumns: ["id"]
          },
        ]
      }
      taping_door_codes: {
        Row: {
          code: string
          taping_id: string
        }
        Insert: {
          code?: string
          taping_id: string
        }
        Update: {
          code?: string
          taping_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "taping_door_codes_taping_id_fkey"
            columns: ["taping_id"]
            isOneToOne: true
            referencedRelation: "tapings"
            referencedColumns: ["id"]
          },
        ]
      }
      taping_feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          reservation_id: string
          taping_id: string
          testimonial_ok: boolean
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reservation_id: string
          taping_id: string
          testimonial_ok?: boolean
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reservation_id?: string
          taping_id?: string
          testimonial_ok?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "taping_feedback_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: true
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taping_feedback_taping_id_fkey"
            columns: ["taping_id"]
            isOneToOne: false
            referencedRelation: "tapings"
            referencedColumns: ["id"]
          },
        ]
      }
      taping_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          taping_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          taping_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          taping_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "taping_messages_taping_id_fkey"
            columns: ["taping_id"]
            isOneToOne: false
            referencedRelation: "tapings"
            referencedColumns: ["id"]
          },
        ]
      }
      tapings: {
        Row: {
          capacity: number
          created_at: string
          description: string | null
          group_enabled: boolean
          guests: string[]
          id: string
          overbook_pct: number
          shuttle_end: string
          shuttle_interval_min: number
          shuttle_seats_per_loop: number
          shuttle_start: string
          sponsor_logo_url: string | null
          sponsor_name: string | null
          sponsor_url: string | null
          starts_at: string
          theme: string
          vip_price_cents: number
          vip_seats: number
        }
        Insert: {
          capacity?: number
          created_at?: string
          description?: string | null
          group_enabled?: boolean
          guests?: string[]
          id?: string
          overbook_pct?: number
          shuttle_end?: string
          shuttle_interval_min?: number
          shuttle_seats_per_loop?: number
          shuttle_start?: string
          sponsor_logo_url?: string | null
          sponsor_name?: string | null
          sponsor_url?: string | null
          starts_at: string
          theme: string
          vip_price_cents?: number
          vip_seats?: number
        }
        Update: {
          capacity?: number
          created_at?: string
          description?: string | null
          group_enabled?: boolean
          guests?: string[]
          id?: string
          overbook_pct?: number
          shuttle_end?: string
          shuttle_interval_min?: number
          shuttle_seats_per_loop?: number
          shuttle_start?: string
          sponsor_logo_url?: string | null
          sponsor_name?: string | null
          sponsor_url?: string | null
          starts_at?: string
          theme?: string
          vip_price_cents?: number
          vip_seats?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      volunteers: {
        Row: {
          availability: string | null
          created_at: string
          email: string
          insurance_path: string | null
          license_path: string | null
          name: string
          phone: string | null
          roles: string[]
          status: string
          user_id: string
        }
        Insert: {
          availability?: string | null
          created_at?: string
          email: string
          insurance_path?: string | null
          license_path?: string | null
          name: string
          phone?: string | null
          roles?: string[]
          status?: string
          user_id: string
        }
        Update: {
          availability?: string | null
          created_at?: string
          email?: string
          insurance_path?: string | null
          license_path?: string | null
          name?: string
          phone?: string | null
          roles?: string[]
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          offered_at: string | null
          status: string
          taping_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          offered_at?: string | null
          status?: string
          taping_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          offered_at?: string | null
          status?: string
          taping_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_taping_id_fkey"
            columns: ["taping_id"]
            isOneToOne: false
            referencedRelation: "tapings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_staff: {
        Args: { _email: string; _role: Database["public"]["Enums"]["app_role"] }
        Returns: string
      }
      book_rental: {
        Args: {
          _addons: Json
          _email: string
          _end: string
          _headcount: number
          _name: string
          _phone: string
          _signature: string
          _start: string
          _type: string
          _use_pack?: boolean
        }
        Returns: Json
      }
      book_shuttle: {
        Args: { _direction: string; _loop: string; _reservation: string }
        Returns: undefined
      }
      buy_hour_pack: {
        Args: { _email: string; _name: string }
        Returns: undefined
      }
      cancel_my_giving: { Args: { _partner: string }; Returns: undefined }
      cancel_my_rental: { Args: { _rental: string }; Returns: number }
      cancel_reservation: { Args: { _reservation: string }; Returns: undefined }
      check_in: { Args: { _code: string }; Returns: Json }
      claim_shift: { Args: { _shift: string }; Returns: undefined }
      decide_group_request: {
        Args: { _approve: boolean; _req: string }
        Returns: undefined
      }
      door_code: { Args: { _taping: string }; Returns: string }
      effective_capacity: { Args: { _taping: string }; Returns: number }
      flagged_attendees: {
        Args: { _taping: string }
        Returns: {
          no_shows: number
          user_id: string
        }[]
      }
      get_release: { Args: { _token: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      join_volunteers: {
        Args: {
          _availability: string
          _name: string
          _phone: string
          _roles: string[]
        }
        Returns: undefined
      }
      list_staff: {
        Args: never
        Returns: {
          email: string
          pending: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
      mark_no_show: {
        Args: { _reservation: string; _undo?: boolean }
        Returns: undefined
      }
      my_no_show_flag: { Args: never; Returns: boolean }
      no_show_count: { Args: { _user: string }; Returns: number }
      offer_open_seats: { Args: { _taping: string }; Returns: undefined }
      release_shift: { Args: { _shift: string }; Returns: undefined }
      remove_staff: {
        Args: { _email: string; _user: string }
        Returns: undefined
      }
      rental_price: {
        Args: {
          _addons: Json
          _end: string
          _pack_hours?: number
          _start: string
          _type: string
        }
        Returns: Json
      }
      reserve_seat: {
        Args: {
          _accessible?: boolean
          _consent: boolean
          _email: string
          _minors?: string[]
          _name: string
          _question: string
          _taping: string
        }
        Returns: Json
      }
      seats_taken: { Args: { _taping: string }; Returns: number }
      self_check_in: { Args: { _code: string; _taping: string }; Returns: Json }
      set_sms_pref: {
        Args: { _opt: boolean; _phone: string; _reservation: string }
        Returns: undefined
      }
      shift_openings: {
        Args: never
        Returns: {
          claimed: number
          shift_id: string
        }[]
      }
      shuttle_availability: {
        Args: { _taping: string }
        Returns: {
          booked: number
          loop_time: string
        }[]
      }
      shuttle_signal: {
        Args: { _booking: string; _signal: string }
        Returns: undefined
      }
      sign_release: {
        Args: { _signature: string; _token: string }
        Returns: undefined
      }
      studio_busy: {
        Args: { _from: string; _to: string }
        Returns: {
          ends_at: string
          kind: string
          starts_at: string
        }[]
      }
      taping_availability: {
        Args: never
        Returns: {
          seats_left: number
          taping_id: string
          vip_left: number
          waitlist_count: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "crew" | "volunteer"
      episode_type: "episode" | "sitdown" | "special"
      ticket_type: "general" | "vip" | "group"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "crew", "volunteer"],
      episode_type: ["episode", "sitdown", "special"],
      ticket_type: ["general", "vip", "group"],
    },
  },
} as const
