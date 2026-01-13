/**
 * 학생 관련 TypeScript 타입 정의
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Student {
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
}

export interface GetStudentsParams {
  class_id?: string;
  is_active?: boolean;
  search?: string; // 이름 검색
}

export interface StudentWithAttendance extends Student {
  attendance?: {
    status: 'present' | 'absent' | 'late';
    reason: string | null;
  };
}
