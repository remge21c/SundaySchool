// 이 파일은 Supabase CLI로 자동 생성됩니다
// 명령어: npx supabase gen types typescript --project-id <project-id> > types/supabase.ts

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
      profiles: {
        Row: {
          id: string;
          email: string;
          role: 'admin' | 'teacher' | 'parent';
          full_name: string | null;
          phone_number: string | null;
          department_id: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role: 'admin' | 'teacher' | 'parent';
          full_name?: string | null;
          phone_number?: string | null;
          department_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'admin' | 'teacher' | 'parent';
          full_name?: string | null;
          phone_number?: string | null;
          department_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      students: {
        Row: {
          id: string;
          name: string;
          birthday: string | null;
          gender: string | null;
          school_name: string | null;
          grade: number;
          parent_contact: string;
          address: string | null;
          allergies: Json | null;
          is_active: boolean;
          class_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          birthday?: string | null;
          gender?: string | null;
          school_name?: string | null;
          grade: number;
          parent_contact: string;
          address?: string | null;
          allergies?: Json | null;
          is_active?: boolean;
          class_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          birthday?: string | null;
          gender?: string | null;
          school_name?: string | null;
          grade?: number;
          parent_contact?: string;
          address?: string | null;
          allergies?: Json | null;
          is_active?: boolean;
          class_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      classes: {
        Row: {
          id: string;
          name: string;
          department: string;
          year: number;
          main_teacher_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          department: string;
          year: number;
          main_teacher_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          department?: string;
          year?: number;
          main_teacher_id?: string;
          created_at?: string;
        };
      };
      attendance_logs: {
        Row: {
          id: string;
          student_id: string;
          class_id: string;
          date: string;
          status: 'present' | 'absent' | 'late';
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          class_id: string;
          date: string;
          status: 'present' | 'absent' | 'late';
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          class_id?: string;
          date?: string;
          status?: 'present' | 'absent' | 'late';
          reason?: string | null;
          created_at?: string;
        };
      };
      visitation_logs: {
        Row: {
          id: string;
          student_id: string;
          teacher_id: string;
          visit_date: string;
          type: 'call' | 'visit' | 'kakao';
          content: string;
          prayer_request: string | null;
          is_confidential: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          teacher_id: string;
          visit_date: string;
          type: 'call' | 'visit' | 'kakao';
          content: string;
          prayer_request?: string | null;
          is_confidential?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          teacher_id?: string;
          visit_date?: string;
          type?: 'call' | 'visit' | 'kakao';
          content?: string;
          prayer_request?: string | null;
          is_confidential?: boolean;
          created_at?: string;
        };
      };
      talent_transactions: {
        Row: {
          id: string;
          student_id: string;
          amount: number;
          category: '출석' | '암송' | '마켓사용';
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          amount: number;
          category: '출석' | '암송' | '마켓사용';
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          amount?: number;
          category?: '출석' | '암송' | '마켓사용';
          created_at?: string;
        };
      };
      student_notes: {
        Row: {
          id: string;
          student_id: string;
          teacher_id: string;
          note_date: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          teacher_id: string;
          note_date: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          teacher_id?: string;
          note_date?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      app_settings: {
        Row: {
          id: string;
          app_name: string;
          description: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          app_name: string;
          description?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          app_name?: string;
          description?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
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
  };
}
