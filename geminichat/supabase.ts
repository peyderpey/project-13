export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
      ai_script_analysis: {
        Row: {
          ai_model_used: string | null
          analysis_id: string
          character_analysis: Json | null
          confidence_score: number | null
          created_at: string | null
          play_id: string
          raw_ai_response: Json | null
          scene_by_scene_analysis: Json | null
          script_summary: Json | null
          themes: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_model_used?: string | null
          analysis_id?: string
          character_analysis?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          play_id: string
          raw_ai_response?: Json | null
          scene_by_scene_analysis?: Json | null
          script_summary?: Json | null
          themes?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_model_used?: string | null
          analysis_id?: string
          character_analysis?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          play_id?: string
          raw_ai_response?: Json | null
          scene_by_scene_analysis?: Json | null
          script_summary?: Json | null
          themes?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_script_analysis_play_id_fkey"
            columns: ["play_id"]
            isOneToOne: false
            referencedRelation: "plays"
            referencedColumns: ["play_id"]
          },
        ]
      }
      character_voice_profiles: {
        Row: {
          accent: string | null
          age_group: string | null
          character_id: string
          created_at: string | null
          emotion_profile: Json | null
          gemini_tts_prompt: string | null
          gender: string | null
          play_id: string
          profile_id: string
          recommended_google_voice: Json | null
          ssml_template: string | null
          updated_at: string | null
          voice_description: string | null
        }
        Insert: {
          accent?: string | null
          age_group?: string | null
          character_id: string
          created_at?: string | null
          emotion_profile?: Json | null
          gemini_tts_prompt?: string | null
          gender?: string | null
          play_id: string
          profile_id?: string
          recommended_google_voice?: Json | null
          ssml_template?: string | null
          updated_at?: string | null
          voice_description?: string | null
        }
        Update: {
          accent?: string | null
          age_group?: string | null
          character_id?: string
          created_at?: string | null
          emotion_profile?: Json | null
          gemini_tts_prompt?: string | null
          gender?: string | null
          play_id?: string
          profile_id?: string
          recommended_google_voice?: Json | null
          ssml_template?: string | null
          updated_at?: string | null
          voice_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_voice_profiles_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["character_id"]
          },
          {
            foreignKeyName: "character_voice_profiles_play_id_fkey"
            columns: ["play_id"]
            isOneToOne: false
            referencedRelation: "plays"
            referencedColumns: ["play_id"]
          },
        ]
      }
      characters: {
        Row: {
          age_group: string | null
          character_id: string
          character_name: string
          created_at: string | null
          gender: string | null
          line_count: number | null
          play_id: string
          voice_settings: Json | null
        }
        Insert: {
          age_group?: string | null
          character_id?: string
          character_name: string
          created_at?: string | null
          gender?: string | null
          line_count?: number | null
          play_id: string
          voice_settings?: Json | null
        }
        Update: {
          age_group?: string | null
          character_id?: string
          character_name?: string
          created_at?: string | null
          gender?: string | null
          line_count?: number | null
          play_id?: string
          voice_settings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "characters_play_id_fkey"
            columns: ["play_id"]
            isOneToOne: false
            referencedRelation: "plays"
            referencedColumns: ["play_id"]
          },
          {
            foreignKeyName: "fk_characters_play_id"
            columns: ["play_id"]
            isOneToOne: false
            referencedRelation: "plays"
            referencedColumns: ["play_id"]
          },
        ]
      }
      plays: {
        Row: {
          analysis_id: string | null
          author: string | null
          created_at: string | null
          file_size: number | null
          file_type: string | null
          is_public: boolean | null
          language: string | null
          needs_reprocessing: boolean | null
          play_id: string
          script_content: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analysis_id?: string | null
          author?: string | null
          created_at?: string | null
          file_size?: number | null
          file_type?: string | null
          is_public?: boolean | null
          language?: string | null
          needs_reprocessing?: boolean | null
          play_id?: string
          script_content?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analysis_id?: string | null
          author?: string | null
          created_at?: string | null
          file_size?: number | null
          file_type?: string | null
          is_public?: boolean | null
          language?: string | null
          needs_reprocessing?: boolean | null
          play_id?: string
          script_content?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plays_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "ai_script_analysis"
            referencedColumns: ["analysis_id"]
          },
        ]
      }
      rehearsal_sessions: {
        Row: {
          accuracy_scores: Json | null
          character_name: string
          completed_lines: number[] | null
          created_at: string | null
          id: string
          play_id: string
          session_data: Json | null
          session_duration: number | null
          total_lines: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accuracy_scores?: Json | null
          character_name: string
          completed_lines?: number[] | null
          created_at?: string | null
          id?: string
          play_id: string
          session_data?: Json | null
          session_duration?: number | null
          total_lines?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accuracy_scores?: Json | null
          character_name?: string
          completed_lines?: number[] | null
          created_at?: string | null
          id?: string
          play_id?: string
          session_data?: Json | null
          session_duration?: number | null
          total_lines?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rehearsal_sessions_play_id_fkey"
            columns: ["play_id"]
            isOneToOne: false
            referencedRelation: "plays"
            referencedColumns: ["play_id"]
          },
        ]
      }
      scenes: {
        Row: {
          act_number: number | null
          created_at: string | null
          play_id: string
          scene_content: string | null
          scene_id: string
          scene_number: number
          setting: string | null
          voice_settings: Json | null
        }
        Insert: {
          act_number?: number | null
          created_at?: string | null
          play_id: string
          scene_content?: string | null
          scene_id?: string
          scene_number: number
          setting?: string | null
          voice_settings?: Json | null
        }
        Update: {
          act_number?: number | null
          created_at?: string | null
          play_id?: string
          scene_content?: string | null
          scene_id?: string
          scene_number?: number
          setting?: string | null
          voice_settings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_scenes_play_id"
            columns: ["play_id"]
            isOneToOne: false
            referencedRelation: "plays"
            referencedColumns: ["play_id"]
          },
          {
            foreignKeyName: "scenes_play_id_fkey"
            columns: ["play_id"]
            isOneToOne: false
            referencedRelation: "plays"
            referencedColumns: ["play_id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string
          is_demo_admin: boolean
          is_pro_member: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          is_demo_admin?: boolean
          is_pro_member?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          is_demo_admin?: boolean
          is_pro_member?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_scripts: {
        Row: {
          characters: Json
          content: string
          created_at: string | null
          file_size: number
          file_type: string
          id: string
          is_public: boolean | null
          lines: Json
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          characters?: Json
          content: string
          created_at?: string | null
          file_size?: number
          file_type?: string
          id?: string
          is_public?: boolean | null
          lines?: Json
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          characters?: Json
          content?: string
          created_at?: string | null
          file_size?: number
          file_type?: string
          id?: string
          is_public?: boolean | null
          lines?: Json
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          settings: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          settings?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          settings?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_id: string }
        Returns: Json
      }
      is_demo_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      mark_play_processed: {
        Args: { play_uuid: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
