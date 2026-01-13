/**
 * 관리자 전용 API 함수
 * 관리자만 사용할 수 있는 기능들
 */

import { supabase } from './client';
import type { Class } from '@/types/class';

/**
 * 교사 목록 조회 (관리자 전용)
 * @returns 교사 프로필 배열
 */
export async function getAllTeachers() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await ((supabase
    .from('profiles') as any)
    .select('id, email, full_name, role, created_at')
    .eq('role', 'teacher')
    .order('full_name', { ascending: true }));

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * 반 생성 (관리자 전용)
 * @param input 반 정보
 * @returns 생성된 반 정보
 */
export async function createClass(input: {
  name: string;
  department: string;
  year: number;
  main_teacher_id: string | null;
}): Promise<Class> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await ((supabase
    .from('classes') as any)
    .insert({
      name: input.name,
      department: input.department,
      year: input.year,
      main_teacher_id: input.main_teacher_id,
    })
    .select()
    .single());

  if (error) {
    throw error;
  }

  return data as Class;
}

/**
 * 반 수정 (관리자 전용)
 * @param classId 반 ID
 * @param input 수정할 정보
 * @returns 수정된 반 정보
 */
export async function updateClass(
  classId: string,
  input: {
    name?: string;
    department?: string;
    year?: number;
    main_teacher_id?: string | null;
  }
): Promise<Class> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await ((supabase
    .from('classes') as any)
    .update(input)
    .eq('id', classId)
    .select()
    .single());

  if (error) {
    throw error;
  }

  return data as Class;
}

/**
 * 반 삭제 (관리자 전용)
 * @param classId 반 ID
 */
export async function deleteClass(classId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await ((supabase
    .from('classes') as any)
    .delete()
    .eq('id', classId));

  if (error) {
    throw error;
  }
}

/**
 * 반에 교사 배정 (관리자 전용)
 * @param classId 반 ID
 * @param teacherId 교사 ID (null이면 배정 해제)
 * @returns 수정된 반 정보
 */
export async function assignTeacherToClass(
  classId: string,
  teacherId: string | null
): Promise<Class> {
  return updateClass(classId, { main_teacher_id: teacherId });
}
