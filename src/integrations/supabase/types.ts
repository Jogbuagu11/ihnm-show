// Generated from the database schema. Do not edit by hand.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      budgets: {
        Row: {
          category: string;
          monthly_cents: number;
        };
        ComputedFields: never;
        Insert: {
          category: string;
          monthly_cents?: number;
        };
        Update: {
          category?: string;
          monthly_cents?: number;
        };
        Relationships: [];
      };
      campaigns: {
        Row: {
          active: boolean;
          created_at: string;
          description: string | null;
          goal_cents: number;
          id: string;
          name: string;
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          created_at?: string;
          description?: string | null;
          goal_cents?: number;
          id?: string;
          name: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          description?: string | null;
          goal_cents?: number;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      contact_messages: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          message: string;
          name: string;
          notified_at: string | null;
          organization: string | null;
          phone: string | null;
          status: string;
          topic: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          message: string;
          name: string;
          notified_at?: string | null;
          organization?: string | null;
          phone?: string | null;
          status?: string;
          topic: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          message?: string;
          name?: string;
          notified_at?: string | null;
          organization?: string | null;
          phone?: string | null;
          status?: string;
          topic?: string;
        };
        Relationships: [];
      };
      episodes: {
        Row: {
          aired_on: string;
          chat_url: string | null;
          created_at: string;
          description: string | null;
          guests: string[];
          id: string;
          kind: Database["public"]["Enums"]["episode_type"];
          live_at: string | null;
          slug: string;
          sponsor_logo_url: string | null;
          sponsor_name: string | null;
          sponsor_url: string | null;
          tags: string[];
          thumbnail: string | null;
          title: string;
          youtube_url: string | null;
        };
        ComputedFields: never;
        Insert: {
          aired_on?: string;
          chat_url?: string | null;
          created_at?: string;
          description?: string | null;
          guests?: string[];
          id?: string;
          kind?: Database["public"]["Enums"]["episode_type"];
          live_at?: string | null;
          slug: string;
          sponsor_logo_url?: string | null;
          sponsor_name?: string | null;
          sponsor_url?: string | null;
          tags?: string[];
          thumbnail?: string | null;
          title: string;
          youtube_url?: string | null;
        };
        Update: {
          aired_on?: string;
          chat_url?: string | null;
          created_at?: string;
          description?: string | null;
          guests?: string[];
          id?: string;
          kind?: Database["public"]["Enums"]["episode_type"];
          live_at?: string | null;
          slug?: string;
          sponsor_logo_url?: string | null;
          sponsor_name?: string | null;
          sponsor_url?: string | null;
          tags?: string[];
          thumbnail?: string | null;
          title?: string;
          youtube_url?: string | null;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          amount_cents: number;
          category: string;
          created_at: string;
          id: string;
          memo: string | null;
          receipt_path: string | null;
          spent_on: string;
          vendor: string | null;
        };
        ComputedFields: never;
        Insert: {
          amount_cents: number;
          category: string;
          created_at?: string;
          id?: string;
          memo?: string | null;
          receipt_path?: string | null;
          spent_on?: string;
          vendor?: string | null;
        };
        Update: {
          amount_cents?: number;
          category?: string;
          created_at?: string;
          id?: string;
          memo?: string | null;
          receipt_path?: string | null;
          spent_on?: string;
          vendor?: string | null;
        };
        Relationships: [];
      };
      expert_bookings: {
        Row: {
          briefing: string | null;
          briefing_sent_at: string | null;
          clip_1: string | null;
          clip_2: string | null;
          clip_3: string | null;
          clip_4: string | null;
          clip_5: string | null;
          clips_sent_at: string | null;
          created_at: string;
          expert_id: string;
          id: string;
          posted: boolean;
          status: string;
          taping_id: string;
        };
        ComputedFields: never;
        Insert: {
          briefing?: string | null;
          briefing_sent_at?: string | null;
          clip_1?: string | null;
          clip_2?: string | null;
          clip_3?: string | null;
          clip_4?: string | null;
          clip_5?: string | null;
          clips_sent_at?: string | null;
          created_at?: string;
          expert_id: string;
          id?: string;
          posted?: boolean;
          status?: string;
          taping_id: string;
        };
        Update: {
          briefing?: string | null;
          briefing_sent_at?: string | null;
          clip_1?: string | null;
          clip_2?: string | null;
          clip_3?: string | null;
          clip_4?: string | null;
          clip_5?: string | null;
          clips_sent_at?: string | null;
          created_at?: string;
          expert_id?: string;
          id?: string;
          posted?: boolean;
          status?: string;
          taping_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expert_bookings_expert_id_fkey";
            columns: ["expert_id"];
            isOneToOne: false;
            referencedRelation: "experts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expert_bookings_taping_id_fkey";
            columns: ["taping_id"];
            isOneToOne: false;
            referencedRelation: "tapings";
            referencedColumns: ["id"];
          },
        ];
      };
      experts: {
        Row: {
          created_at: string;
          email: string | null;
          field: string | null;
          id: string;
          name: string;
          notes: string | null;
          past_appearances: string | null;
          phone: string | null;
          topics: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          email?: string | null;
          field?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          past_appearances?: string | null;
          phone?: string | null;
          topics?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          field?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          past_appearances?: string | null;
          phone?: string | null;
          topics?: string | null;
        };
        Relationships: [];
      };
      finance_settings: {
        Row: {
          fundraising_goal_cents: number;
          id: number;
          monthly_operating_cents: number;
        };
        ComputedFields: never;
        Insert: {
          fundraising_goal_cents?: number;
          id?: number;
          monthly_operating_cents?: number;
        };
        Update: {
          fundraising_goal_cents?: number;
          id?: number;
          monthly_operating_cents?: number;
        };
        Relationships: [];
      };
      group_requests: {
        Row: {
          church_name: string;
          contact_name: string;
          created_at: string;
          email: string;
          id: string;
          notes: string | null;
          phone: string | null;
          seats: number;
          status: string;
          taping_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          church_name: string;
          contact_name: string;
          created_at?: string;
          email: string;
          id?: string;
          notes?: string | null;
          phone?: string | null;
          seats: number;
          status?: string;
          taping_id: string;
          user_id: string;
        };
        Update: {
          church_name?: string;
          contact_name?: string;
          created_at?: string;
          email?: string;
          id?: string;
          notes?: string | null;
          phone?: string | null;
          seats?: number;
          status?: string;
          taping_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "group_requests_taping_id_fkey";
            columns: ["taping_id"];
            isOneToOne: false;
            referencedRelation: "tapings";
            referencedColumns: ["id"];
          },
        ];
      };
      guest_releases: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          name: string;
          role: string;
          signature: string | null;
          signed_at: string | null;
          taping_id: string;
          token: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name: string;
          role?: string;
          signature?: string | null;
          signed_at?: string | null;
          taping_id: string;
          token?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string;
          role?: string;
          signature?: string | null;
          signed_at?: string | null;
          taping_id?: string;
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "guest_releases_taping_id_fkey";
            columns: ["taping_id"];
            isOneToOne: false;
            referencedRelation: "tapings";
            referencedColumns: ["id"];
          },
        ];
      };
      hour_packs: {
        Row: {
          created_at: string;
          email: string;
          hours: number;
          hours_used: number;
          id: string;
          name: string;
          price_cents: number;
          status: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          email: string;
          hours: number;
          hours_used?: number;
          id?: string;
          name: string;
          price_cents: number;
          status?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          hours?: number;
          hours_used?: number;
          id?: string;
          name?: string;
          price_cents?: number;
          status?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      income: {
        Row: {
          amount_cents: number;
          campaign_id: string | null;
          created_at: string;
          id: string;
          invoice_id: string | null;
          memo: string | null;
          partner_id: string | null;
          received_on: string;
          sponsor_id: string | null;
          stream: string;
        };
        ComputedFields: never;
        Insert: {
          amount_cents: number;
          campaign_id?: string | null;
          created_at?: string;
          id?: string;
          invoice_id?: string | null;
          memo?: string | null;
          partner_id?: string | null;
          received_on?: string;
          sponsor_id?: string | null;
          stream: string;
        };
        Update: {
          amount_cents?: number;
          campaign_id?: string | null;
          created_at?: string;
          id?: string;
          invoice_id?: string | null;
          memo?: string | null;
          partner_id?: string | null;
          received_on?: string;
          sponsor_id?: string | null;
          stream?: string;
        };
        Relationships: [
          {
            foreignKeyName: "income_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "income_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "income_partner_id_fkey";
            columns: ["partner_id"];
            isOneToOne: false;
            referencedRelation: "partners";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "income_sponsor_id_fkey";
            columns: ["sponsor_id"];
            isOneToOne: false;
            referencedRelation: "sponsors";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          amount_cents: number;
          client_name: string;
          created_at: string;
          description: string | null;
          due_on: string;
          email: string | null;
          id: string;
          issued_on: string;
          kind: string;
          number: string;
          paid_on: string | null;
          pay_url: string | null;
          status: string;
        };
        ComputedFields: never;
        Insert: {
          amount_cents?: number;
          client_name: string;
          created_at?: string;
          description?: string | null;
          due_on?: string;
          email?: string | null;
          id?: string;
          issued_on?: string;
          kind?: string;
          number?: string;
          paid_on?: string | null;
          pay_url?: string | null;
          status?: string;
        };
        Update: {
          amount_cents?: number;
          client_name?: string;
          created_at?: string;
          description?: string | null;
          due_on?: string;
          email?: string | null;
          id?: string;
          issued_on?: string;
          kind?: string;
          number?: string;
          paid_on?: string | null;
          pay_url?: string | null;
          status?: string;
        };
        Relationships: [];
      };
      kids_registrations: {
        Row: {
          age_years: number;
          allergies: string | null;
          cancelled_at: string | null;
          checked_in_at: string | null;
          checked_out_at: string | null;
          child_first_name: string;
          child_last_name: string | null;
          created_at: string;
          guardian_name: string;
          guardian_phone: string;
          id: string;
          notes: string | null;
          release_code: string;
          released_to: string | null;
          reservation_id: string;
          room_id: string;
        };
        ComputedFields: never;
        Insert: {
          age_years: number;
          allergies?: string | null;
          cancelled_at?: string | null;
          checked_in_at?: string | null;
          checked_out_at?: string | null;
          child_first_name: string;
          child_last_name?: string | null;
          created_at?: string;
          guardian_name: string;
          guardian_phone: string;
          id?: string;
          notes?: string | null;
          release_code: string;
          released_to?: string | null;
          reservation_id: string;
          room_id: string;
        };
        Update: {
          age_years?: number;
          allergies?: string | null;
          cancelled_at?: string | null;
          checked_in_at?: string | null;
          checked_out_at?: string | null;
          child_first_name?: string;
          child_last_name?: string | null;
          created_at?: string;
          guardian_name?: string;
          guardian_phone?: string;
          id?: string;
          notes?: string | null;
          release_code?: string;
          released_to?: string | null;
          reservation_id?: string;
          room_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kids_registrations_reservation_id_fkey";
            columns: ["reservation_id"];
            isOneToOne: false;
            referencedRelation: "reservations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kids_registrations_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "kids_rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      kids_rooms: {
        Row: {
          capacity: number;
          created_at: string;
          id: string;
          max_age_years: number;
          min_age_years: number;
          name: string;
          notes: string | null;
          sort_order: number;
          taping_id: string;
        };
        ComputedFields: never;
        Insert: {
          capacity?: number;
          created_at?: string;
          id?: string;
          max_age_years?: number;
          min_age_years?: number;
          name?: string;
          notes?: string | null;
          sort_order?: number;
          taping_id: string;
        };
        Update: {
          capacity?: number;
          created_at?: string;
          id?: string;
          max_age_years?: number;
          min_age_years?: number;
          name?: string;
          notes?: string | null;
          sort_order?: number;
          taping_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kids_rooms_taping_id_fkey";
            columns: ["taping_id"];
            isOneToOne: false;
            referencedRelation: "tapings";
            referencedColumns: ["id"];
          },
        ];
      };
      newsletter_signups: {
        Row: {
          created_at: string;
          email: string;
          id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
        };
        Relationships: [];
      };
      page_views: {
        Row: {
          created_at: string;
          id: string;
          path: string;
          session_id: string;
          source: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          path: string;
          session_id: string;
          source?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          path?: string;
          session_id?: string;
          source?: string;
        };
        Relationships: [];
      };
      partner_inquiries: {
        Row: {
          admin_note: string | null;
          business: string | null;
          created_at: string;
          email: string;
          id: string;
          interest: string;
          message: string | null;
          name: string;
          notified_at: string | null;
          phone: string | null;
          status: string;
        };
        ComputedFields: never;
        Insert: {
          admin_note?: string | null;
          business?: string | null;
          created_at?: string;
          email: string;
          id?: string;
          interest: string;
          message?: string | null;
          name: string;
          notified_at?: string | null;
          phone?: string | null;
          status?: string;
        };
        Update: {
          admin_note?: string | null;
          business?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          interest?: string;
          message?: string | null;
          name?: string;
          notified_at?: string | null;
          phone?: string | null;
          status?: string;
        };
        Relationships: [];
      };
      partners: {
        Row: {
          amount_cents: number;
          campaign_id: string | null;
          created_at: string;
          email: string | null;
          frequency: string;
          id: string;
          name: string;
          start_date: string;
          status: string;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          amount_cents?: number;
          campaign_id?: string | null;
          created_at?: string;
          email?: string | null;
          frequency?: string;
          id?: string;
          name: string;
          start_date?: string;
          status?: string;
          user_id?: string | null;
        };
        Update: {
          amount_cents?: number;
          campaign_id?: string | null;
          created_at?: string;
          email?: string | null;
          frequency?: string;
          id?: string;
          name?: string;
          start_date?: string;
          status?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "partners_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
        ];
      };
      person_blocks: {
        Row: {
          blocked_by: string | null;
          created_at: string;
          dismissed_on: string | null;
          email: string | null;
          id: string;
          lift_note: string | null;
          lifted_at: string | null;
          lifted_by: string | null;
          reason: string;
          scope: Database["public"]["Enums"]["block_scope"];
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          blocked_by?: string | null;
          created_at?: string;
          dismissed_on?: string | null;
          email?: string | null;
          id?: string;
          lift_note?: string | null;
          lifted_at?: string | null;
          lifted_by?: string | null;
          reason: string;
          scope?: Database["public"]["Enums"]["block_scope"];
          user_id?: string | null;
        };
        Update: {
          blocked_by?: string | null;
          created_at?: string;
          dismissed_on?: string | null;
          email?: string | null;
          id?: string;
          lift_note?: string | null;
          lifted_at?: string | null;
          lifted_by?: string | null;
          reason?: string;
          scope?: Database["public"]["Enums"]["block_scope"];
          user_id?: string | null;
        };
        Relationships: [];
      };
      prayer_requests: {
        Row: {
          body: string;
          created_at: string;
          email: string | null;
          id: string;
          kind: string;
          name: string | null;
          share_on_air: boolean;
          status: string;
        };
        ComputedFields: never;
        Insert: {
          body: string;
          created_at?: string;
          email?: string | null;
          id?: string;
          kind?: string;
          name?: string | null;
          share_on_air?: boolean;
          status?: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          email?: string | null;
          id?: string;
          kind?: string;
          name?: string | null;
          share_on_air?: boolean;
          status?: string;
        };
        Relationships: [];
      };
      pub_authors: {
        Row: {
          bio: string | null;
          created_at: string;
          id: string;
          instagram_url: string | null;
          name: string;
          photo_path: string | null;
          slug: string;
          website_url: string | null;
          x_url: string | null;
        };
        ComputedFields: never;
        Insert: {
          bio?: string | null;
          created_at?: string;
          id?: string;
          instagram_url?: string | null;
          name: string;
          photo_path?: string | null;
          slug: string;
          website_url?: string | null;
          x_url?: string | null;
        };
        Update: {
          bio?: string | null;
          created_at?: string;
          id?: string;
          instagram_url?: string | null;
          name?: string;
          photo_path?: string | null;
          slug?: string;
          website_url?: string | null;
          x_url?: string | null;
        };
        Relationships: [];
      };
      pub_book_authors: {
        Row: {
          author_id: string;
          book_id: string;
          sort_order: number;
        };
        ComputedFields: never;
        Insert: {
          author_id: string;
          book_id: string;
          sort_order?: number;
        };
        Update: {
          author_id?: string;
          book_id?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "pub_book_authors_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "pub_authors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pub_book_authors_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "pub_books";
            referencedColumns: ["id"];
          },
        ];
      };
      pub_book_formats: {
        Row: {
          book_id: string;
          format: Database["public"]["Enums"]["pub_format"];
          id: string;
          isbn: string | null;
          price_cents: number | null;
        };
        ComputedFields: never;
        Insert: {
          book_id: string;
          format: Database["public"]["Enums"]["pub_format"];
          id?: string;
          isbn?: string | null;
          price_cents?: number | null;
        };
        Update: {
          book_id?: string;
          format?: Database["public"]["Enums"]["pub_format"];
          id?: string;
          isbn?: string | null;
          price_cents?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "pub_book_formats_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "pub_books";
            referencedColumns: ["id"];
          },
        ];
      };
      pub_books: {
        Row: {
          buy_links: NonNullable<Json>;
          category: Database["public"]["Enums"]["pub_category"];
          cover_path: string | null;
          created_at: string;
          description: string | null;
          featured: boolean;
          id: string;
          page_count: number | null;
          release_date: string | null;
          sample_pdf_path: string | null;
          slug: string;
          status: Database["public"]["Enums"]["pub_book_status"];
          subtitle: string | null;
          title: string;
          youtube_url: string | null;
        };
        ComputedFields: never;
        Insert: {
          buy_links?: NonNullable<Json>;
          category?: Database["public"]["Enums"]["pub_category"];
          cover_path?: string | null;
          created_at?: string;
          description?: string | null;
          featured?: boolean;
          id?: string;
          page_count?: number | null;
          release_date?: string | null;
          sample_pdf_path?: string | null;
          slug: string;
          status?: Database["public"]["Enums"]["pub_book_status"];
          subtitle?: string | null;
          title: string;
          youtube_url?: string | null;
        };
        Update: {
          buy_links?: NonNullable<Json>;
          category?: Database["public"]["Enums"]["pub_category"];
          cover_path?: string | null;
          created_at?: string;
          description?: string | null;
          featured?: boolean;
          id?: string;
          page_count?: number | null;
          release_date?: string | null;
          sample_pdf_path?: string | null;
          slug?: string;
          status?: Database["public"]["Enums"]["pub_book_status"];
          subtitle?: string | null;
          title?: string;
          youtube_url?: string | null;
        };
        Relationships: [];
      };
      pub_endorsements: {
        Row: {
          book_id: string;
          id: string;
          quote: string;
          sort_order: number;
          source: string;
        };
        ComputedFields: never;
        Insert: {
          book_id: string;
          id?: string;
          quote: string;
          sort_order?: number;
          source: string;
        };
        Update: {
          book_id?: string;
          id?: string;
          quote?: string;
          sort_order?: number;
          source?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pub_endorsements_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "pub_books";
            referencedColumns: ["id"];
          },
        ];
      };
      pub_settings: {
        Row: {
          contract_term_years: number | null;
          created_at: string;
          id: number;
          response_weeks: number;
          royalty_rate_pct: number | null;
          site_url: string;
          substack_url: string | null;
          url_facebook: string | null;
          url_instagram: string | null;
          url_youtube: string | null;
        };
        ComputedFields: never;
        Insert: {
          contract_term_years?: number | null;
          created_at?: string;
          id?: number;
          response_weeks?: number;
          royalty_rate_pct?: number | null;
          site_url?: string;
          substack_url?: string | null;
          url_facebook?: string | null;
          url_instagram?: string | null;
          url_youtube?: string | null;
        };
        Update: {
          contract_term_years?: number | null;
          created_at?: string;
          id?: number;
          response_weeks?: number;
          royalty_rate_pct?: number | null;
          site_url?: string;
          substack_url?: string | null;
          url_facebook?: string | null;
          url_instagram?: string | null;
          url_youtube?: string | null;
        };
        Relationships: [];
      };
      pub_submissions: {
        Row: {
          admin_notes: string | null;
          author_bio: string | null;
          book_title: string;
          category: Database["public"]["Enums"]["pub_category"];
          created_at: string;
          email: string;
          file_path: string | null;
          id: string;
          manuscript_status: Database["public"]["Enums"]["pub_manuscript_status"];
          name: string;
          notified_at: string | null;
          phone: string | null;
          pitch: string;
          platform: string | null;
          purge_after: string | null;
          rights_confirmed: boolean;
          status: Database["public"]["Enums"]["pub_submission_status"];
          synopsis: string | null;
          terms_confirmed: boolean;
          word_count: number | null;
        };
        ComputedFields: never;
        Insert: {
          admin_notes?: string | null;
          author_bio?: string | null;
          book_title: string;
          category: Database["public"]["Enums"]["pub_category"];
          created_at?: string;
          email: string;
          file_path?: string | null;
          id?: string;
          manuscript_status?: Database["public"]["Enums"]["pub_manuscript_status"];
          name: string;
          notified_at?: string | null;
          phone?: string | null;
          pitch: string;
          platform?: string | null;
          purge_after?: string | null;
          rights_confirmed?: boolean;
          status?: Database["public"]["Enums"]["pub_submission_status"];
          synopsis?: string | null;
          terms_confirmed?: boolean;
          word_count?: number | null;
        };
        Update: {
          admin_notes?: string | null;
          author_bio?: string | null;
          book_title?: string;
          category?: Database["public"]["Enums"]["pub_category"];
          created_at?: string;
          email?: string;
          file_path?: string | null;
          id?: string;
          manuscript_status?: Database["public"]["Enums"]["pub_manuscript_status"];
          name?: string;
          notified_at?: string | null;
          phone?: string | null;
          pitch?: string;
          platform?: string | null;
          purge_after?: string | null;
          rights_confirmed?: boolean;
          status?: Database["public"]["Enums"]["pub_submission_status"];
          synopsis?: string | null;
          terms_confirmed?: boolean;
          word_count?: number | null;
        };
        Relationships: [];
      };
      rental_inquiries: {
        Row: {
          admin_note: string | null;
          created_at: string;
          details: string;
          email: string;
          event_type: string;
          headcount: number;
          id: string;
          name: string;
          notified_at: string | null;
          pay_url: string | null;
          phone: string | null;
          preferred_date: string | null;
          quote_cents: number | null;
          status: string;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          admin_note?: string | null;
          created_at?: string;
          details: string;
          email: string;
          event_type: string;
          headcount?: number;
          id?: string;
          name: string;
          notified_at?: string | null;
          pay_url?: string | null;
          phone?: string | null;
          preferred_date?: string | null;
          quote_cents?: number | null;
          status?: string;
          user_id?: string | null;
        };
        Update: {
          admin_note?: string | null;
          created_at?: string;
          details?: string;
          email?: string;
          event_type?: string;
          headcount?: number;
          id?: string;
          name?: string;
          notified_at?: string | null;
          pay_url?: string | null;
          phone?: string | null;
          preferred_date?: string | null;
          quote_cents?: number | null;
          status?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      rental_settings: {
        Row: {
          deposit_pct: number;
          edited_video_cents: number;
          full_day_cents: number;
          half_day_cents: number;
          id: number;
          max_capacity: number;
          operator_hourly_cents: number;
          pack_discount_pct: number;
          pack_hours: number;
          package_hourly_cents: number;
          podcast_hourly_cents: number;
          security_deposit_cents: number;
          setup_hourly_cents: number;
          shuttle_cents: number;
        };
        ComputedFields: never;
        Insert: {
          deposit_pct?: number;
          edited_video_cents?: number;
          full_day_cents?: number;
          half_day_cents?: number;
          id?: number;
          max_capacity?: number;
          operator_hourly_cents?: number;
          pack_discount_pct?: number;
          pack_hours?: number;
          package_hourly_cents?: number;
          podcast_hourly_cents?: number;
          security_deposit_cents?: number;
          setup_hourly_cents?: number;
          shuttle_cents?: number;
        };
        Update: {
          deposit_pct?: number;
          edited_video_cents?: number;
          full_day_cents?: number;
          half_day_cents?: number;
          id?: number;
          max_capacity?: number;
          operator_hourly_cents?: number;
          pack_discount_pct?: number;
          pack_hours?: number;
          package_hourly_cents?: number;
          podcast_hourly_cents?: number;
          security_deposit_cents?: number;
          setup_hourly_cents?: number;
          shuttle_cents?: number;
        };
        Relationships: [];
      };
      rentals: {
        Row: {
          addons: NonNullable<Json>;
          agreement_name: string | null;
          agreement_path: string | null;
          agreement_signed_at: string | null;
          balance_due_on: string | null;
          balance_paid: boolean;
          created_at: string;
          deposit_cents: number;
          deposit_paid: boolean;
          email: string | null;
          ends_at: string;
          headcount: number;
          id: string;
          invoice_id: string | null;
          notes: string | null;
          pack_hours_used: number;
          phone: string | null;
          quote_cents: number;
          rate_cents: number;
          rate_type: string;
          refund_pct: number | null;
          rental_type: string;
          renter: string;
          security_deposit_cents: number;
          security_note: string | null;
          security_photo_path: string | null;
          security_status: string;
          starts_at: string;
          status: string;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          addons?: NonNullable<Json>;
          agreement_name?: string | null;
          agreement_path?: string | null;
          agreement_signed_at?: string | null;
          balance_due_on?: string | null;
          balance_paid?: boolean;
          created_at?: string;
          deposit_cents?: number;
          deposit_paid?: boolean;
          email?: string | null;
          ends_at: string;
          headcount?: number;
          id?: string;
          invoice_id?: string | null;
          notes?: string | null;
          pack_hours_used?: number;
          phone?: string | null;
          quote_cents?: number;
          rate_cents?: number;
          rate_type?: string;
          refund_pct?: number | null;
          rental_type?: string;
          renter: string;
          security_deposit_cents?: number;
          security_note?: string | null;
          security_photo_path?: string | null;
          security_status?: string;
          starts_at: string;
          status?: string;
          user_id?: string | null;
        };
        Update: {
          addons?: NonNullable<Json>;
          agreement_name?: string | null;
          agreement_path?: string | null;
          agreement_signed_at?: string | null;
          balance_due_on?: string | null;
          balance_paid?: boolean;
          created_at?: string;
          deposit_cents?: number;
          deposit_paid?: boolean;
          email?: string | null;
          ends_at?: string;
          headcount?: number;
          id?: string;
          invoice_id?: string | null;
          notes?: string | null;
          pack_hours_used?: number;
          phone?: string | null;
          quote_cents?: number;
          rate_cents?: number;
          rate_type?: string;
          refund_pct?: number | null;
          rental_type?: string;
          renter?: string;
          security_deposit_cents?: number;
          security_note?: string | null;
          security_photo_path?: string | null;
          security_status?: string;
          starts_at?: string;
          status?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "rentals_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      reservations: {
        Row: {
          accessible_seating: boolean;
          checked_in_at: string | null;
          created_at: string;
          email: string;
          filming_consent: boolean;
          full_name: string;
          id: string;
          minor_names: string[];
          no_show_at: string | null;
          qr_code: string;
          question: string | null;
          seats: number;
          sms_opt_in: boolean;
          sms_phone: string | null;
          status: string;
          taping_id: string;
          ticket_type: Database["public"]["Enums"]["ticket_type"];
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          accessible_seating?: boolean;
          checked_in_at?: string | null;
          created_at?: string;
          email: string;
          filming_consent: boolean;
          full_name: string;
          id?: string;
          minor_names?: string[];
          no_show_at?: string | null;
          qr_code?: string;
          question?: string | null;
          seats?: number;
          sms_opt_in?: boolean;
          sms_phone?: string | null;
          status?: string;
          taping_id: string;
          ticket_type?: Database["public"]["Enums"]["ticket_type"];
          user_id: string;
        };
        Update: {
          accessible_seating?: boolean;
          checked_in_at?: string | null;
          created_at?: string;
          email?: string;
          filming_consent?: boolean;
          full_name?: string;
          id?: string;
          minor_names?: string[];
          no_show_at?: string | null;
          qr_code?: string;
          question?: string | null;
          seats?: number;
          sms_opt_in?: boolean;
          sms_phone?: string | null;
          status?: string;
          taping_id?: string;
          ticket_type?: Database["public"]["Enums"]["ticket_type"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reservations_taping_id_fkey";
            columns: ["taping_id"];
            isOneToOne: false;
            referencedRelation: "tapings";
            referencedColumns: ["id"];
          },
        ];
      };
      shift_claims: {
        Row: {
          created_at: string;
          hours: number | null;
          id: string;
          shift_id: string;
          status: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          hours?: number | null;
          id?: string;
          shift_id: string;
          status?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          hours?: number | null;
          id?: string;
          shift_id?: string;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shift_claims_shift_id_fkey";
            columns: ["shift_id"];
            isOneToOne: false;
            referencedRelation: "shifts";
            referencedColumns: ["id"];
          },
        ];
      };
      shifts: {
        Row: {
          created_at: string;
          ends_at: string;
          id: string;
          notes: string | null;
          role: string;
          slots: number;
          starts_at: string;
          taping_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          ends_at: string;
          id?: string;
          notes?: string | null;
          role: string;
          slots?: number;
          starts_at: string;
          taping_id: string;
        };
        Update: {
          created_at?: string;
          ends_at?: string;
          id?: string;
          notes?: string | null;
          role?: string;
          slots?: number;
          starts_at?: string;
          taping_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shifts_taping_id_fkey";
            columns: ["taping_id"];
            isOneToOne: false;
            referencedRelation: "tapings";
            referencedColumns: ["id"];
          },
        ];
      };
      shuttle_bookings: {
        Row: {
          arrived_at: string | null;
          created_at: string;
          direction: string;
          id: string;
          loop_time: string;
          reservation_id: string;
          running_late_at: string | null;
          seats: number;
          status: string;
          taping_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          arrived_at?: string | null;
          created_at?: string;
          direction?: string;
          id?: string;
          loop_time: string;
          reservation_id: string;
          running_late_at?: string | null;
          seats?: number;
          status?: string;
          taping_id: string;
          user_id: string;
        };
        Update: {
          arrived_at?: string | null;
          created_at?: string;
          direction?: string;
          id?: string;
          loop_time?: string;
          reservation_id?: string;
          running_late_at?: string | null;
          seats?: number;
          status?: string;
          taping_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shuttle_bookings_reservation_id_fkey";
            columns: ["reservation_id"];
            isOneToOne: false;
            referencedRelation: "reservations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shuttle_bookings_taping_id_fkey";
            columns: ["taping_id"];
            isOneToOne: false;
            referencedRelation: "tapings";
            referencedColumns: ["id"];
          },
        ];
      };
      site_settings: {
        Row: {
          giving_blurb: string | null;
          giving_check_payable_to: string | null;
          giving_enabled: boolean;
          giving_mailing_address: string | null;
          giving_online_enabled: boolean;
          giving_zelle: string | null;
          hero_headline: string;
          hero_subline: string;
          id: number;
          media_kit_path: string | null;
          merch_enabled: boolean;
          require_email_confirm: boolean;
          show_live: boolean;
          show_prayer: boolean;
          show_rent: boolean;
          show_serve: boolean;
          show_shuttle: boolean;
          show_submit: boolean;
          show_tickets: boolean;
          show_watch: boolean;
          sms_keyword: string;
          sms_number: string | null;
          substack_url: string | null;
          ticket_drop_at: string | null;
          url_facebook: string | null;
          url_instagram: string | null;
          url_nextdoor: string | null;
          url_threads: string | null;
          url_tiktok: string | null;
          url_youtube: string | null;
          weekly_position_emails: boolean;
        };
        ComputedFields: never;
        Insert: {
          giving_blurb?: string | null;
          giving_check_payable_to?: string | null;
          giving_enabled?: boolean;
          giving_mailing_address?: string | null;
          giving_online_enabled?: boolean;
          giving_zelle?: string | null;
          hero_headline?: string;
          hero_subline?: string;
          id?: number;
          media_kit_path?: string | null;
          merch_enabled?: boolean;
          require_email_confirm?: boolean;
          show_live?: boolean;
          show_prayer?: boolean;
          show_rent?: boolean;
          show_serve?: boolean;
          show_shuttle?: boolean;
          show_submit?: boolean;
          show_tickets?: boolean;
          show_watch?: boolean;
          sms_keyword?: string;
          sms_number?: string | null;
          substack_url?: string | null;
          ticket_drop_at?: string | null;
          url_facebook?: string | null;
          url_instagram?: string | null;
          url_nextdoor?: string | null;
          url_threads?: string | null;
          url_tiktok?: string | null;
          url_youtube?: string | null;
          weekly_position_emails?: boolean;
        };
        Update: {
          giving_blurb?: string | null;
          giving_check_payable_to?: string | null;
          giving_enabled?: boolean;
          giving_mailing_address?: string | null;
          giving_online_enabled?: boolean;
          giving_zelle?: string | null;
          hero_headline?: string;
          hero_subline?: string;
          id?: number;
          media_kit_path?: string | null;
          merch_enabled?: boolean;
          require_email_confirm?: boolean;
          show_live?: boolean;
          show_prayer?: boolean;
          show_rent?: boolean;
          show_serve?: boolean;
          show_shuttle?: boolean;
          show_submit?: boolean;
          show_tickets?: boolean;
          show_watch?: boolean;
          sms_keyword?: string;
          sms_number?: string | null;
          substack_url?: string | null;
          ticket_drop_at?: string | null;
          url_facebook?: string | null;
          url_instagram?: string | null;
          url_nextdoor?: string | null;
          url_threads?: string | null;
          url_tiktok?: string | null;
          url_youtube?: string | null;
          weekly_position_emails?: boolean;
        };
        Relationships: [];
      };
      sponsor_deliverables: {
        Row: {
          clip_posted: boolean;
          created_at: string;
          episode_id: string | null;
          id: string;
          logo_shown: boolean;
          mention_made: boolean;
          notes: string | null;
          sponsor_id: string;
        };
        ComputedFields: never;
        Insert: {
          clip_posted?: boolean;
          created_at?: string;
          episode_id?: string | null;
          id?: string;
          logo_shown?: boolean;
          mention_made?: boolean;
          notes?: string | null;
          sponsor_id: string;
        };
        Update: {
          clip_posted?: boolean;
          created_at?: string;
          episode_id?: string | null;
          id?: string;
          logo_shown?: boolean;
          mention_made?: boolean;
          notes?: string | null;
          sponsor_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sponsor_deliverables_episode_id_fkey";
            columns: ["episode_id"];
            isOneToOne: false;
            referencedRelation: "episodes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sponsor_deliverables_sponsor_id_fkey";
            columns: ["sponsor_id"];
            isOneToOne: false;
            referencedRelation: "sponsors";
            referencedColumns: ["id"];
          },
        ];
      };
      sponsors: {
        Row: {
          agreement_path: string | null;
          business: string;
          contact: string | null;
          created_at: string;
          email: string | null;
          end_date: string | null;
          id: string;
          package: string | null;
          price_cents: number;
          start_date: string | null;
          status: string;
        };
        ComputedFields: never;
        Insert: {
          agreement_path?: string | null;
          business: string;
          contact?: string | null;
          created_at?: string;
          email?: string | null;
          end_date?: string | null;
          id?: string;
          package?: string | null;
          price_cents?: number;
          start_date?: string | null;
          status?: string;
        };
        Update: {
          agreement_path?: string | null;
          business?: string;
          contact?: string | null;
          created_at?: string;
          email?: string | null;
          end_date?: string | null;
          id?: string;
          package?: string | null;
          price_cents?: number;
          start_date?: string | null;
          status?: string;
        };
        Relationships: [];
      };
      staff_invites: {
        Row: {
          created_at: string;
          email: string;
          role: Database["public"]["Enums"]["app_role"];
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          email: string;
          role: Database["public"]["Enums"]["app_role"];
        };
        Update: {
          created_at?: string;
          email?: string;
          role?: Database["public"]["Enums"]["app_role"];
        };
        Relationships: [];
      };
      submissions: {
        Row: {
          content: string;
          created_at: string;
          email: string;
          id: string;
          kind: string;
          name: string;
          status: string;
          taping_id: string | null;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          content: string;
          created_at?: string;
          email: string;
          id?: string;
          kind: string;
          name: string;
          status?: string;
          taping_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          content?: string;
          created_at?: string;
          email?: string;
          id?: string;
          kind?: string;
          name?: string;
          status?: string;
          taping_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "submissions_taping_id_fkey";
            columns: ["taping_id"];
            isOneToOne: false;
            referencedRelation: "tapings";
            referencedColumns: ["id"];
          },
        ];
      };
      taping_door_codes: {
        Row: {
          code: string;
          taping_id: string;
        };
        ComputedFields: never;
        Insert: {
          code?: string;
          taping_id: string;
        };
        Update: {
          code?: string;
          taping_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "taping_door_codes_taping_id_fkey";
            columns: ["taping_id"];
            isOneToOne: true;
            referencedRelation: "tapings";
            referencedColumns: ["id"];
          },
        ];
      };
      taping_feedback: {
        Row: {
          comment: string | null;
          created_at: string;
          id: string;
          rating: number;
          reservation_id: string;
          taping_id: string;
          testimonial_ok: boolean;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          rating: number;
          reservation_id: string;
          taping_id: string;
          testimonial_ok?: boolean;
          user_id: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          rating?: number;
          reservation_id?: string;
          taping_id?: string;
          testimonial_ok?: boolean;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "taping_feedback_reservation_id_fkey";
            columns: ["reservation_id"];
            isOneToOne: true;
            referencedRelation: "reservations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "taping_feedback_taping_id_fkey";
            columns: ["taping_id"];
            isOneToOne: false;
            referencedRelation: "tapings";
            referencedColumns: ["id"];
          },
        ];
      };
      taping_messages: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          taping_id: string;
        };
        ComputedFields: never;
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          taping_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          taping_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "taping_messages_taping_id_fkey";
            columns: ["taping_id"];
            isOneToOne: false;
            referencedRelation: "tapings";
            referencedColumns: ["id"];
          },
        ];
      };
      tapings: {
        Row: {
          capacity: number;
          created_at: string;
          description: string | null;
          group_enabled: boolean;
          guests: string[];
          id: string;
          overbook_pct: number;
          shuttle_end: string;
          shuttle_interval_min: number;
          shuttle_seats_per_loop: number;
          shuttle_start: string;
          sponsor_logo_url: string | null;
          sponsor_name: string | null;
          sponsor_url: string | null;
          starts_at: string;
          theme: string;
          vip_price_cents: number;
          vip_seats: number;
        };
        ComputedFields: never;
        Insert: {
          capacity?: number;
          created_at?: string;
          description?: string | null;
          group_enabled?: boolean;
          guests?: string[];
          id?: string;
          overbook_pct?: number;
          shuttle_end?: string;
          shuttle_interval_min?: number;
          shuttle_seats_per_loop?: number;
          shuttle_start?: string;
          sponsor_logo_url?: string | null;
          sponsor_name?: string | null;
          sponsor_url?: string | null;
          starts_at: string;
          theme: string;
          vip_price_cents?: number;
          vip_seats?: number;
        };
        Update: {
          capacity?: number;
          created_at?: string;
          description?: string | null;
          group_enabled?: boolean;
          guests?: string[];
          id?: string;
          overbook_pct?: number;
          shuttle_end?: string;
          shuttle_interval_min?: number;
          shuttle_seats_per_loop?: number;
          shuttle_start?: string;
          sponsor_logo_url?: string | null;
          sponsor_name?: string | null;
          sponsor_url?: string | null;
          starts_at?: string;
          theme?: string;
          vip_price_cents?: number;
          vip_seats?: number;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      volunteers: {
        Row: {
          availability: string | null;
          created_at: string;
          email: string;
          insurance_path: string | null;
          license_path: string | null;
          name: string;
          phone: string | null;
          roles: string[];
          status: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          availability?: string | null;
          created_at?: string;
          email: string;
          insurance_path?: string | null;
          license_path?: string | null;
          name: string;
          phone?: string | null;
          roles?: string[];
          status?: string;
          user_id: string;
        };
        Update: {
          availability?: string | null;
          created_at?: string;
          email?: string;
          insurance_path?: string | null;
          license_path?: string | null;
          name?: string;
          phone?: string | null;
          roles?: string[];
          status?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      waitlist: {
        Row: {
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          offered_at: string | null;
          status: string;
          taping_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          email: string;
          full_name: string;
          id?: string;
          offered_at?: string | null;
          status?: string;
          taping_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          offered_at?: string | null;
          status?: string;
          taping_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "waitlist_taping_id_fkey";
            columns: ["taping_id"];
            isOneToOne: false;
            referencedRelation: "tapings";
            referencedColumns: ["id"];
          },
        ];
      };
      waitlist_signups: {
        Row: {
          church_group: boolean;
          church_name: string | null;
          confirm_token: string;
          confirmed_at: string | null;
          created_at: string;
          email: string;
          first_name: string;
          id: string;
          import_source: string | null;
          invited_at: string | null;
          last_name: string;
          list_position: number | null;
          phone: string | null;
          referral_code: string;
          referral_count: number;
          referred_by: string | null;
          signup_order: number;
          sms_opt_in: boolean;
          source: string | null;
          status: Database["public"]["Enums"]["waitlist_status"];
          utm_campaign: string | null;
          utm_content: string | null;
          utm_medium: string | null;
          utm_source: string | null;
          utm_term: string | null;
          zip: string | null;
        };
        ComputedFields: never;
        Insert: {
          church_group?: boolean;
          church_name?: string | null;
          confirm_token?: string;
          confirmed_at?: string | null;
          created_at?: string;
          email: string;
          first_name: string;
          id?: string;
          import_source?: string | null;
          invited_at?: string | null;
          last_name: string;
          list_position?: never;
          phone?: string | null;
          referral_code: string;
          referral_count?: number;
          referred_by?: string | null;
          signup_order?: number;
          sms_opt_in?: boolean;
          source?: string | null;
          status?: Database["public"]["Enums"]["waitlist_status"];
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
          utm_term?: string | null;
          zip?: string | null;
        };
        Update: {
          church_group?: boolean;
          church_name?: string | null;
          confirm_token?: string;
          confirmed_at?: string | null;
          created_at?: string;
          email?: string;
          first_name?: string;
          id?: string;
          import_source?: string | null;
          invited_at?: string | null;
          last_name?: string;
          list_position?: never;
          phone?: string | null;
          referral_code?: string;
          referral_count?: number;
          referred_by?: string | null;
          signup_order?: number;
          sms_opt_in?: boolean;
          source?: string | null;
          status?: Database["public"]["Enums"]["waitlist_status"];
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
          utm_term?: string | null;
          zip?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "waitlist_signups_referred_by_fkey";
            columns: ["referred_by"];
            isOneToOne: false;
            referencedRelation: "waitlist_signups";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_staff: {
        Args: { _email: string; _role: Database["public"]["Enums"]["app_role"] };
        Returns: string;
      };
      block_person: {
        Args: {
          _dismissed_on?: string;
          _email: string;
          _reason: string;
          _scope: Database["public"]["Enums"]["block_scope"];
          _user_id: string;
        };
        Returns: string;
      };
      book_rental: {
        Args: {
          _addons: Json;
          _email: string;
          _end: string;
          _headcount: number;
          _name: string;
          _phone: string;
          _signature: string;
          _start: string;
          _type: string;
          _use_pack?: boolean;
        };
        Returns: Json;
      };
      book_shuttle: {
        Args: { _direction: string; _loop: string; _reservation: string };
        Returns: undefined;
      };
      buy_hour_pack: { Args: { _email: string; _name: string }; Returns: undefined };
      cancel_child: { Args: { _registration: string }; Returns: undefined };
      cancel_my_giving: { Args: { _partner: string }; Returns: undefined };
      cancel_my_rental: { Args: { _rental: string }; Returns: number };
      cancel_reservation: { Args: { _reservation: string }; Returns: undefined };
      check_in: { Args: { _code: string }; Returns: Json };
      claim_shift: { Args: { _shift: string }; Returns: undefined };
      confirm_waitlist: { Args: { p_token: string }; Returns: Json };
      decide_group_request: { Args: { _approve: boolean; _req: string }; Returns: undefined };
      door_code: { Args: { _taping: string }; Returns: string };
      effective_capacity: { Args: { _taping: string }; Returns: number };
      flagged_attendees: {
        Args: { _taping: string };
        Returns: {
          blocked: boolean;
          no_shows: number;
          reason: string;
          user_id: string;
        }[];
      };
      gen_referral_code: { Args: Record<PropertyKey, never>; Returns: string };
      gen_release_code: { Args: Record<PropertyKey, never>; Returns: string };
      get_release: { Args: { _token: string }; Returns: Json };
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"]; _user_id: string };
        Returns: boolean;
      };
      import_waitlist: { Args: { p_rows: Json; p_source: string }; Returns: Json };
      invite_top_waitlist: {
        Args: { p_count: number };
        Returns: {
          email: string;
          first_name: string;
          id: string;
          list_position: number;
          referral_code: string;
        }[];
      };
      is_admin_or_service: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_blocked: {
        Args: { _scope: Database["public"]["Enums"]["block_scope"]; _user_id: string };
        Returns: boolean;
      };
      is_staff: { Args: { _user_id: string }; Returns: boolean };
      join_volunteers: {
        Args: { _availability: string; _name: string; _phone: string; _roles: string[] };
        Returns: undefined;
      };
      join_waitlist: {
        Args: {
          p_church_group?: boolean;
          p_church_name?: string;
          p_email: string;
          p_first_name: string;
          p_last_name: string;
          p_phone?: string;
          p_ref_code?: string;
          p_sms_opt_in?: boolean;
          p_source?: string;
          p_utm_campaign?: string;
          p_utm_content?: string;
          p_utm_medium?: string;
          p_utm_source?: string;
          p_utm_term?: string;
          p_zip?: string;
        };
        Returns: Json;
      };
      kids_check_in: { Args: { _registration: string }; Returns: undefined };
      kids_check_out: {
        Args: { _code: string; _registration: string; _released_to: string };
        Returns: undefined;
      };
      kids_places_left: { Args: { _room: string }; Returns: number };
      kids_room_for_age: { Args: { _age: number; _taping: string }; Returns: string };
      kids_rooms_for_taping: {
        Args: { _taping: string };
        Returns: {
          capacity: number;
          id: string;
          max_age_years: number;
          min_age_years: number;
          name: string;
          places_left: number;
        }[];
      };
      lift_block: { Args: { _id: string; _note?: string }; Returns: undefined };
      list_staff: {
        Args: Record<PropertyKey, never>;
        Returns: {
          email: string;
          pending: boolean;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        }[];
      };
      mark_no_show: { Args: { _reservation: string; _undo?: boolean }; Returns: undefined };
      my_block_reason: {
        Args: { _scope: Database["public"]["Enums"]["block_scope"] };
        Returns: string;
      };
      my_no_show_flag: { Args: Record<PropertyKey, never>; Returns: boolean };
      no_show_count: { Args: { _user: string }; Returns: number };
      offer_open_seats: { Args: { _taping: string }; Returns: undefined };
      register_child: {
        Args: {
          _age: number;
          _allergies?: string;
          _first_name: string;
          _guardian_name: string;
          _guardian_phone: string;
          _last_name: string;
          _notes?: string;
          _reservation: string;
          _taping: string;
        };
        Returns: Json;
      };
      release_shift: { Args: { _shift: string }; Returns: undefined };
      remove_staff: { Args: { _email: string; _user: string }; Returns: undefined };
      rental_price: {
        Args: { _addons: Json; _end: string; _pack_hours?: number; _start: string; _type: string };
        Returns: Json;
      };
      reserve_seat: {
        Args: {
          _accessible?: boolean;
          _consent: boolean;
          _email: string;
          _minors?: string[];
          _name: string;
          _question: string;
          _taping: string;
        };
        Returns: Json;
      };
      seats_taken: { Args: { _taping: string }; Returns: number };
      self_check_in: { Args: { _code: string; _taping: string }; Returns: Json };
      set_sms_pref: {
        Args: { _opt: boolean; _phone: string; _reservation: string };
        Returns: undefined;
      };
      shift_openings: {
        Args: Record<PropertyKey, never>;
        Returns: {
          claimed: number;
          shift_id: string;
        }[];
      };
      shuttle_availability: {
        Args: { _taping: string };
        Returns: {
          booked: number;
          loop_time: string;
        }[];
      };
      shuttle_signal: { Args: { _booking: string; _signal: string }; Returns: undefined };
      sign_release: { Args: { _signature: string; _token: string }; Returns: undefined };
      studio_busy: {
        Args: { _from: string; _to: string };
        Returns: {
          ends_at: string;
          kind: string;
          starts_at: string;
        }[];
      };
      taping_availability: {
        Args: Record<PropertyKey, never>;
        Returns: {
          seats_left: number;
          taping_id: string;
          vip_left: number;
          waitlist_count: number;
        }[];
      };
      waitlist_stats: { Args: Record<PropertyKey, never>; Returns: Json };
    };
    Enums: {
      app_role: "admin" | "crew" | "volunteer";
      block_scope: "audience" | "volunteer" | "both";
      episode_type: "episode" | "sitdown" | "special";
      pub_book_status: "coming_soon" | "published";
      pub_category: "faith" | "history" | "christian_living";
      pub_format: "paperback" | "hardcover" | "ebook" | "audiobook";
      pub_manuscript_status: "complete" | "in_progress";
      pub_submission_status:
        | "new"
        | "reading"
        | "request_full"
        | "offer_made"
        | "declined"
        | "signed";
      ticket_type: "general" | "vip" | "group";
      waitlist_status: "waitlist" | "invited" | "ticketed";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "crew", "volunteer"],
      block_scope: ["audience", "volunteer", "both"],
      episode_type: ["episode", "sitdown", "special"],
      pub_book_status: ["coming_soon", "published"],
      pub_category: ["faith", "history", "christian_living"],
      pub_format: ["paperback", "hardcover", "ebook", "audiobook"],
      pub_manuscript_status: ["complete", "in_progress"],
      pub_submission_status: ["new", "reading", "request_full", "offer_made", "declined", "signed"],
      ticket_type: ["general", "vip", "group"],
      waitlist_status: ["waitlist", "invited", "ticketed"],
    },
  },
} as const;
