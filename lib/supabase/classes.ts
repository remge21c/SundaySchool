/**
 * 반 정보 API 함수
 * Supabase를 사용한 반 정보 조회 작업
 */

import { supabase } from './client';
import type { Class } from '@/types/class';


/**
 * 모든 반 조회
 * @returns 반 배열
 */
export async function getAllClasses(year?: number): Promise<Class[]> {
  let query = supabase.from('classes').select('*');

  // 연도 필터 (기본값: 현재 연도)
  if (year) {
    query = query.eq('year', year);
  } else {
    const currentYear = new Date().getFullYear();
    query = query.eq('year', currentYear);
  }

  // 이름 순 정렬
  query = query.order('name', { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (query as any);

  if (error) {
    throw error;
  }

  return (data ?? []) as Class[];
}

/**
 * 부서별 반 조회
 * @param department 부서명
 * @param year 연도 (선택)
 * @returns 반 배열
 */
export async function getClassesByDepartment(
  department: string,
  year?: number
): Promise<Class[]> {
  let query = supabase.from('classes').select('*').eq('department', department);

  // 연도 필터
  if (year) {
    query = query.eq('year', year);
  } else {
    const currentYear = new Date().getFullYear();
    query = query.eq('year', currentYear);
  }

  // 이름 순 정렬
  query = query.order('name', { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (query as any);

  if (error) {
    throw error;
  }

  return (data ?? []) as Class[];
}

/**
 * 반 ID로 단일 반 조회
 * @param classId 반 ID
 * @returns 반 정보 또는 null
 */
export async function getClassById(classId: string): Promise<Class | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from('classes')
    .select('*')
    .eq('id', classId)
    .single() as any);

  if (error) {
    // 레코드가 없는 경우
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data as Class;
}

/**
 * 교사의 담당 반 조회
 * @param teacherId 교사 ID
 * @param year 연도 (선택)
 * @returns 반 배열
 */
export async function getClassesByTeacher(
  teacherId: string,
  year?: number
): Promise<Class[]> {
  let query = supabase
    .from('classes')
    .select('*')
    .eq('main_teacher_id', teacherId);

  // 연도 필터
  if (year) {
    query = query.eq('year', year);
  } else {
    const currentYear = new Date().getFullYear();
    query = query.eq('year', currentYear);
  }

  // 이름 순 정렬
  query = query.order('name', { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (query as any);

  if (error) {
    throw error;
  }

  return (data ?? []) as Class[];
}

/**
 * 부서 목록 조회
 * @param year 연도 (선택)
 * @returns 부서명 배열
 */
export async function getDepartments(year?: number): Promise<string[]> {
  let query = supabase.from('classes').select('department');

  // 연도 필터
  if (year) {
    query = query.eq('year', year);
  } else {
    const currentYear = new Date().getFullYear();
    query = query.eq('year', currentYear);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (query as any);

  if (error) {
    throw error;
  }

  // 중복 제거 및 정렬
  const departments = Array.from(
    new Set((data ?? []).map((row: any) => row.department))
  ).sort() as string[];

  return departments;
}
