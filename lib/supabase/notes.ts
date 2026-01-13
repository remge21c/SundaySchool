/**
 * 학생 메모 API 함수
 * Supabase를 사용한 학생 메모 CRUD 작업
 */

import { supabase } from './client';
import type { Database } from '@/types/supabase';

type StudentNoteInsert = Database['public']['Tables']['student_notes']['Insert'];
type StudentNoteUpdate = Database['public']['Tables']['student_notes']['Update'];

export interface StudentNote {
  id: string;
  student_id: string;
  teacher_id: string;
  note_date: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

export interface CreateNoteInput {
  student_id: string;
  teacher_id: string;
  note_date: string;
  content: string;
}

export interface UpdateNoteInput {
  content?: string;
  note_date?: string;
}

/**
 * 학생 메모 생성
 * @param input 메모 생성 데이터
 * @returns 생성된 메모
 */
export async function createNote(input: CreateNoteInput): Promise<StudentNote> {
  const insertData: StudentNoteInsert = {
    student_id: input.student_id,
    teacher_id: input.teacher_id,
    note_date: input.note_date,
    content: input.content,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from('student_notes') as any)
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('메모 생성에 실패했습니다.');
  }

  return data as StudentNote;
}

/**
 * 학생 메모 목록 조회
 * @param studentId 학생 ID
 * @returns 메모 배열 (최신순)
 */
export async function getNotesByStudent(studentId: string): Promise<StudentNote[]> {
  // 작성자 정보(profiles)와 함께 조회
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from('student_notes') as any)
    .select(`
      *,
      profiles:teacher_id (
        id,
        email,
        full_name
      )
    `)
    .eq('student_id', studentId)
    .order('note_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as StudentNote[];
}

/**
 * 메모 업데이트
 * @param noteId 메모 ID
 * @param input 업데이트할 정보
 * @returns 업데이트된 메모
 */
export async function updateNote(
  noteId: string,
  input: UpdateNoteInput
): Promise<StudentNote> {
  const updateData: StudentNoteUpdate = {
    ...input,
    updated_at: new Date().toISOString(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from('student_notes') as any)
    .update(updateData)
    .eq('id', noteId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('메모 업데이트에 실패했습니다.');
  }

  return data as StudentNote;
}

/**
 * 메모 삭제
 * @param noteId 메모 ID
 */
export async function deleteNote(noteId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase
    .from('student_notes') as any)
    .delete()
    .eq('id', noteId);

  if (error) {
    throw error;
  }
}
