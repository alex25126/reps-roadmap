import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      exercises: {
        Row: {
          id: string
          name: string
          muscle_group: string
          sets: number
          reps: number
          weight: number | null
          day: string
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          muscle_group: string
          sets: number
          reps: number
          weight?: number | null
          day: string
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          muscle_group?: string
          sets?: number
          reps?: number
          weight?: number | null
          day?: string
          created_at?: string
          user_id?: string
        }
      }
      progress_logs: {
        Row: {
          id: string
          date: string
          muscle_group: string
          weight: number | null
          reps: number | null
          notes: string | null
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          date: string
          muscle_group: string
          weight?: number | null
          reps?: number | null
          notes?: string | null
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          date?: string
          muscle_group?: string
          weight?: number | null
          reps?: number | null
          notes?: string | null
          created_at?: string
          user_id?: string
        }
      }
    }
  }
}