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
/**
 * 모든 반 조회
 * @returns 반 배열
 */
export async function getAllClasses(year?: number): Promise<Class[]> {
  let query = supabase.from('classes').select('*, students(count)');

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

  return (data?.map((item: any) => ({
    ...item,
    student_count: item.students?.[0]?.count || 0,
    students: undefined // cleanup
  })) ?? []) as Class[];
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
  let query = supabase.from('classes').select('*, students(count)').eq('department', department);

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

  return (data?.map((item: any) => ({
    ...item,
    student_count: item.students?.[0]?.count || 0,
    students: undefined
  })) ?? []) as Class[];
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
    .select('*, students(count)')
    .eq('id', classId)
    .single() as any);

  if (error) {
    // 레코드가 없는 경우
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  const result = {
    ...data,
    student_count: data.students?.[0]?.count || 0,
    students: undefined
  };

  return result as Class;
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
  // main_teacher_id로 배정된 반과 class_teachers로 배정된 반 모두 조회
  const currentYear = year ?? new Date().getFullYear();

  // main_teacher_id로 배정된 반 조회
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: mainTeacherClasses, error: mainTeacherError } = await ((supabase
    .from('classes') as any)
    .select('*, students(count)')
    .eq('main_teacher_id', teacherId)
    .eq('year', currentYear));

  if (mainTeacherError) {
    throw mainTeacherError;
  }

  // class_teachers로 배정된 반 ID 조회
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: classTeachersData, error: classTeachersError } = await ((supabase
    .from('class_teachers') as any)
    .select('class_id')
    .eq('teacher_id', teacherId));

  // 디버깅 로그
  // console.log('[getClassesByTeacher] teacherId:', teacherId);
  // console.log('[getClassesByTeacher] mainTeacherClasses:', mainTeacherClasses?.length);
  // console.log('[getClassesByTeacher] classTeachersData:', classTeachersData);
  // console.log('[getClassesByTeacher] classTeachersError:', classTeachersError);

  // class_teachers 테이블이 아직 생성되지 않은 경우 (404 오류) 빈 배열로 처리
  if (classTeachersError) {
    console.warn('[getClassesByTeacher] class_teachers 에러:', classTeachersError);
    // 404 오류 (테이블이 없음) 또는 테이블이 존재하지 않는 경우 빈 배열로 처리
    if (classTeachersError.code === 'PGRST116' ||
      classTeachersError.message?.includes('404') ||
      classTeachersError.message?.includes('relation') ||
      classTeachersError.message?.includes('does not exist')) {
      // 테이블이 아직 생성되지 않았으므로 빈 배열 반환
      return (mainTeacherClasses?.map((item: any) => ({
        ...item,
        student_count: item.students?.[0]?.count || 0,
        students: undefined
      })) ?? []) as Class[];
    }
    throw classTeachersError;
  }

  const classTeacherIds = (classTeachersData ?? []).map((row: any) => row.class_id);
  // console.log('[getClassesByTeacher] classTeacherIds:', classTeacherIds);

  // class_teachers로 배정된 반 조회
  let classTeacherClasses: Class[] = [];
  if (classTeacherIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await ((supabase
      .from('classes') as any)
      .select('*, students(count)')
      .in('id', classTeacherIds)
      .eq('year', currentYear));

    if (error) {
      throw error;
    }

    classTeacherClasses = (data ?? []) as Class[];
  }

  // 두 결과를 합치고 중복 제거
  const allRawClasses = [...(mainTeacherClasses ?? []), ...classTeacherClasses];
  const uniqueClasses = Array.from(
    new Map(allRawClasses.map((cls) => [cls.id, cls])).values()
  );

  // 이름 순 정렬
  uniqueClasses.sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  return uniqueClasses.map((item: any) => ({
    ...item,
    student_count: item.students?.[0]?.count || item.student_count || 0,
    students: undefined
  })) as Class[];
}

/**
 * 부서 목록 조회
 * @param year 연도 (선택)
 * @returns 부서명 배열
 */
export async function getDepartments(year?: number): Promise<string[]> {
  // departments 테이블에서 순서대로 가져오기
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: departments, error } = await ((supabase
    .from('departments') as any)
    .select('name')
    .order('sort_order', { ascending: true }));

  if (error) {
    console.error('부서 목록 조회 실패 (departments 테이블):', error);

    // 폴백: departments 테이블 조회가 실패하면 기존 로직 사용 (classes에서 추출)
    let query = supabase.from('classes').select('department');
    if (year) {
      query = query.eq('year', year);
    } else {
      const currentYear = new Date().getFullYear();
      query = query.eq('year', currentYear);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: classError } = await (query as any);

    if (classError) throw classError;

    return Array.from(
      new Set((data ?? []).map((row: any) => row.department))
    ).sort() as string[];
  }

  return departments.map((d: any) => d.name) as string[];
}

/**
 * 부서의 모든 반을 다른 부서로 이동
 * @param oldDepartment 이전 부서명
 * @param newDepartment 새 부서명
 * @returns 성공 여부
 */
export async function moveClassesToDepartment(
  oldDepartment: string,
  newDepartment: string
): Promise<void> {
  if (oldDepartment === newDepartment) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await ((supabase
    .from('classes') as any)
    .update({ department: newDepartment })
    .eq('department', oldDepartment));

  if (error) {
    console.error(`Error moving classes from ${oldDepartment} to ${newDepartment}:`, error);
    throw error;
  }
}

/**
 * 부서의 미배정 반 조회 또는 생성
 * @param department 부서명
 * @returns 미배정 반 정보
 */
export async function getOrCreateUnassignedClass(department: string): Promise<Class> {
  const currentYear = new Date().getFullYear();

  // 미배정 반 조회
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingClass, error: selectError } = await ((supabase
    .from('classes') as any)
    .select('*')
    .eq('department', department)
    .eq('name', '미배정')
    .eq('year', currentYear)
    .maybeSingle());

  if (selectError) {
    throw selectError;
  }

  if (existingClass) {
    return existingClass as Class;
  }

  // 미배정 반이 없으면 생성
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: newClass, error: insertError } = await ((supabase
    .from('classes') as any)
    .insert({
      name: '미배정',
      department,
      year: currentYear,
      // grade_level 컬럼 없음
    })
    .select()
    .single());

  if (insertError) {
    throw insertError;
  }

  return newClass as Class;
}
