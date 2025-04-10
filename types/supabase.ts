export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      applications: {
        Row: {
          id: string
          user_id: string
          company: string
          position: string
          location: string | null
          status: string
          date_applied: string
          notes: string | null
          link: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          company: string
          position: string
          location?: string | null
          status: string
          date_applied: string
          notes?: string | null
          link?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          company?: string
          position?: string
          location?: string | null
          status?: string
          date_applied?: string
          notes?: string | null
          link?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          id: string
          user_id: string
          role: string
          content: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          role: string
          content: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          content?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          name: string | null
          email: string | null
          preferred_role: string | null
          location: string | null
          bio: string | null
          skills: string | null
          imported_from: string | null
          last_optimized: string | null
        }
        Insert: {
          id: string
          name?: string | null
          email?: string | null
          preferred_role?: string | null
          location?: string | null
          bio?: string | null
          skills?: string | null
          imported_from?: string | null
          last_optimized?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          preferred_role?: string | null
          location?: string | null
          bio?: string | null
          skills?: string | null
          imported_from?: string | null
          last_optimized?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_versions: {
        Row: {
          id: string
          profile_id: string
          name: string | null
          preferred_role: string | null
          location: string | null
          bio: string | null
          skills: string | null
          created_at: string | null
          created_by: string
          version_notes: string | null
        }
        Insert: {
          id?: string
          profile_id: string
          name?: string | null
          preferred_role?: string | null
          location?: string | null
          bio?: string | null
          skills?: string | null
          created_at?: string | null
          created_by?: string
          version_notes?: string | null
        }
        Update: {
          id?: string
          profile_id?: string
          name?: string | null
          preferred_role?: string | null
          location?: string | null
          bio?: string | null
          skills?: string | null
          created_at?: string | null
          created_by?: string
          version_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_versions_profile_id_fkey"
            columns: ["profile_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          id: string
          user_id: string
          file_name: string
          file_url: string
          file_type: string
          file_size: number
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          file_name: string
          file_url: string
          file_type: string
          file_size: number
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          file_name?: string
          file_url?: string
          file_type?: string
          file_size?: number
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resumes_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
