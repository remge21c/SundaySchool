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

/**
 * 반에 배정된 교사 목록 조회
 * @param classId 반 ID
 * @returns 교사 ID 배열
 */
export async function getClassTeachers(classId: string): Promise<string[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await ((supabase
      .from('class_teachers') as any)
      .select('teacher_id')
      .eq('class_id', classId));

    // 테이블이 아직 생성되지 않았거나 404/500 오류인 경우 빈 배열 반환
    if (error) {
      // 404 오류 (테이블이 없음), 500 오류 (RLS 정책 문제), 또는 PGRST116 (레코드 없음)인 경우 빈 배열 반환
      if (
        error.code === 'PGRST116' ||
        error.code === '42P01' || // relation does not exist
        error.message?.includes('404') ||
        error.message?.includes('500') ||
        error.message?.includes('relation') ||
        error.message?.includes('does not exist') ||
        error.message?.includes('Internal Server Error')
      ) {
        console.warn('class_teachers 테이블 조회 실패 (테이블이 없거나 RLS 정책 문제):', error.message);
        return [];
      }
      // 다른 오류는 그대로 throw
      throw error;
    }

    return (data ?? []).map((row: any) => row.teacher_id);
  } catch (error: any) {
    // 예상치 못한 에러도 빈 배열 반환 (컴포넌트가 크래시되지 않도록)
    console.warn('getClassTeachers 에러:', error);
    return [];
  }
}

/**
 * 반에 여러 교사 배정 (관리자 전용)
 * @param classId 반 ID
 * @param teacherIds 교사 ID 배열
 */
export async function assignTeachersToClass(
  classId: string,
  teacherIds: string[]
): Promise<void> {
  // class_teachers 테이블이 아직 생성되지 않은 경우 에러를 무시하고 조용히 종료
  // (마이그레이션 전 상태에서도 앱이 정상 작동하도록)
  try {
    // 기존 배정 삭제
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await ((supabase
      .from('class_teachers') as any)
      .delete()
      .eq('class_id', classId));

    // 테이블이 없으면 조용히 종료 (마이그레이션 전 상태)
    if (deleteError) {
      if (deleteError.code === 'PGRST116' ||
        deleteError.message?.includes('404') ||
        deleteError.message?.includes('relation') ||
        deleteError.message?.includes('does not exist')) {
        console.warn('class_teachers 테이블이 아직 생성되지 않았습니다. 마이그레이션을 실행해주세요.');
        return;
      }
      throw deleteError;
    }

    // 새 배정 추가
    if (teacherIds.length > 0) {
      const insertData = teacherIds.map((teacherId) => ({
        class_id: classId,
        teacher_id: teacherId,
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await ((supabase
        .from('class_teachers') as any)
        .insert(insertData));

      if (insertError) {
        // 테이블이 없으면 조용히 종료
        if (insertError.code === 'PGRST116' ||
          insertError.message?.includes('404') ||
          insertError.message?.includes('relation') ||
          insertError.message?.includes('does not exist')) {
          console.warn('class_teachers 테이블이 아직 생성되지 않았습니다. 마이그레이션을 실행해주세요.');
          return;
        }
        throw insertError;
      }
    }
  } catch (error: any) {
    // 예상치 못한 에러인 경우에만 throw
    if (error?.message?.includes('404') ||
      error?.message?.includes('relation') ||
      error?.message?.includes('does not exist')) {
      console.warn('class_teachers 테이블이 아직 생성되지 않았습니다. 마이그레이션을 실행해주세요.');
      return;
    }
    throw error;
  }
}

/**
 * 교사의 담당 반 목록 수정 (관리자 전용)
 * @param teacherId 교사 ID
 * @param classIds 새로 배정할 반 ID 목록
 */
export async function updateTeacherClasses(
  teacherId: string,
  classIds: string[]
): Promise<void> {
  // 1. 해당 교사가 main_teacher_id인 반들 중, 새 목록에 없는 반은 main_teacher_id = NULL
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: mainTeacherClasses } = await (supabase
    .from('classes') as any)
    .select('id')
    .eq('main_teacher_id', teacherId);

  const mainClassIds = (mainTeacherClasses || []).map((c: any) => c.id);
  const classesToUnassign = mainClassIds.filter((id: string) => !classIds.includes(id));

  // main_teacher_id 해제
  for (const classId of classesToUnassign) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase
      .from('classes') as any)
      .update({ main_teacher_id: null })
      .eq('id', classId);
  }

  // 2. class_teachers에서 해당 교사의 기존 레코드 전체 삭제
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase
    .from('class_teachers') as any)
    .delete()
    .eq('teacher_id', teacherId);

  // 3. 새로운 반 배정 추가
  if (classIds.length > 0) {
    const insertData = classIds.map((classId) => ({
      class_id: classId,
      teacher_id: teacherId,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase
      .from('class_teachers') as any)
      .insert(insertData);
  }
}
