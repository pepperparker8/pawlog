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
      activity_logs: {
        Row: {
          activity: string
          cat_id: string
          client_event_id: string | null
          created_at: string
          created_by: string
          duration_min: number | null
          household_id: string
          id: string
          logged_at: string
          note: string | null
          updated_at: string
        }
        Insert: {
          activity?: string
          cat_id: string
          client_event_id?: string | null
          created_at?: string
          created_by?: string
          duration_min?: number | null
          household_id: string
          id?: string
          logged_at?: string
          note?: string | null
          updated_at?: string
        }
        Update: {
          activity?: string
          cat_id?: string
          client_event_id?: string | null
          created_at?: string
          created_by?: string
          duration_min?: number | null
          household_id?: string
          id?: string
          logged_at?: string
          note?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cat_summaries"
            referencedColumns: ["cat_id"]
          },
          {
            foreignKeyName: "activity_logs_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          cat_id: string | null
          created_at: string
          details: Json
          entity: string
          entity_id: string
          household_id: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          cat_id?: string | null
          created_at?: string
          details?: Json
          entity: string
          entity_id: string
          household_id: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          cat_id?: string | null
          created_at?: string
          details?: Json
          entity?: string
          entity_id?: string
          household_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          code: string
          criteria: Json
          description: string
          icon: string
          name: string
          retired: boolean
          scope: string
          sort_order: number
        }
        Insert: {
          code: string
          criteria: Json
          description: string
          icon?: string
          name: string
          retired?: boolean
          scope?: string
          sort_order?: number
        }
        Update: {
          code?: string
          criteria?: Json
          description?: string
          icon?: string
          name?: string
          retired?: boolean
          scope?: string
          sort_order?: number
        }
        Relationships: []
      }
      behavior_logs: {
        Row: {
          behavior: string
          cat_id: string
          client_event_id: string | null
          created_at: string
          created_by: string
          household_id: string
          id: string
          intensity: number | null
          logged_at: string
          mood: string | null
          note: string | null
          updated_at: string
        }
        Insert: {
          behavior: string
          cat_id: string
          client_event_id?: string | null
          created_at?: string
          created_by?: string
          household_id: string
          id?: string
          intensity?: number | null
          logged_at?: string
          mood?: string | null
          note?: string | null
          updated_at?: string
        }
        Update: {
          behavior?: string
          cat_id?: string
          client_event_id?: string | null
          created_at?: string
          created_by?: string
          household_id?: string
          id?: string
          intensity?: number | null
          logged_at?: string
          mood?: string | null
          note?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "behavior_logs_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cat_summaries"
            referencedColumns: ["cat_id"]
          },
          {
            foreignKeyName: "behavior_logs_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavior_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavior_logs_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      breed_weight_references: {
        Row: {
          breed_code: string
          id: string
          last_reviewed: string
          max_kg: number
          min_kg: number
          sex: string
          source: string
          source_url: string
        }
        Insert: {
          breed_code: string
          id?: string
          last_reviewed: string
          max_kg: number
          min_kg: number
          sex?: string
          source: string
          source_url: string
        }
        Update: {
          breed_code?: string
          id?: string
          last_reviewed?: string
          max_kg?: number
          min_kg?: number
          sex?: string
          source?: string
          source_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "breed_weight_references_breed_code_fkey"
            columns: ["breed_code"]
            isOneToOne: false
            referencedRelation: "breeds"
            referencedColumns: ["code"]
          },
        ]
      }
      breeds: {
        Row: {
          aliases: string[]
          care_notes: string | null
          coat: string | null
          code: string
          growth_notes: string | null
          last_reviewed: string | null
          maturity_months_max: number | null
          maturity_months_min: number | null
          maturity_notes: string | null
          name: string
          source: string | null
          source_url: string | null
        }
        Insert: {
          aliases?: string[]
          care_notes?: string | null
          coat?: string | null
          code: string
          growth_notes?: string | null
          last_reviewed?: string | null
          maturity_months_max?: number | null
          maturity_months_min?: number | null
          maturity_notes?: string | null
          name: string
          source?: string | null
          source_url?: string | null
        }
        Update: {
          aliases?: string[]
          care_notes?: string | null
          coat?: string | null
          code?: string
          growth_notes?: string | null
          last_reviewed?: string | null
          maturity_months_max?: number | null
          maturity_months_min?: number | null
          maturity_notes?: string | null
          name?: string
          source?: string | null
          source_url?: string | null
        }
        Relationships: []
      }
      care_task_completions: {
        Row: {
          cat_id: string | null
          client_event_id: string | null
          completed_at: string
          completed_by: string
          created_at: string
          household_id: string
          id: string
          note: string | null
          task_id: string
        }
        Insert: {
          cat_id?: string | null
          client_event_id?: string | null
          completed_at?: string
          completed_by?: string
          created_at?: string
          household_id: string
          id?: string
          note?: string | null
          task_id: string
        }
        Update: {
          cat_id?: string | null
          client_event_id?: string | null
          completed_at?: string
          completed_by?: string
          created_at?: string
          household_id?: string
          id?: string
          note?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_task_completions_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cat_summaries"
            referencedColumns: ["cat_id"]
          },
          {
            foreignKeyName: "care_task_completions_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_task_completions_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_task_completions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "care_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      care_tasks: {
        Row: {
          active: boolean
          assigned_to: string | null
          cat_id: string | null
          created_at: string
          created_by: string
          frequency_days: number | null
          household_id: string
          id: string
          kind: Database["public"]["Enums"]["care_task_kind"]
          name: string
          next_due_on: string | null
          reminder_enabled: boolean
          updated_at: string
        }
        Insert: {
          active?: boolean
          assigned_to?: string | null
          cat_id?: string | null
          created_at?: string
          created_by?: string
          frequency_days?: number | null
          household_id: string
          id?: string
          kind?: Database["public"]["Enums"]["care_task_kind"]
          name: string
          next_due_on?: string | null
          reminder_enabled?: boolean
          updated_at?: string
        }
        Update: {
          active?: boolean
          assigned_to?: string | null
          cat_id?: string | null
          created_at?: string
          created_by?: string
          frequency_days?: number | null
          household_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["care_task_kind"]
          name?: string
          next_due_on?: string | null
          reminder_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_tasks_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cat_summaries"
            referencedColumns: ["cat_id"]
          },
          {
            foreignKeyName: "care_tasks_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_tasks_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      care_tips: {
        Row: {
          active: boolean
          audience: Json
          body: string
          code: string
          icon: string | null
          kind: string
          reviewed: string
          source: string
          source_url: string
          title: string
          topic: string
          trigger: string | null
        }
        Insert: {
          active?: boolean
          audience?: Json
          body: string
          code: string
          icon?: string | null
          kind: string
          reviewed: string
          source: string
          source_url: string
          title: string
          topic: string
          trigger?: string | null
        }
        Update: {
          active?: boolean
          audience?: Json
          body?: string
          code?: string
          icon?: string | null
          kind?: string
          reviewed?: string
          source?: string
          source_url?: string
          title?: string
          topic?: string
          trigger?: string | null
        }
        Relationships: []
      }
      cat_conditions: {
        Row: {
          cat_id: string
          created_at: string
          created_by: string
          household_id: string
          id: string
          name: string
          noted_on: string | null
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          cat_id: string
          created_at?: string
          created_by?: string
          household_id: string
          id?: string
          name: string
          noted_on?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          cat_id?: string
          created_at?: string
          created_by?: string
          household_id?: string
          id?: string
          name?: string
          noted_on?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cat_conditions_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cat_summaries"
            referencedColumns: ["cat_id"]
          },
          {
            foreignKeyName: "cat_conditions_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cat_conditions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cat_conditions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      cat_favorites: {
        Row: {
          cat_id: string
          user_id: string
        }
        Insert: {
          cat_id: string
          user_id: string
        }
        Update: {
          cat_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cat_favorites_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cat_summaries"
            referencedColumns: ["cat_id"]
          },
          {
            foreignKeyName: "cat_favorites_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cat_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cat_medications: {
        Row: {
          active: boolean
          cat_id: string
          created_at: string
          created_by: string
          dose: string | null
          end_on: string | null
          frequency: string | null
          household_id: string
          id: string
          name: string
          reason: string | null
          start_on: string | null
          times_per_day: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          cat_id: string
          created_at?: string
          created_by?: string
          dose?: string | null
          end_on?: string | null
          frequency?: string | null
          household_id: string
          id?: string
          name: string
          reason?: string | null
          start_on?: string | null
          times_per_day?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          cat_id?: string
          created_at?: string
          created_by?: string
          dose?: string | null
          end_on?: string | null
          frequency?: string | null
          household_id?: string
          id?: string
          name?: string
          reason?: string | null
          start_on?: string | null
          times_per_day?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cat_medications_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cat_summaries"
            referencedColumns: ["cat_id"]
          },
          {
            foreignKeyName: "cat_medications_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cat_medications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cat_medications_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      cat_stats: {
        Row: {
          cat_id: string
          household_id: string
          level: number
          streak_best: number
          streak_current: number
          streak_last_on: string | null
          total_xp: number
          updated_at: string
        }
        Insert: {
          cat_id: string
          household_id: string
          level?: number
          streak_best?: number
          streak_current?: number
          streak_last_on?: string | null
          total_xp?: number
          updated_at?: string
        }
        Update: {
          cat_id?: string
          household_id?: string
          level?: number
          streak_best?: number
          streak_current?: number
          streak_last_on?: string | null
          total_xp?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cat_stats_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: true
            referencedRelation: "cat_summaries"
            referencedColumns: ["cat_id"]
          },
          {
            foreignKeyName: "cat_stats_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: true
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cat_stats_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      cat_weight_targets: {
        Row: {
          archived_at: string | null
          cat_id: string
          created_at: string
          created_by: string
          household_id: string
          id: string
          max_kg: number | null
          min_kg: number | null
          note: string | null
          set_on: string
          source: string
          target_kg: number | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          cat_id: string
          created_at?: string
          created_by?: string
          household_id: string
          id?: string
          max_kg?: number | null
          min_kg?: number | null
          note?: string | null
          set_on?: string
          source: string
          target_kg?: number | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          cat_id?: string
          created_at?: string
          created_by?: string
          household_id?: string
          id?: string
          max_kg?: number | null
          min_kg?: number | null
          note?: string | null
          set_on?: string
          source?: string
          target_kg?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cat_weight_targets_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cat_summaries"
            referencedColumns: ["cat_id"]
          },
          {
            foreignKeyName: "cat_weight_targets_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cat_weight_targets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cat_weight_targets_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      cats: {
        Row: {
          adopted_on: string | null
          allergies: string | null
          archived_at: string | null
          blood_type: string | null
          breed: string | null
          breed_code: string | null
          clinic_name: string | null
          clinic_phone: string | null
          color: string | null
          created_at: string
          created_by: string
          date_of_birth: string | null
          deceased_on: string | null
          dob_is_estimate: boolean
          emergency_notes: string | null
          household_id: string
          id: string
          known_conditions: string | null
          microchip_id: string | null
          name: string
          neutered: boolean | null
          nickname: string | null
          profile_photo_id: string | null
          sex: Database["public"]["Enums"]["cat_sex"]
          updated_at: string
          vet_name: string | null
        }
        Insert: {
          adopted_on?: string | null
          allergies?: string | null
          archived_at?: string | null
          blood_type?: string | null
          breed?: string | null
          breed_code?: string | null
          clinic_name?: string | null
          clinic_phone?: string | null
          color?: string | null
          created_at?: string
          created_by?: string
          date_of_birth?: string | null
          deceased_on?: string | null
          dob_is_estimate?: boolean
          emergency_notes?: string | null
          household_id: string
          id?: string
          known_conditions?: string | null
          microchip_id?: string | null
          name: string
          neutered?: boolean | null
          nickname?: string | null
          profile_photo_id?: string | null
          sex?: Database["public"]["Enums"]["cat_sex"]
          updated_at?: string
          vet_name?: string | null
        }
        Update: {
          adopted_on?: string | null
          allergies?: string | null
          archived_at?: string | null
          blood_type?: string | null
          breed?: string | null
          breed_code?: string | null
          clinic_name?: string | null
          clinic_phone?: string | null
          color?: string | null
          created_at?: string
          created_by?: string
          date_of_birth?: string | null
          deceased_on?: string | null
          dob_is_estimate?: boolean
          emergency_notes?: string | null
          household_id?: string
          id?: string
          known_conditions?: string | null
          microchip_id?: string | null
          name?: string
          neutered?: boolean | null
          nickname?: string | null
          profile_photo_id?: string | null
          sex?: Database["public"]["Enums"]["cat_sex"]
          updated_at?: string
          vet_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cats_breed_code_fkey"
            columns: ["breed_code"]
            isOneToOne: false
            referencedRelation: "breeds"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "cats_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cats_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cats_profile_photo_fk"
            columns: ["profile_photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      feeding_logs: {
        Row: {
          amount: number | null
          appetite: number | null
          cat_id: string
          client_event_id: string | null
          created_at: string
          created_by: string
          estimated_kcal: number | null
          food_id: string | null
          food_name: string | null
          household_id: string
          id: string
          logged_at: string
          note: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          appetite?: number | null
          cat_id: string
          client_event_id?: string | null
          created_at?: string
          created_by?: string
          estimated_kcal?: number | null
          food_id?: string | null
          food_name?: string | null
          household_id: string
          id?: string
          logged_at?: string
          note?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          appetite?: number | null
          cat_id?: string
          client_event_id?: string | null
          created_at?: string
          created_by?: string
          estimated_kcal?: number | null
          food_id?: string | null
          food_name?: string | null
          household_id?: string
          id?: string
          logged_at?: string
          note?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feeding_logs_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cat_summaries"
            referencedColumns: ["cat_id"]
          },
          {
            foreignKeyName: "feeding_logs_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feeding_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feeding_logs_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "food_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feeding_logs_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      feeding_plans: {
        Row: {
          active: boolean
          amount_g: number | null
          cat_id: string
          created_at: string
          food_id: string | null
          household_id: string
          id: string
          notes: string | null
          times_per_day: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          amount_g?: number | null
          cat_id: string
          created_at?: string
          food_id?: string | null
          household_id: string
          id?: string
          notes?: string | null
          times_per_day?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          amount_g?: number | null
          cat_id?: string
          created_at?: string
          food_id?: string | null
          household_id?: string
          id?: string
          notes?: string | null
          times_per_day?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feeding_plans_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cat_summaries"
            referencedColumns: ["cat_id"]
          },
          {
            foreignKeyName: "feeding_plans_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feeding_plans_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "food_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feeding_plans_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      food_profiles: {
        Row: {
          archived_at: string | null
          brand: string | null
          created_at: string
          created_by: string
          fat_pct: number | null
          household_id: string
          id: string
          kcal_per_100g: number | null
          moisture_pct: number | null
          product: string
          protein_pct: number | null
          serving_size_g: number | null
          type: Database["public"]["Enums"]["food_type"]
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          brand?: string | null
          created_at?: string
          created_by?: string
          fat_pct?: number | null
          household_id: string
          id?: string
          kcal_per_100g?: number | null
          moisture_pct?: number | null
          product: string
          protein_pct?: number | null
          serving_size_g?: number | null
          type?: Database["public"]["Enums"]["food_type"]
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          brand?: string | null
          created_at?: string
          created_by?: string
          fat_pct?: number | null
          household_id?: string
          id?: string
          kcal_per_100g?: number | null
          moisture_pct?: number | null
          product?: string
          protein_pct?: number | null
          serving_size_g?: number | null
          type?: Database["public"]["Enums"]["food_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_profiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_profiles_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      grooming_logs: {
        Row: {
          cat_id: string
          client_event_id: string | null
          coat_condition: string | null
          created_at: string
          created_by: string
          duration_min: number | null
          household_id: string
          id: string
          logged_at: string
          note: string | null
          type: string
          updated_at: string
        }
        Insert: {
          cat_id: string
          client_event_id?: string | null
          coat_condition?: string | null
          created_at?: string
          created_by?: string
          duration_min?: number | null
          household_id: string
          id?: string
          logged_at?: string
          note?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          cat_id?: string
          client_event_id?: string | null
          coat_condition?: string | null
          created_at?: string
          created_by?: string
          duration_min?: number | null
          household_id?: string
          id?: string
          logged_at?: string
          note?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grooming_logs_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cat_summaries"
            referencedColumns: ["cat_id"]
          },
          {
            foreignKeyName: "grooming_logs_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grooming_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grooming_logs_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          created_by: string
          email: string
          expires_at: string
          household_id: string
          id: string
          role: Database["public"]["Enums"]["household_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string
          email: string
          expires_at?: string
          household_id: string
          id?: string
          role?: Database["public"]["Enums"]["household_role"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string
          email?: string
          expires_at?: string
          household_id?: string
          id?: string
          role?: Database["public"]["Enums"]["household_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "household_invites_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_members: {
        Row: {
          household_id: string
          joined_at: string
          role: Database["public"]["Enums"]["household_role"]
          user_id: string
        }
        Insert: {
          household_id: string
          joined_at?: string
          role?: Database["public"]["Enums"]["household_role"]
          user_id: string
        }
        Update: {
          household_id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["household_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "household_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      household_stats: {
        Row: {
          household_id: string
          level: number
          streak_best: number
          streak_current: number
          streak_last_on: string | null
          total_xp: number
          updated_at: string
        }
        Insert: {
          household_id: string
          level?: number
          streak_best?: number
          streak_current?: number
          streak_last_on?: string | null
          total_xp?: number
          updated_at?: string
        }
        Update: {
          household_id?: string
          level?: number
          streak_best?: number
          streak_current?: number
          streak_last_on?: string | null
          total_xp?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_stats_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: true
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "households_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          body: string
          cat_id: string | null
          client_event_id: string | null
          created_at: string
          created_by: string
          household_id: string
          id: string
          logged_at: string
          title: string | null
          updated_at: string
        }
        Insert: {
          body: string
          cat_id?: string | null
          client_event_id?: string | null
          created_at?: string
          created_by?: string
          household_id: string
          id?: string
          logged_at?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          cat_id?: string | null
          client_event_id?: string | null
          created_at?: string
          created_by?: string
          household_id?: string
          id?: string
          logged_at?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cat_summaries"
            referencedColumns: ["cat_id"]
          },
          {
            foreignKeyName: "journal_entries_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_articles: {
        Row: {
          active: boolean
          audience: Json
          body_md: string
          category: string
          icon: string | null
          read_minutes: number
          reviewed: string
          slug: string
          sort_order: number
          sources: Json
          summary: string
          title: string
          urgent: boolean
        }
        Insert: {
          active?: boolean
          audience?: Json
          body_md: string
          category: string
          icon?: string | null
          read_minutes?: number
          reviewed: string
          slug: string
          sort_order?: number
          sources?: Json
          summary: string
          title: string
          urgent?: boolean
        }
        Update: {
          active?: boolean
          audience?: Json
          body_md?: string
          category?: string
          icon?: string | null
          read_minutes?: number
          reviewed?: string
          slug?: string
          sort_order?: number
          sources?: Json
          summary?: string
          title?: string
          urgent?: boolean
        }
        Relationships: []
      }
      level_config: {
        Row: {
          level: number
          min_xp: number
          perk: string | null
          title: string
        }
        Insert: {
          level: number
          min_xp: number
          perk?: string | null
          title: string
        }
        Update: {
          level?: number
          min_xp?: number
          perk?: string | null
          title?: string
        }
        Relationships: []
      }
      litter_logs: {
        Row: {
          action: string
          cat_id: string
          client_event_id: string | null
          created_at: string
          created_by: string
          household_id: string
          id: string
          logged_at: string
          note: string | null
          stool: string | null
          updated_at: string
          urine: string | null
        }
        Insert: {
          action?: string
          cat_id: string
          client_event_id?: string | null
          created_at?: string
          created_by?: string
          household_id: string
          id?: string
          logged_at?: string
          note?: string | null
          stool?: string | null
          updated_at?: string
          urine?: string | null
        }
        Update: {
          action?: string
          cat_id?: string
          client_event_id?: string | null
          created_at?: string
          created_by?: string
          household_id?: string
          id?: string
          logged_at?: string
          note?: string | null
          stool?: string | null
          updated_at?: string
          urine?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "litter_logs_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cat_summaries"
            referencedColumns: ["cat_id"]
          },
          {
            foreignKeyName: "litter_logs_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "litter_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "litter_logs_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_logs: {
        Row: {
          cat_id: string
          cat_medication_id: string | null
          client_event_id: string | null
          created_at: string
          created_by: string
          dose: string | null
          household_id: string
          id: string
          logged_at: string
          medication_name: string | null
          note: string | null
          skipped: boolean
          updated_at: string
        }
        Insert: {
          cat_id: string
          cat_medication_id?: string | null
          client_event_id?: string | null
          created_at?: string
          created_by?: string
          dose?: string | null
          household_id: string
          id?: string
          logged_at?: string
          medication_name?: string | null
          note?: string | null
          skipped?: boolean
          updated_at?: string
        }
        Update: {
          cat_id?: string
          cat_medication_id?: string | null
          client_event_id?: string | null
          created_at?: string
          created_by?: string
          dose?: string | null
          household_id?: string
          id?: string
          logged_at?: string
          medication_name?: string | null
          note?: string | null
          skipped?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_logs_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cat_summaries"
            referencedColumns: ["cat_id"]
          },
          {
            foreignKeyName: "medication_logs_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_logs_cat_medication_id_fkey"
            columns: ["cat_medication_id"]
            isOneToOne: false
            referencedRelation: "cat_medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_logs_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          archived_at: string | null
          cat_id: string
          code: string
          household_id: string
          id: string
          label: string
          reached_at: string
        }
        Insert: {
          archived_at?: string | null
          cat_id: string
          code: string
          household_id: string
          id?: string
          label: string
          reached_at?: string
        }
        Update: {
          archived_at?: string | null
          cat_id?: string
          code?: string
          household_id?: string
          id?: string
          label?: string
          reached_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cat_summaries"
            referencedColumns: ["cat_id"]
          },
          {
            foreignKeyName: "milestones_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          gamification: boolean
          household_activity: boolean
          patterns: boolean
          quiet_from: string | null
          quiet_to: string | null
          reminders: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          gamification?: boolean
          household_activity?: boolean
          patterns?: boolean
          quiet_from?: string | null
          quiet_to?: string | null
          reminders?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          gamification?: boolean
          household_activity?: boolean
          patterns?: boolean
          quiet_from?: string | null
          quiet_to?: string | null
          reminders?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          cat_id: string | null
          created_at: string
          household_id: string
          id: string
          kind: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          cat_id?: string | null
          created_at?: string
          household_id: string
          id?: string
          kind: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          cat_id?: string | null
          created_at?: string
          household_id?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cat_summaries"
            referencedColumns: ["cat_id"]
          },
          {
            foreignKeyName: "notifications_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parasite_treatments: {
        Row: {
          cat_id: string
          client_event_id: string | null
          created_at: string
          created_by: string
          given_on: string
          household_id: string
          id: string
          kind: Database["public"]["Enums"]["parasite_kind"]
          next_due_on: string | null
          note: string | null
          product: string | null
          updated_at: string
        }
        Insert: {
          cat_id: string
          client_event_id?: string | null
          created_at?: string
          created_by?: string
          given_on: string
          household_id: string
          id?: string
          kind: Database["public"]["Enums"]["parasite_kind"]
          next_due_on?: string | null
          note?: string | null
          product?: string | null
          updated_at?: string
        }
        Update: {
          cat_id?: string
          client_event_id?: string | null
          created_at?: string
          created_by?: string
          given_on?: string
          household_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["parasite_kind"]
          next_due_on?: string | null
          note?: string | null
          product?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parasite_treatments_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cat_summaries"
            referencedColumns: ["cat_id"]
          },
          {
            foreignKeyName: "parasite_treatments_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parasite_treatments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parasite_treatments_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          bytes: number | null
          caption: string | null
          cat_id: string
          client_event_id: string | null
          created_at: string
          created_by: string
          height: number | null
          household_id: string
          id: string
          is_favorite: boolean
          linked_id: string | null
          linked_table: string | null
          medium_path: string | null
          storage_path: string
          tags: string[]
          taken_at: string
          thumbnail_path: string | null
          updated_at: string
          uploaded_at: string
          width: number | null
        }
        Insert: {
          bytes?: number | null
          caption?: string | null
          cat_id: string
          client_event_id?: string | null
          created_at?: string
          created_by?: string
          height?: number | null
          household_id: string
          id?: string
          is_favorite?: boolean
          linked_id?: string | null
          linked_table?: string | null
          medium_path?: string | null
          storage_path: string
          tags?: string[]
          taken_at?: string
          thumbnail_path?: string | null
          updated_at?: string
          uploaded_at?: string
          width?: number | null
        }
        Update: {
          bytes?: number | null
          caption?: string | null
          cat_id?: string
          client_event_id?: string | null
          created_at?: string
          created_by?: string
          height?: number | null
          household_id?: string
          id?: string
          is_favorite?: boolean
          linked_id?: string | null
          linked_table?: string | null
          medium_path?: string | null
          storage_path?: string
          tags?: string[]
          taken_at?: string
          thumbnail_path?: string | null
          updated_at?: string
          uploaded_at?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cat_summaries"
            referencedColumns: ["cat_id"]
          },
          {
            foreignKeyName: "photos_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          display_name: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      quest_completions: {
        Row: {
          completed_at: string
          household_id: string
          id: string
          quest_code: string
          quest_date: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          household_id: string
          id?: string
          quest_code: string
          quest_date: string
          user_id: string
        }
        Update: {
          completed_at?: string
          household_id?: string
          id?: string
          quest_code?: string
          quest_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_completions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_completions_quest_code_fkey"
            columns: ["quest_code"]
            isOneToOne: false
            referencedRelation: "quest_templates"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "quest_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_templates: {
        Row: {
          active: boolean
          code: string
          description: string
          event_type: string
          per_cat: boolean
          target: number
          title: string
          weekday_mask: number
          xp_reward: number
        }
        Insert: {
          active?: boolean
          code: string
          description: string
          event_type: string
          per_cat?: boolean
          target?: number
          title: string
          weekday_mask?: number
          xp_reward?: number
        }
        Update: {
          active?: boolean
          code?: string
          description?: string
          event_type?: string
          per_cat?: boolean
          target?: number
          title?: string
          weekday_mask?: number
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "quest_templates_event_type_fkey"
            columns: ["event_type"]
            isOneToOne: false
            referencedRelation: "xp_rules"
            referencedColumns: ["event_type"]
          },
        ]
      }
      symptom_logs: {
        Row: {
          cat_id: string
          client_event_id: string | null
          created_at: string
          created_by: string
          ended_on: string | null
          frequency: string | null
          household_id: string
          id: string
          logged_at: string
          note: string | null
          related_medication_id: string | null
          severity: Database["public"]["Enums"]["symptom_severity"]
          started_on: string | null
          symptom: string
          updated_at: string
          vet_visit_id: string | null
        }
        Insert: {
          cat_id: string
          client_event_id?: string | null
          created_at?: string
          created_by?: string
          ended_on?: string | null
          frequency?: string | null
          household_id: string
          id?: string
          logged_at?: string
          note?: string | null
          related_medication_id?: string | null
          severity?: Database["public"]["Enums"]["symptom_severity"]
          started_on?: string | null
          symptom: string
          updated_at?: string
          vet_visit_id?: string | null
        }
        Update: {
          cat_id?: string
          client_event_id?: string | null
          created_at?: string
          created_by?: string
          ended_on?: string | null
          frequency?: string | null
          household_id?: string
          id?: string
          logged_at?: string
          note?: string | null
          related_medication_id?: string | null
          severity?: Database["public"]["Enums"]["symptom_severity"]
          started_on?: string | null
          symptom?: string
          updated_at?: string
          vet_visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "symptom_logs_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cat_summaries"
            referencedColumns: ["cat_id"]
          },
          {
            foreignKeyName: "symptom_logs_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "symptom_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "symptom_logs_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "symptom_logs_related_medication_id_fkey"
            columns: ["related_medication_id"]
            isOneToOne: false
            referencedRelation: "cat_medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "symptom_logs_vet_visit_id_fkey"
            columns: ["vet_visit_id"]
            isOneToOne: false
            referencedRelation: "vet_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_code: string
          cat_id: string
          earned_at: string
          household_id: string
          user_id: string
        }
        Insert: {
          badge_code: string
          cat_id?: string
          earned_at?: string
          household_id?: string
          user_id: string
        }
        Update: {
          badge_code?: string
          cat_id?: string
          earned_at?: string
          household_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_code_fkey"
            columns: ["badge_code"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          freezes_left: number
          level: number
          streak_best: number
          streak_current: number
          streak_last_on: string | null
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          freezes_left?: number
          level?: number
          streak_best?: number
          streak_current?: number
          streak_last_on?: string | null
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          freezes_left?: number
          level?: number
          streak_best?: number
          streak_current?: number
          streak_last_on?: string | null
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccination_records: {
        Row: {
          batch_no: string | null
          cat_id: string
          client_event_id: string | null
          clinic: string | null
          created_at: string
          created_by: string
          given_on: string
          household_id: string
          id: string
          next_due_on: string | null
          note: string | null
          updated_at: string
          vaccine_name: string
          vet_visit_id: string | null
        }
        Insert: {
          batch_no?: string | null
          cat_id: string
          client_event_id?: string | null
          clinic?: string | null
          created_at?: string
          created_by?: string
          given_on: string
          household_id: string
          id?: string
          next_due_on?: string | null
          note?: string | null
          updated_at?: string
          vaccine_name: string
          vet_visit_id?: string | null
        }
        Update: {
          batch_no?: string | null
          cat_id?: string
          client_event_id?: string | null
          clinic?: string | null
          created_at?: string
          created_by?: string
          given_on?: string
          household_id?: string
          id?: string
          next_due_on?: string | null
          note?: string | null
          updated_at?: string
          vaccine_name?: string
          vet_visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vaccination_records_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cat_summaries"
            referencedColumns: ["cat_id"]
          },
          {
            foreignKeyName: "vaccination_records_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccination_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccination_records_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccination_records_vet_visit_id_fkey"
            columns: ["vet_visit_id"]
            isOneToOne: false
            referencedRelation: "vet_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      vet_visits: {
        Row: {
          cat_id: string
          client_event_id: string | null
          clinic: string | null
          cost: number | null
          created_at: string
          created_by: string
          currency: string | null
          findings: string | null
          follow_up_on: string | null
          household_id: string
          id: string
          note: string | null
          reason: string | null
          updated_at: string
          vet_name: string | null
          visited_on: string
        }
        Insert: {
          cat_id: string
          client_event_id?: string | null
          clinic?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string
          currency?: string | null
          findings?: string | null
          follow_up_on?: string | null
          household_id: string
          id?: string
          note?: string | null
          reason?: string | null
          updated_at?: string
          vet_name?: string | null
          visited_on: string
        }
        Update: {
          cat_id?: string
          client_event_id?: string | null
          clinic?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string
          currency?: string | null
          findings?: string | null
          follow_up_on?: string | null
          household_id?: string
          id?: string
          note?: string | null
          reason?: string | null
          updated_at?: string
          vet_name?: string | null
          visited_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "vet_visits_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cat_summaries"
            referencedColumns: ["cat_id"]
          },
          {
            foreignKeyName: "vet_visits_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_visits_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_visits_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      water_logs: {
        Row: {
          action: string
          amount_ml: number | null
          cat_id: string
          client_event_id: string | null
          created_at: string
          created_by: string
          household_id: string
          id: string
          logged_at: string
          note: string | null
          updated_at: string
        }
        Insert: {
          action?: string
          amount_ml?: number | null
          cat_id: string
          client_event_id?: string | null
          created_at?: string
          created_by?: string
          household_id: string
          id?: string
          logged_at?: string
          note?: string | null
          updated_at?: string
        }
        Update: {
          action?: string
          amount_ml?: number | null
          cat_id?: string
          client_event_id?: string | null
          created_at?: string
          created_by?: string
          household_id?: string
          id?: string
          logged_at?: string
          note?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "water_logs_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cat_summaries"
            referencedColumns: ["cat_id"]
          },
          {
            foreignKeyName: "water_logs_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "water_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "water_logs_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_quest_completions: {
        Row: {
          cat_id: string
          completed_at: string
          household_id: string
          id: string
          quest_code: string
          user_id: string
          week_start: string
        }
        Insert: {
          cat_id: string
          completed_at?: string
          household_id: string
          id?: string
          quest_code: string
          user_id: string
          week_start: string
        }
        Update: {
          cat_id?: string
          completed_at?: string
          household_id?: string
          id?: string
          quest_code?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_quest_completions_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cat_summaries"
            referencedColumns: ["cat_id"]
          },
          {
            foreignKeyName: "weekly_quest_completions_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_quest_completions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_quest_completions_quest_code_fkey"
            columns: ["quest_code"]
            isOneToOne: false
            referencedRelation: "weekly_quest_templates"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "weekly_quest_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_quest_templates: {
        Row: {
          active: boolean
          coat_targets: Json
          code: string
          description: string
          event_type: string
          icon: string
          sort_order: number
          target: number
          title: string
          xp_reward: number
        }
        Insert: {
          active?: boolean
          coat_targets?: Json
          code: string
          description: string
          event_type: string
          icon: string
          sort_order?: number
          target?: number
          title: string
          xp_reward?: number
        }
        Update: {
          active?: boolean
          coat_targets?: Json
          code?: string
          description?: string
          event_type?: string
          icon?: string
          sort_order?: number
          target?: number
          title?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "weekly_quest_templates_event_type_fkey"
            columns: ["event_type"]
            isOneToOne: false
            referencedRelation: "xp_rules"
            referencedColumns: ["event_type"]
          },
        ]
      }
      weight_logs: {
        Row: {
          body_condition_score: number | null
          body_condition_source: string | null
          cat_id: string
          client_event_id: string | null
          created_at: string
          created_by: string
          household_id: string
          id: string
          logged_at: string
          note: string | null
          updated_at: string
          weight_kg: number
        }
        Insert: {
          body_condition_score?: number | null
          body_condition_source?: string | null
          cat_id: string
          client_event_id?: string | null
          created_at?: string
          created_by?: string
          household_id: string
          id?: string
          logged_at?: string
          note?: string | null
          updated_at?: string
          weight_kg: number
        }
        Update: {
          body_condition_score?: number | null
          body_condition_source?: string | null
          cat_id?: string
          client_event_id?: string | null
          created_at?: string
          created_by?: string
          household_id?: string
          id?: string
          logged_at?: string
          note?: string | null
          updated_at?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "weight_logs_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cat_summaries"
            referencedColumns: ["cat_id"]
          },
          {
            foreignKeyName: "weight_logs_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weight_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weight_logs_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_rules: {
        Row: {
          active: boolean
          daily_cap: number
          event_type: string
          full_per_day: number
          label: string
          window_minutes: number
          xp: number
        }
        Insert: {
          active?: boolean
          daily_cap?: number
          event_type: string
          full_per_day?: number
          label: string
          window_minutes?: number
          xp: number
        }
        Update: {
          active?: boolean
          daily_cap?: number
          event_type?: string
          full_per_day?: number
          label?: string
          window_minutes?: number
          xp?: number
        }
        Relationships: []
      }
      xp_transactions: {
        Row: {
          cat_id: string | null
          client_event_id: string | null
          created_at: string
          event_type: string
          household_id: string
          id: string
          reason: string | null
          source_id: string | null
          source_table: string | null
          user_id: string
          xp: number
        }
        Insert: {
          cat_id?: string | null
          client_event_id?: string | null
          created_at?: string
          event_type: string
          household_id: string
          id?: string
          reason?: string | null
          source_id?: string | null
          source_table?: string | null
          user_id: string
          xp: number
        }
        Update: {
          cat_id?: string | null
          client_event_id?: string | null
          created_at?: string
          event_type?: string
          household_id?: string
          id?: string
          reason?: string | null
          source_id?: string | null
          source_table?: string | null
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "xp_transactions_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cat_summaries"
            referencedColumns: ["cat_id"]
          },
          {
            foreignKeyName: "xp_transactions_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xp_transactions_event_type_fkey"
            columns: ["event_type"]
            isOneToOne: false
            referencedRelation: "xp_rules"
            referencedColumns: ["event_type"]
          },
          {
            foreignKeyName: "xp_transactions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xp_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      cat_summaries: {
        Row: {
          active_medications: number | null
          archived_at: string | null
          breed: string | null
          cat_id: string | null
          color: string | null
          date_of_birth: string | null
          dob_is_estimate: boolean | null
          household_id: string | null
          last_fed_at: string | null
          last_grooming_at: string | null
          last_litter_at: string | null
          last_medication_at: string | null
          last_symptom_at: string | null
          last_weight_at: string | null
          last_weight_kg: number | null
          level: number | null
          name: string | null
          next_parasite_due: string | null
          next_task_due: string | null
          next_vaccine_due: string | null
          nickname: string | null
          photo_count: number | null
          profile_photo_id: string | null
          profile_photo_path: string | null
          profile_thumbnail_path: string | null
          sex: Database["public"]["Enums"]["cat_sex"] | null
          streak_current: number | null
          symptoms_7d: number | null
          total_xp: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cats_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cats_profile_photo_fk"
            columns: ["profile_photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_events: {
        Row: {
          cat_id: string | null
          created_at: string | null
          created_by: string | null
          data: Json | null
          detail: string | null
          household_id: string | null
          id: string | null
          kind: string | null
          occurred_at: string | null
          title: string | null
        }
        Relationships: []
      }
      weight_weekly: {
        Row: {
          avg_kg: number | null
          cat_id: string | null
          household_id: string | null
          max_kg: number | null
          min_kg: number | null
          samples: number | null
          week_start: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weight_logs_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cat_summaries"
            referencedColumns: ["cat_id"]
          },
          {
            foreignKeyName: "weight_logs_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weight_logs_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_invite: {
        Args: { p_token: string }
        Returns: {
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "households"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      award_xp: {
        Args: {
          p_at?: string
          p_cat: string
          p_client_event_id: string
          p_event_type: string
          p_household: string
          p_source_id: string
          p_source_table: string
          p_user: string
        }
        Returns: number
      }
      bump_streak: {
        Args: {
          p_current: number
          p_freezes: number
          p_last: string
          p_today: string
        }
        Returns: Record<string, unknown>
      }
      can_edit_household: { Args: { hid: string }; Returns: boolean }
      care_rhythm: {
        Args: { p_household: string; p_weeks?: number }
        Returns: {
          cat_id: string
          goals_done: number
          goals_total: number
          week_start: string
        }[]
      }
      check_badges: {
        Args: { p_cat: string; p_household: string; p_user: string }
        Returns: string[]
      }
      complete_quests: {
        Args: { p_date: string; p_household: string; p_user: string }
        Returns: string[]
      }
      complete_weekly_quests: {
        Args: {
          p_cat: string
          p_household: string
          p_user: string
          p_week: string
        }
        Returns: string[]
      }
      create_household: {
        Args: { p_name: string }
        Returns: {
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "households"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      detect_patterns: {
        Args: { p_household: string }
        Returns: {
          cat_id: string
          cat_name: string
          code: string
          detail: string
          severity: string
          since: string
          title: string
        }[]
      }
      household_role_of: {
        Args: { hid: string }
        Returns: Database["public"]["Enums"]["household_role"]
      }
      household_today: { Args: { p_household: string }; Returns: Json }
      is_household_member: { Args: { hid: string }; Returns: boolean }
      is_household_owner: { Args: { hid: string }; Returns: boolean }
      level_for_xp: { Args: { p_xp: number }; Returns: number }
      my_household_ids: { Args: never; Returns: string[] }
      notify_household: {
        Args: {
          p_body: string
          p_cat: string
          p_household: string
          p_kind: string
          p_link: string
          p_only_user?: string
          p_title: string
        }
        Returns: undefined
      }
      on_this_day: {
        Args: { p_household: string }
        Returns: {
          cat_id: string | null
          created_at: string | null
          created_by: string | null
          data: Json | null
          detail: string | null
          household_id: string | null
          id: string | null
          kind: string | null
          occurred_at: string | null
          title: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "timeline_events"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      quest_progress: {
        Args: { p_date?: string; p_household: string }
        Returns: {
          completed: boolean
          description: string
          done: number
          quest_code: string
          target: number
          title: string
          xp_reward: number
        }[]
      }
      refill_streak_freezes: { Args: never; Returns: undefined }
      search_household: {
        Args: { p_household: string; p_query: string }
        Returns: {
          cat_id: string
          id: string
          kind: string
          occurred_at: string
          snippet: string
          title: string
        }[]
      }
      seed_demo_household: { Args: { p_name?: string }; Returns: string }
      sweep_reminders: { Args: never; Returns: number }
      week_start_of: { Args: { p_at: string }; Returns: string }
      weekly_quest_progress: {
        Args: { p_household: string; p_week?: string }
        Returns: {
          cat_id: string
          cat_name: string
          completed: boolean
          description: string
          done: number
          icon: string
          quest_code: string
          target: number
          title: string
          xp_reward: number
        }[]
      }
    }
    Enums: {
      care_task_kind:
        | "flea_tick"
        | "deworming"
        | "grooming"
        | "nail_trim"
        | "vaccination"
        | "vet_visit"
        | "dental"
        | "medication"
        | "custom"
      cat_sex: "male" | "female" | "unknown"
      food_type: "dry" | "wet" | "raw" | "treat" | "supplement" | "other"
      household_role: "owner" | "caregiver" | "viewer"
      parasite_kind: "flea_tick" | "deworming" | "heartworm" | "other"
      symptom_severity: "mild" | "moderate" | "severe"
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
      care_task_kind: [
        "flea_tick",
        "deworming",
        "grooming",
        "nail_trim",
        "vaccination",
        "vet_visit",
        "dental",
        "medication",
        "custom",
      ],
      cat_sex: ["male", "female", "unknown"],
      food_type: ["dry", "wet", "raw", "treat", "supplement", "other"],
      household_role: ["owner", "caregiver", "viewer"],
      parasite_kind: ["flea_tick", "deworming", "heartworm", "other"],
      symptom_severity: ["mild", "moderate", "severe"],
    },
  },
} as const
