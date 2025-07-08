import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types - removed users table since we're using auth.users
export interface Database {
  public: {
    Tables: {
      plays: {
        Row: {
          play_id: string;
          user_id: string;
          title: string;
          author: string | null;
          language: string | null;
          script_content: string | null;
          file_type: string;
          file_size: number;
          is_public: boolean;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          play_id?: string;
          user_id: string;
          title: string;
          author?: string | null;
          language?: string | null;
          script_content?: string | null;
          file_type?: string;
          file_size?: number;
          is_public?: boolean;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          play_id?: string;
          user_id?: string;
          title?: string;
          author?: string | null;
          language?: string | null;
          script_content?: string | null;
          file_type?: string;
          file_size?: number;
          is_public?: boolean;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      characters: {
        Row: {
          character_id: string;
          play_id: string;
          character_name: string;
          gender: string | null; // Fixed: changed from 'genre' to 'gender'
          age_group: string | null;
          line_count: number;
          voice_settings: any; // Added: voice_settings column
          created_at: string;
        };
        Insert: {
          character_id?: string;
          play_id: string;
          character_name: string;
          gender?: string | null; // Fixed: changed from 'genre' to 'gender'
          age_group?: string | null;
          line_count?: number;
          voice_settings?: any; // Added: voice_settings column
          created_at?: string;
        };
        Update: {
          character_id?: string;
          play_id?: string;
          character_name?: string;
          gender?: string | null; // Fixed: changed from 'genre' to 'gender'
          age_group?: string | null;
          line_count?: number;
          voice_settings?: any; // Added: voice_settings column
          created_at?: string;
        };
      };
      scenes: {
        Row: {
          scene_id: string;
          play_id: string;
          scene_number: number;
          scene_content: string | null;
          setting: string | null;
          act_number: number;
          voice_settings: any;
          created_at: string;
        };
        Insert: {
          scene_id?: string;
          play_id: string;
          scene_number: number;
          scene_content?: string | null;
          setting?: string | null;
          act_number?: number;
          voice_settings?: any;
          created_at?: string;
        };
        Update: {
          scene_id?: string;
          play_id?: string;
          scene_number?: number;
          scene_content?: string | null;
          setting?: string | null;
          act_number?: number;
          voice_settings?: any;
          created_at?: string;
        };
      };
      rehearsal_sessions: {
        Row: {
          id: string;
          user_id: string;
          play_id: string;
          character_name: string;
          session_data: any;
          accuracy_scores: any;
          completed_lines: number[];
          total_lines: number;
          session_duration: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          play_id: string;
          character_name: string;
          session_data?: any;
          accuracy_scores?: any;
          completed_lines?: number[];
          total_lines?: number;
          session_duration?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          play_id?: string;
          character_name?: string;
          session_data?: any;
          accuracy_scores?: any;
          completed_lines?: number[];
          total_lines?: number;
          session_duration?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          settings: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          settings?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          settings?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}