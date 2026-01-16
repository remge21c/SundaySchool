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
  params: Omit<GetStudentsParams, 'class_id'> & { grade?: number | null } = {}
): Promise<Student[]> {
  let query = supabase.from('students').select('*');

  // 반 필터
  query = query.eq('class_id', classId);

  // 활성 상태 필터 (기본값: true)
  const isActive = params.is_active !== undefined ? params.is_active : true;
  query = query.eq('is_active', isActive);

  // 졸업하지 않은 학생만 조회 (활성 상태일 때)
  if (isActive) {
    query = query.is('graduation_year', null);
  }

  // 이름 검색
  if (params.search) {
    query = query.ilike('name', `%${params.search}%`);
  }

  // 학년 필터
  if (params.grade) {
    query = query.eq('grade', params.grade);
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
 * 부서별 학생 리스트 조회
 * @param departmentName 부서명
 * @param params 추가 필터 조건
 * @returns 학생 배열
 */
export async function getStudentsByDepartment(
  departmentName: string,
  params: Omit<GetStudentsParams, 'class_id'> & { grade?: number | null } = {}
): Promise<Student[]> {
  // students와 classes를 조인하여 부서로 필터링
  let query = supabase
    .from('students')
    .select('*, classes!inner(department)')
    .eq('classes.department', departmentName);

  // 활성 상태 필터 (기본값: true)
  const isActive = params.is_active !== undefined ? params.is_active : true;
  query = query.eq('is_active', isActive);

  // 졸업하지 않은 학생만 조회 (활성 상태일 때)
  if (isActive) {
    query = query.is('graduation_year', null);
  }

  // 이름 검색
  if (params.search) {
    query = query.ilike('name', `%${params.search}%`);
  }

  // 학년 필터
  if (params.grade) {
    query = query.eq('grade', params.grade);
  }

  // 이름 순 정렬
  query = query.order('name', { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (query as any);

  if (error) {
    throw error;
  }

  // classes 정보는 제거하고 student 정보만 반환
  return (data?.map((item: any) => {
    const { classes, ...student } = item;
    return student;
  }) ?? []) as Student[];
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
 * @param params 필터 조건
 * @returns 학생 배열
 */
export async function getAllStudents(
  params: Omit<GetStudentsParams, 'class_id'> & { grade?: number | null } = {}
): Promise<Student[]> {
  let query = supabase.from('students').select('*');

  // 활성 상태 필터 (기본값: true)
  const isActive = params.is_active !== undefined ? params.is_active : true;
  query = query.eq('is_active', isActive);

  // 졸업하지 않은 학생만 조회 (활성 상태일 때)
  if (isActive) {
    query = query.is('graduation_year', null);
  }

  // 이름 검색
  if (params.search) {
    query = query.ilike('name', `%${params.search}%`);
  }

  // 학년 필터
  if (params.grade) {
    query = query.eq('grade', params.grade);
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
 * 학생 일괄 반 이동
 * @param studentIds 이동할 학생 ID 배열
 * @param targetClassId 이동할 반 ID
 */
export async function updateStudentsClass(studentIds: string[], targetClassId: string): Promise<void> {
  const { error } = await ((supabase
    .from('students') as any)
    .update({ class_id: targetClassId, updated_at: new Date().toISOString() })
    .in('id', studentIds));

  if (error) throw error;
}

/**
 * 학생 일괄 졸업 처리 (대학부 → 청년부)
 * @param studentIds 졸업할 학생 ID 배열
 * @param graduationYear 졸업 연도
 * @param targetClassId 청년부 미배정 반 ID
 */
export async function graduateStudents(
  studentIds: string[],
  graduationYear: number,
  targetClassId?: string
): Promise<void> {
  const updateData: any = {
    graduation_year: graduationYear,
    updated_at: new Date().toISOString()
  };

  // 청년부로 이동하는 경우 (대학부 졸업)
  if (targetClassId) {
    updateData.class_id = targetClassId;
    // 청년부에서는 is_active 유지 (계속 관리)
  } else {
    // 이전 방식: 단순 비활성화
    updateData.is_active = false;
  }

  const { error } = await ((supabase
    .from('students') as any)
    .update(updateData)
    .in('id', studentIds));

  if (error) throw error;
}

/**
 * 학생 일괄 삭제 (영구 삭제)
 * @param studentIds 삭제할 학생 ID 배열
 */
export async function deleteStudents(studentIds: string[]): Promise<void> {
  const { error } = await supabase
    .from('students')
    .delete()
    .in('id', studentIds);

  if (error) throw error;
}

/**
 * 학생 부서 이동 (미배정 반으로)
 * @param studentIds 이동할 학생 ID 배열
 * @param targetClassId 대상 부서의 미배정 반 ID
 */
export async function transferStudentsToDepartment(
  studentIds: string[],
  targetClassId: string
): Promise<void> {
  const { error } = await ((supabase
    .from('students') as any)
    .update({
      class_id: targetClassId,
      grade: 0, // 미배정 상태로 학년 초기화
      updated_at: new Date().toISOString()
    })
    .in('id', studentIds));

  if (error) throw error;
}

/**
 * 학생 학년 승급
 * @param studentIds 승급할 학생 ID 배열
 * @returns 승급된 학생 수
 */
export async function promoteStudentsGrade(studentIds: string[]): Promise<number> {
  // 먼저 학생 정보 조회
  const { data: students, error: selectError } = await (supabase
    .from('students')
    .select('id, grade')
    .in('id', studentIds) as any);

  if (selectError) throw selectError;

  // 학년별로 그룹화하여 승급 (6학년 제외, 0학년→1학년)
  let promotedCount = 0;

  for (const student of students || []) {
    const currentGrade = student.grade || 0;

    // 6학년은 승급 불가 (졸업 대상)
    if (currentGrade >= 6) continue;

    // 0학년(미배정) → 1학년, 그 외 +1
    const newGrade = currentGrade === 0 ? 1 : currentGrade + 1;

    const { error: updateError } = await ((supabase
      .from('students') as any)
      .update({ grade: newGrade, updated_at: new Date().toISOString() })
      .eq('id', student.id));

    if (!updateError) {
      promotedCount++;
    }
  }

  return promotedCount;
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
    .select());

  if (error) {
    // PGRST116: 결과가 0개 행일 때
    if (error.code === 'PGRST116') {
      // 업데이트는 성공했지만 RLS 정책으로 조회가 차단된 경우
      // 다시 조회 시도
      const student = await getStudentById(studentId);
      if (student) {
        return student;
      }
      throw new Error('학생 정보를 업데이트했지만 조회할 수 없습니다. 권한을 확인해주세요.');
    }
    throw error;
  }

  // 결과가 배열로 반환되므로 첫 번째 요소 사용
  if (!data || data.length === 0) {
    // 업데이트는 성공했지만 결과를 조회할 수 없는 경우
    // 다시 조회 시도
    const student = await getStudentById(studentId);
    if (student) {
      return student;
    }
    throw new Error('학생 정보 업데이트에 실패했습니다.');
  }

  return data[0] as Student;
}

/**
 * 학생 알레르기 정보 업데이트
 * @param studentId 학생 ID
 * @param allergies 알레르기 정보
 * @returns 업데이트된 학생 정보
 */
export async function updateStudentAllergies(
  studentId: string,
  allergies: { food?: string[]; medicine?: string[]; other?: string }
): Promise<Student> {
  // 모든 항목이 비어있으면 null로 저장
  const allergiesData =
    (!allergies.food || allergies.food.length === 0) &&
      (!allergies.medicine || allergies.medicine.length === 0) &&
      !allergies.other
      ? null
      : allergies;

  return await updateStudent(studentId, { allergies: allergiesData as any } as StudentUpdate);
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
  try {
    return await updateStudent(studentId, { photo_url: photoUrl } as StudentUpdate);
  } catch (error: any) {
    // photo_url 필드가 없는 경우
    if (error?.message?.includes('column "photo_url"') || error?.code === '42703') {
      throw new Error(
        '학생 테이블에 photo_url 필드가 없습니다. Supabase에서 다음 SQL을 실행해주세요:\n' +
        'ALTER TABLE students ADD COLUMN IF NOT EXISTS photo_url TEXT;'
      );
    }
    // PGRST116: 결과가 0개 행일 때 (RLS 정책 문제 가능)
    if (error?.code === 'PGRST116' || error?.message?.includes('0 rows')) {
      throw new Error(
        '학생 정보를 업데이트했지만 조회할 수 없습니다. RLS 정책을 확인해주세요.'
      );
    }
    throw error;
  }
}

/**
 * 학생 삭제 (영구 삭제)
 * @param studentId 학생 ID
 */
export async function deleteStudent(studentId: string): Promise<void> {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', studentId);

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

/**
 * 이달의 생일자 조회 (반별)
 * @param classId 반 ID
 * @returns 이번 달 생일인 학생 배열
 */
export async function getBirthdayStudentsByClass(classId: string): Promise<Student[]> {
  const currentMonth = new Date().getMonth() + 1; // 1-12

  const { data, error } = await (supabase
    .from('students')
    .select('*')
    .eq('class_id', classId)
    .eq('is_active', true)
    .is('graduation_year', null)
    .not('birthday', 'is', null)
    .order('birthday', { ascending: true }) as any);

  if (error) {
    throw error;
  }

  // 클라이언트에서 월 필터링 (PostgreSQL의 EXTRACT는 RPC 없이 사용 어려움)
  return ((data ?? []) as Student[]).filter((student) => {
    if (!student.birthday) return false;
    const birthMonth = new Date(student.birthday).getMonth() + 1;
    return birthMonth === currentMonth;
  });
}

/**
 * 이달의 생일자 조회 (부서별)
 * @param departmentName 부서명
 * @returns 이번 달 생일인 학생 배열
 */
export async function getBirthdayStudentsByDepartment(departmentName: string): Promise<Student[]> {
  const currentMonth = new Date().getMonth() + 1; // 1-12

  const { data, error } = await (supabase
    .from('students')
    .select('*, classes!inner(department, name)')
    .eq('classes.department', departmentName)
    .eq('is_active', true)
    .is('graduation_year', null)
    .not('birthday', 'is', null)
    .order('birthday', { ascending: true }) as any);

  if (error) {
    throw error;
  }

  // 클라이언트에서 월 필터링 및 classes 정보 제거
  return ((data ?? []) as any[])
    .filter((item) => {
      if (!item.birthday) return false;
      const birthMonth = new Date(item.birthday).getMonth() + 1;
      return birthMonth === currentMonth;
    })
    .map((item) => {
      const { classes, ...student } = item;
      return { ...student, class_name: classes?.name } as Student & { class_name?: string };
    });
}
