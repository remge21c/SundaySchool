/**
 * 학생 정보 API 함수
 * Supabase를 사용한 학생 정보 조회 작업
 */

import { supabase } from './client';
import type { Database } from '@/types/supabase';
import type { Student, GetStudentsParams } from '@/types/student';

type StudentInsert = Database['public']['Tables']['students']['Insert'];
type StudentUpdate = Database['public']['Tables']['students']['Update'];

/**
 * 반별 학생 리스트 조회
 * @param classId 반 ID
 * @param params 추가 필터 조건
 * @returns 학생 배열
 */
export async function getStudentsByClass(
  classId: string,
  params: Omit<GetStudentsParams, 'class_id'> = {}
): Promise<Student[]> {
  let query = supabase.from('students').select('*');

  // 반 필터
  query = query.eq('class_id', classId);

  // 활성 상태 필터 (기본값: true)
  const isActive = params.is_active !== undefined ? params.is_active : true;
  query = query.eq('is_active', isActive);

  // 이름 검색
  if (params.search) {
    query = query.ilike('name', `%${params.search}%`);
  }

  // 이름 순 정렬
  query = query.order('name', { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (query as any);

  if (error) {
    throw error;
  }

  return (data ?? []) as Student[];
}

/**
 * 학생 ID로 단일 학생 조회
 * @param studentId 학생 ID
 * @returns 학생 정보 또는 null
 */
export async function getStudentById(studentId: string): Promise<Student | null> {
  const { data, error } = await (supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single() as any);

  if (error) {
    // 레코드가 없는 경우
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data as Student;
}

/**
 * 모든 활성 학생 조회
 * @returns 학생 배열
 */
export async function getAllStudents(
  params: Omit<GetStudentsParams, 'class_id'> = {}
): Promise<Student[]> {
  let query = supabase.from('students').select('*');

  // 활성 상태 필터 (기본값: true)
  const isActive = params.is_active !== undefined ? params.is_active : true;
  query = query.eq('is_active', isActive);

  // 이름 검색
  if (params.search) {
    query = query.ilike('name', `%${params.search}%`);
  }

  // 이름 순 정렬
  query = query.order('name', { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (query as any);

  if (error) {
    throw error;
  }

  return (data ?? []) as Student[];
}

/**
 * 학생 생성
 * @param input 학생 정보
 * @returns 생성된 학생 정보
 */
export async function createStudent(input: StudentInsert): Promise<Student> {
  const { data, error } = await supabase
    .from('students')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(input as any)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('학생 생성에 실패했습니다.');
  }

  return data as Student;
}

/**
 * 학생 정보 업데이트
 * @param studentId 학생 ID
 * @param input 업데이트할 정보
 * @returns 업데이트된 학생 정보
 */
export async function updateStudent(
  studentId: string,
  input: StudentUpdate
): Promise<Student> {
  const updateData = {
    ...input,
    updated_at: new Date().toISOString(),
  };
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await ((supabase
    .from('students') as any)
    .update(updateData)
    .eq('id', studentId)
    .select()
    .single());

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('학생 정보 업데이트에 실패했습니다.');
  }

  return data as Student;
}

/**
 * 학생 사진 URL 업데이트
 * @param studentId 학생 ID
 * @param photoUrl 사진 URL
 * @returns 업데이트된 학생 정보
 */
export async function updateStudentPhoto(
  studentId: string,
  photoUrl: string | null
): Promise<Student> {
  return updateStudent(studentId, { photo_url: photoUrl } as StudentUpdate);
}

/**
 * 학생 삭제 (소프트 삭제: is_active = false)
 * @param studentId 학생 ID
 */
export async function deleteStudent(studentId: string): Promise<void> {
  const updateData = { is_active: false, updated_at: new Date().toISOString() };
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await ((supabase
    .from('students') as any)
    .update(updateData)
    .eq('id', studentId));

  if (error) {
    throw error;
  }
}

/**
 * 학생 프로필 조회 (상세 정보 포함)
 * 기본 정보, 알레르기 정보(JSONB), 반 정보를 포함하여 조회
 * RLS 정책에 따라 권한이 있는 경우에만 조회 가능
 * @param studentId 학생 ID
 * @returns 학생 프로필 정보 또는 null
 */
export async function getStudentProfile(studentId: string): Promise<Student | null> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single();

  if (error) {
    // 레코드가 없는 경우
    if (error.code === 'PGRST116') {
      return null;
    }
    // RLS 정책 위반 또는 기타 에러
    throw error;
  }

  return data ? (data as Student) : null;
}
