export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          date_of_birth: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          is_platform_admin: boolean;
          preferences: Json;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          date_of_birth?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          is_platform_admin?: boolean;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          date_of_birth?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          is_platform_admin?: boolean;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      guardian_links: {
        Row: {
          id: string;
          guardian_id: string;
          ward_id: string;
          relationship: "parent" | "guardian";
          created_at: string;
        };
        Insert: {
          id?: string;
          guardian_id: string;
          ward_id: string;
          relationship: "parent" | "guardian";
          created_at?: string;
        };
        Update: {
          id?: string;
          guardian_id?: string;
          ward_id?: string;
          relationship?: "parent" | "guardian";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "guardian_links_guardian_id_fkey";
            columns: ["guardian_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "guardian_links_ward_id_fkey";
            columns: ["ward_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tenants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          primary_color: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          address: string | null;
          timezone: string;
          currency: string;
          settings: Json;
          status: Database["public"]["Enums"]["tenant_status"];
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          primary_color?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          address?: string | null;
          timezone?: string;
          currency?: string;
          settings?: Json;
          status?: Database["public"]["Enums"]["tenant_status"];
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          primary_color?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          address?: string | null;
          timezone?: string;
          currency?: string;
          settings?: Json;
          status?: Database["public"]["Enums"]["tenant_status"];
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      tenant_members: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["tenant_role"];
          status: Database["public"]["Enums"]["member_status"];
          invited_by: string | null;
          joined_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["tenant_role"];
          status?: Database["public"]["Enums"]["member_status"];
          invited_by?: string | null;
          joined_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["tenant_role"];
          status?: Database["public"]["Enums"]["member_status"];
          invited_by?: string | null;
          joined_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tenant_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tenant_members_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tenant_invites: {
        Row: {
          id: string;
          tenant_id: string;
          email: string;
          role: Database["public"]["Enums"]["tenant_role"];
          token: string;
          expires_at: string;
          accepted_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          email: string;
          role: Database["public"]["Enums"]["tenant_role"];
          token?: string;
          expires_at: string;
          accepted_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          email?: string;
          role?: Database["public"]["Enums"]["tenant_role"];
          token?: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_invites_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tenant_invites_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      venues: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          slug: string;
          description: string | null;
          address_line1: string;
          address_line2: string | null;
          city: string;
          state: string | null;
          postal_code: string | null;
          country: string;
          latitude: number | null;
          longitude: number | null;
          phone: string | null;
          email: string | null;
          amenities: Json;
          images: Json;
          is_published: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          slug: string;
          description?: string | null;
          address_line1: string;
          address_line2?: string | null;
          city: string;
          state?: string | null;
          postal_code?: string | null;
          country?: string;
          latitude?: number | null;
          longitude?: number | null;
          phone?: string | null;
          email?: string | null;
          amenities?: Json;
          images?: Json;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          address_line1?: string;
          address_line2?: string | null;
          city?: string;
          state?: string | null;
          postal_code?: string | null;
          country?: string;
          latitude?: number | null;
          longitude?: number | null;
          phone?: string | null;
          email?: string | null;
          amenities?: Json;
          images?: Json;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "venues_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      resources: {
        Row: {
          id: string;
          tenant_id: string;
          venue_id: string;
          name: string;
          sport_type: Database["public"]["Enums"]["sport_type"];
          resource_subtype: string | null;
          capacity: number;
          surface_type: string | null;
          is_indoor: boolean;
          sort_order: number;
          metadata: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          venue_id: string;
          name: string;
          sport_type: Database["public"]["Enums"]["sport_type"];
          resource_subtype?: string | null;
          capacity?: number;
          surface_type?: string | null;
          is_indoor?: boolean;
          sort_order?: number;
          metadata?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          venue_id?: string;
          name?: string;
          sport_type?: Database["public"]["Enums"]["sport_type"];
          resource_subtype?: string | null;
          capacity?: number;
          surface_type?: string | null;
          is_indoor?: boolean;
          sort_order?: number;
          metadata?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "resources_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "resources_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
        ];
      };
      operating_hours: {
        Row: {
          id: string;
          tenant_id: string;
          venue_id: string | null;
          resource_id: string | null;
          day_of_week: number;
          open_time: string;
          close_time: string;
          is_closed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          venue_id?: string | null;
          resource_id?: string | null;
          day_of_week: number;
          open_time: string;
          close_time: string;
          is_closed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          venue_id?: string | null;
          resource_id?: string | null;
          day_of_week?: number;
          open_time?: string;
          close_time?: string;
          is_closed?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operating_hours_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operating_hours_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operating_hours_resource_id_fkey";
            columns: ["resource_id"];
            isOneToOne: false;
            referencedRelation: "resources";
            referencedColumns: ["id"];
          },
        ];
      };
      blackout_periods: {
        Row: {
          id: string;
          tenant_id: string;
          venue_id: string;
          resource_id: string | null;
          start_time: string;
          end_time: string;
          reason: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          venue_id: string;
          resource_id?: string | null;
          start_time: string;
          end_time: string;
          reason?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          venue_id?: string;
          resource_id?: string | null;
          start_time?: string;
          end_time?: string;
          reason?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blackout_periods_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blackout_periods_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blackout_periods_resource_id_fkey";
            columns: ["resource_id"];
            isOneToOne: false;
            referencedRelation: "resources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blackout_periods_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      bookings: {
        Row: {
          id: string;
          tenant_id: string;
          venue_id: string;
          resource_id: string;
          user_id: string;
          booked_by: string | null;
          sport_type: Database["public"]["Enums"]["sport_type"];
          start_time: string;
          end_time: string;
          status: Database["public"]["Enums"]["booking_status"];
          payment_status: Database["public"]["Enums"]["payment_status"];
          amount: number;
          currency: string;
          notes: string | null;
          cancellation_reason: string | null;
          cancelled_at: string | null;
          recurring_group_id: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          venue_id: string;
          resource_id: string;
          user_id: string;
          booked_by?: string | null;
          sport_type: Database["public"]["Enums"]["sport_type"];
          start_time: string;
          end_time: string;
          status?: Database["public"]["Enums"]["booking_status"];
          payment_status?: Database["public"]["Enums"]["payment_status"];
          amount: number;
          currency?: string;
          notes?: string | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          recurring_group_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          venue_id?: string;
          resource_id?: string;
          user_id?: string;
          booked_by?: string | null;
          sport_type?: Database["public"]["Enums"]["sport_type"];
          start_time?: string;
          end_time?: string;
          status?: Database["public"]["Enums"]["booking_status"];
          payment_status?: Database["public"]["Enums"]["payment_status"];
          amount?: number;
          currency?: string;
          notes?: string | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          recurring_group_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_resource_id_fkey";
            columns: ["resource_id"];
            isOneToOne: false;
            referencedRelation: "resources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_booked_by_fkey";
            columns: ["booked_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      slot_holds: {
        Row: {
          id: string;
          tenant_id: string;
          resource_id: string;
          user_id: string;
          start_time: string;
          end_time: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          resource_id: string;
          user_id: string;
          start_time: string;
          end_time: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          resource_id?: string;
          user_id?: string;
          start_time?: string;
          end_time?: string;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "slot_holds_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "slot_holds_resource_id_fkey";
            columns: ["resource_id"];
            isOneToOne: false;
            referencedRelation: "resources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "slot_holds_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      waitlist_entries: {
        Row: {
          id: string;
          tenant_id: string;
          resource_id: string;
          user_id: string;
          desired_start: string;
          desired_end: string;
          status: Database["public"]["Enums"]["waitlist_status"];
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          resource_id: string;
          user_id: string;
          desired_start: string;
          desired_end: string;
          status?: Database["public"]["Enums"]["waitlist_status"];
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          resource_id?: string;
          user_id?: string;
          desired_start?: string;
          desired_end?: string;
          status?: Database["public"]["Enums"]["waitlist_status"];
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "waitlist_entries_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "waitlist_entries_resource_id_fkey";
            columns: ["resource_id"];
            isOneToOne: false;
            referencedRelation: "resources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "waitlist_entries_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      pricing_rules: {
        Row: {
          id: string;
          tenant_id: string;
          venue_id: string | null;
          resource_id: string | null;
          sport_type: Database["public"]["Enums"]["sport_type"] | null;
          name: string;
          day_of_week: number[];
          start_time: string | null;
          end_time: string | null;
          price_per_slot: number;
          slot_duration_minutes: number;
          priority: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          venue_id?: string | null;
          resource_id?: string | null;
          sport_type?: Database["public"]["Enums"]["sport_type"] | null;
          name: string;
          day_of_week?: number[];
          start_time?: string | null;
          end_time?: string | null;
          price_per_slot: number;
          slot_duration_minutes: number;
          priority?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          venue_id?: string | null;
          resource_id?: string | null;
          sport_type?: Database["public"]["Enums"]["sport_type"] | null;
          name?: string;
          day_of_week?: number[];
          start_time?: string | null;
          end_time?: string | null;
          price_per_slot?: number;
          slot_duration_minutes?: number;
          priority?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pricing_rules_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pricing_rules_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pricing_rules_resource_id_fkey";
            columns: ["resource_id"];
            isOneToOne: false;
            referencedRelation: "resources";
            referencedColumns: ["id"];
          },
        ];
      };
      membership_packages: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          description: string | null;
          credits: number | null;
          discount_percent: number | null;
          valid_days: number;
          price: number;
          sport_types: Database["public"]["Enums"]["sport_type"][];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          description?: string | null;
          credits?: number | null;
          discount_percent?: number | null;
          valid_days: number;
          price: number;
          sport_types?: Database["public"]["Enums"]["sport_type"][];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          description?: string | null;
          credits?: number | null;
          discount_percent?: number | null;
          valid_days?: number;
          price?: number;
          sport_types?: Database["public"]["Enums"]["sport_type"][];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "membership_packages_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      user_packages: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          package_id: string;
          credits_remaining: number | null;
          expires_at: string;
          purchased_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          package_id: string;
          credits_remaining?: number | null;
          expires_at: string;
          purchased_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          package_id?: string;
          credits_remaining?: number | null;
          expires_at?: string;
          purchased_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_packages_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_packages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_packages_package_id_fkey";
            columns: ["package_id"];
            isOneToOne: false;
            referencedRelation: "membership_packages";
            referencedColumns: ["id"];
          },
        ];
      };
      promo_codes: {
        Row: {
          id: string;
          tenant_id: string;
          code: string;
          discount_type: Database["public"]["Enums"]["discount_type"];
          discount_value: number;
          max_uses: number | null;
          uses_count: number;
          valid_from: string | null;
          valid_until: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          code: string;
          discount_type: Database["public"]["Enums"]["discount_type"];
          discount_value: number;
          max_uses?: number | null;
          uses_count?: number;
          valid_from?: string | null;
          valid_until?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          code?: string;
          discount_type?: Database["public"]["Enums"]["discount_type"];
          discount_value?: number;
          max_uses?: number | null;
          uses_count?: number;
          valid_from?: string | null;
          valid_until?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "promo_codes_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      academy_programs: {
        Row: {
          id: string;
          tenant_id: string;
          venue_id: string;
          name: string;
          slug: string;
          academy_type: Database["public"]["Enums"]["academy_type"];
          description: string | null;
          images: Json;
          is_published: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          venue_id: string;
          name: string;
          slug: string;
          academy_type: Database["public"]["Enums"]["academy_type"];
          description?: string | null;
          images?: Json;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          venue_id?: string;
          name?: string;
          slug?: string;
          academy_type?: Database["public"]["Enums"]["academy_type"];
          description?: string | null;
          images?: Json;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "academy_programs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "academy_programs_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
        ];
      };
      batches: {
        Row: {
          id: string;
          tenant_id: string;
          program_id: string;
          name: string;
          age_group_min: number | null;
          age_group_max: number | null;
          skill_level: "beginner" | "intermediate" | "advanced" | null;
          capacity: number;
          fee_amount: number | null;
          fee_period: "monthly" | "quarterly" | "annual" | null;
          schedule: Json;
          start_date: string;
          end_date: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          program_id: string;
          name: string;
          age_group_min?: number | null;
          age_group_max?: number | null;
          skill_level?: "beginner" | "intermediate" | "advanced" | null;
          capacity: number;
          fee_amount?: number | null;
          fee_period?: "monthly" | "quarterly" | "annual" | null;
          schedule?: Json;
          start_date: string;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          program_id?: string;
          name?: string;
          age_group_min?: number | null;
          age_group_max?: number | null;
          skill_level?: "beginner" | "intermediate" | "advanced" | null;
          capacity?: number;
          fee_amount?: number | null;
          fee_period?: "monthly" | "quarterly" | "annual" | null;
          schedule?: Json;
          start_date?: string;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "batches_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "batches_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "academy_programs";
            referencedColumns: ["id"];
          },
        ];
      };
      batch_coaches: {
        Row: {
          id: string;
          batch_id: string;
          coach_id: string;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          batch_id: string;
          coach_id: string;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          batch_id?: string;
          coach_id?: string;
          is_primary?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "batch_coaches_batch_id_fkey";
            columns: ["batch_id"];
            isOneToOne: false;
            referencedRelation: "batches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "batch_coaches_coach_id_fkey";
            columns: ["coach_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      batch_sessions: {
        Row: {
          id: string;
          tenant_id: string;
          batch_id: string;
          session_date: string;
          start_time: string;
          end_time: string;
          resource_id: string | null;
          status: "scheduled" | "completed" | "cancelled";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          batch_id: string;
          session_date: string;
          start_time: string;
          end_time: string;
          resource_id?: string | null;
          status?: "scheduled" | "completed" | "cancelled";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          batch_id?: string;
          session_date?: string;
          start_time?: string;
          end_time?: string;
          resource_id?: string | null;
          status?: "scheduled" | "completed" | "cancelled";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "batch_sessions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "batch_sessions_batch_id_fkey";
            columns: ["batch_id"];
            isOneToOne: false;
            referencedRelation: "batches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "batch_sessions_resource_id_fkey";
            columns: ["resource_id"];
            isOneToOne: false;
            referencedRelation: "resources";
            referencedColumns: ["id"];
          },
        ];
      };
      enrollments: {
        Row: {
          id: string;
          tenant_id: string;
          batch_id: string;
          student_id: string;
          enrolled_by: string | null;
          status: Database["public"]["Enums"]["enrollment_status"];
          enrolled_at: string;
          completed_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          batch_id: string;
          student_id: string;
          enrolled_by?: string | null;
          status?: Database["public"]["Enums"]["enrollment_status"];
          enrolled_at?: string;
          completed_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          batch_id?: string;
          student_id?: string;
          enrolled_by?: string | null;
          status?: Database["public"]["Enums"]["enrollment_status"];
          enrolled_at?: string;
          completed_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "enrollments_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_batch_id_fkey";
            columns: ["batch_id"];
            isOneToOne: false;
            referencedRelation: "batches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_enrolled_by_fkey";
            columns: ["enrolled_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      attendance_records: {
        Row: {
          id: string;
          tenant_id: string;
          session_id: string;
          student_id: string;
          status: Database["public"]["Enums"]["attendance_status"];
          marked_by: string | null;
          marked_at: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          session_id: string;
          student_id: string;
          status: Database["public"]["Enums"]["attendance_status"];
          marked_by?: string | null;
          marked_at?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          session_id?: string;
          student_id?: string;
          status?: Database["public"]["Enums"]["attendance_status"];
          marked_by?: string | null;
          marked_at?: string;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_records_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_records_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "batch_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_records_marked_by_fkey";
            columns: ["marked_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      sport_templates: {
        Row: {
          id: string;
          sport_type: Database["public"]["Enums"]["sport_type"];
          display_name: string;
          resource_label: string;
          default_slot_minutes: number;
          icon_name: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          sport_type: Database["public"]["Enums"]["sport_type"];
          display_name: string;
          resource_label: string;
          default_slot_minutes: number;
          icon_name?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          sport_type?: Database["public"]["Enums"]["sport_type"];
          display_name?: string;
          resource_label?: string;
          default_slot_minutes?: number;
          icon_name?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      academy_templates: {
        Row: {
          id: string;
          academy_type: Database["public"]["Enums"]["academy_type"];
          display_name: string;
          default_batch_duration_minutes: number | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          academy_type: Database["public"]["Enums"]["academy_type"];
          display_name: string;
          default_batch_duration_minutes?: number | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          academy_type?: Database["public"]["Enums"]["academy_type"];
          display_name?: string;
          default_batch_duration_minutes?: number | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          tenant_id: string | null;
          type: string;
          title: string;
          body: string | null;
          data: Json;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tenant_id?: string | null;
          type: string;
          title: string;
          body?: string | null;
          data?: Json;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tenant_id?: string | null;
          type?: string;
          title?: string;
          body?: string | null;
          data?: Json;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          tenant_id: string | null;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          old_values: Json | null;
          new_values: Json | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          actor_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_logs_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_booking: {
        Args: {
          p_resource_id: string;
          p_start_time: string;
          p_end_time: string;
          p_user_id: string;
          p_hold_id?: string;
          p_amount?: number;
          p_currency?: string;
          p_notes?: string;
          p_booked_by?: string;
        };
        Returns: Database["public"]["Tables"]["bookings"]["Row"];
      };
      cancel_booking: {
        Args: {
          p_booking_id: string;
          p_reason?: string;
        };
        Returns: Database["public"]["Tables"]["bookings"]["Row"];
      };
      create_enrollment: {
        Args: {
          p_batch_id: string;
          p_student_id: string;
          p_enrolled_by?: string;
        };
        Returns: Database["public"]["Tables"]["enrollments"]["Row"];
      };
      expire_slot_holds: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      accept_tenant_invite: {
        Args: {
          p_token: string;
        };
        Returns: string;
      };
    };
    Enums: {
      sport_type:
        | "football"
        | "cricket"
        | "cricket_nets"
        | "pickleball"
        | "badminton"
        | "tennis"
        | "squash"
        | "basketball"
        | "volleyball"
        | "swimming";
      academy_type:
        | "running_academy"
        | "football_academy"
        | "cricket_academy"
        | "tennis_academy"
        | "swimming_academy"
        | "badminton_academy";
      tenant_role:
        | "owner"
        | "admin"
        | "manager"
        | "staff"
        | "coach"
        | "member";
      booking_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "no_show";
      enrollment_status:
        | "pending"
        | "active"
        | "suspended"
        | "completed"
        | "cancelled";
      member_status: "active" | "invited" | "suspended";
      payment_status: "unpaid" | "paid" | "refunded" | "partial";
      waitlist_status: "waiting" | "notified" | "expired" | "fulfilled";
      attendance_status: "present" | "absent" | "late" | "excused";
      tenant_status: "active" | "suspended";
      discount_type: "percentage" | "fixed";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never;
