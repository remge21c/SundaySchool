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
  __InternalSupabase: {
    BroadcastPayload: Record<string, unknown>;
    PostgrestError: unknown;
  };
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
          photo_url: string | null;
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
          photo_url?: string | null;
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
          photo_url?: string | null;
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
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          department: string;
          year: number;
          main_teacher_id: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          department?: string;
          year?: number;
          main_teacher_id?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      class_assignments: {
        Row: {
          id: string;
          student_id: string;
          class_id: string;
          year: number;
          start_date: string;
          end_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          class_id: string;
          year: number;
          start_date: string;
          end_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          class_id?: string;
          year?: number;
          start_date?: string;
          end_date?: string | null;
          created_at?: string;
        };
      };
      student_grade_history: {
        Row: {
          id: string;
          student_id: string;
          year: number;
          grade: number;
          school_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          year: number;
          grade: number;
          school_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          year?: number;
          grade?: number;
          school_name?: string | null;
          created_at?: string;
        };
      };
      temp_class_assignments: {
        Row: {
          id: string;
          student_id: string;
          class_id: string;
          year: number;
          assigned_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          class_id: string;
          year: number;
          assigned_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          class_id?: string;
          year?: number;
          assigned_by?: string | null;
          created_at?: string;
        };
      };
      year_transition_log: {
        Row: {
          id: string;
          from_year: number;
          to_year: number;
          status: 'pending' | 'in_progress' | 'completed' | 'failed';
          classes_created: number;
          students_assigned: number;
          executed_by: string | null;
          executed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          from_year: number;
          to_year: number;
          status?: 'pending' | 'in_progress' | 'completed' | 'failed';
          classes_created?: number;
          students_assigned?: number;
          executed_by?: string | null;
          executed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          from_year?: number;
          to_year?: number;
          status?: 'pending' | 'in_progress' | 'completed' | 'failed';
          classes_created?: number;
          students_assigned?: number;
          executed_by?: string | null;
          executed_at?: string | null;
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
