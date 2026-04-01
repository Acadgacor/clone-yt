export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          youtube_video_id: string | null;
          email: string | null;
          display_name: string | null;
          photo_url: string | null;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
          youtube_video_id?: string | null;
          email?: string | null;
          display_name?: string | null;
          photo_url?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          youtube_video_id?: string | null;
          email?: string | null;
          display_name?: string | null;
          photo_url?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
