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
      episodes: {
        Row: {
          aired_on: string
          created_at: string
          description: string | null
          guests: string[]
          id: string
          kind: Database["public"]["Enums"]["episode_type"]
          slug: string
          tags: string[]
          thumbnail: string | null
          title: string
          youtube_url: string | null
        }
        Insert: {
          aired_on?: string
          created_at?: string
          description?: string | null
          guests?: string[]
          id?: string
          kind?: Database["public"]["Enums"]["episode_type"]
          slug: string
          tags?: string[]
          thumbnail?: string | null
          title: string
          youtube_url?: string | null
        }
        Update: {
          aired_on?: string
          created_at?: string
          description?: string | null
          guests?: string[]
          id?: string
          kind?: Database["public"]["Enums"]["episode_type"]
          slug?: string
          tags?: string[]
          thumbnail?: string | null
          title?: string
          youtube_url?: string | null
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
      reservations: {
        Row: {
          checked_in_at: string | null
          created_at: string
          email: string
          filming_consent: boolean
          full_name: string
          id: string
          qr_code: string
          question: string | null
          seats: number
          status: string
          taping_id: string
          ticket_type: Database["public"]["Enums"]["ticket_type"]
          user_id: string
        }
        Insert: {
          checked_in_at?: string | null
          created_at?: string
          email: string
          filming_consent: boolean
          full_name: string
          id?: string
          qr_code?: string
          question?: string | null
          seats?: number
          status?: string
          taping_id: string
          ticket_type?: Database["public"]["Enums"]["ticket_type"]
          user_id: string
        }
        Update: {
          checked_in_at?: string | null
          created_at?: string
          email?: string
          filming_consent?: boolean
          full_name?: string
          id?: string
          qr_code?: string
          question?: string | null
          seats?: number
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
      tapings: {
        Row: {
          capacity: number
          created_at: string
          description: string | null
          group_enabled: boolean
          guests: string[]
          id: string
          shuttle_end: string
          shuttle_interval_min: number
          shuttle_seats_per_loop: number
          shuttle_start: string
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
          shuttle_end?: string
          shuttle_interval_min?: number
          shuttle_seats_per_loop?: number
          shuttle_start?: string
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
          shuttle_end?: string
          shuttle_interval_min?: number
          shuttle_seats_per_loop?: number
          shuttle_start?: string
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
      book_shuttle: {
        Args: { _direction: string; _loop: string; _reservation: string }
        Returns: undefined
      }
      cancel_reservation: { Args: { _reservation: string }; Returns: undefined }
      check_in: { Args: { _code: string }; Returns: Json }
      decide_group_request: {
        Args: { _approve: boolean; _req: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      offer_open_seats: { Args: { _taping: string }; Returns: undefined }
      reserve_seat: {
        Args: {
          _consent: boolean
          _email: string
          _name: string
          _question: string
          _taping: string
        }
        Returns: Json
      }
      seats_taken: { Args: { _taping: string }; Returns: number }
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
      app_role: "admin" | "crew"
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
      app_role: ["admin", "crew"],
      episode_type: ["episode", "sitdown", "special"],
      ticket_type: ["general", "vip", "group"],
    },
  },
} as const
