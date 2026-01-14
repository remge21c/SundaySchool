/**
 * 출석 기록 API 함수
 * Supabase를 사용한 출석 기록 CRUD 작업
 */

import { supabase } from './client';
import type { Database } from '@/types/supabase';
import type {
  AttendanceLog,
  CreateAttendanceLogInput,
  UpdateAttendanceLogInput,
  GetAttendanceLogsParams,
} from '@/types/attendance';

type AttendanceLogInsert = Database['public']['Tables']['attendance_logs']['Insert'];
type AttendanceLogUpdate = Database['public']['Tables']['attendance_logs']['Update'];

/**
 * 출석 기록 생성
 * @param input 출석 기록 생성 데이터
 * @returns 생성된 출석 기록
 * @throws UNIQUE 제약조건 위반 시 에러 (한 학생당 하루에 하나의 기록만 가능)
 */
export async function createAttendanceLog(
  input: CreateAttendanceLogInput
): Promise<AttendanceLog> {
  const insertData: AttendanceLogInsert = {
    student_id: input.student_id,
    class_id: input.class_id,
    date: input.date,
    status: input.status,
    reason: input.reason ?? null,
  };

  const { data, error } = await supabase
    .from('attendance_logs')
    // @ts-expect-error - Supabase Database 타입 추론 이슈
    .insert(insertData)
    .select()
    .single();

  if (error) {
    // UNIQUE 제약조건 위반 (student_id, date)
    if (error.code === '23505') {
      throw new Error('이미 해당 날짜에 출석 기록이 존재합니다.');
    }
    throw error;
  }

  if (!data) {
    throw new Error('출석 기록 생성에 실패했습니다.');
  }

  return data as unknown as AttendanceLog;
}

/**
 * 출석 기록 조회 (필터링 가능)
 * @param params 조회 파라미터
 * @returns 출석 기록 배열
 */
export async function getAttendanceLogs(
  params: GetAttendanceLogsParams = {}
): Promise<AttendanceLog[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from('attendance_logs').select('*') as any);

  if (params.student_id) {
    query = query.eq('student_id', params.student_id);
  }

  if (params.class_id) {
    query = query.eq('class_id', params.class_id);
  }

  if (params.date) {
    query = query.eq('date', params.date);
  }

  if (params.start_date && params.end_date) {
    query = query.gte('date', params.start_date).lte('date', params.end_date);
  }

  if (params.status) {
    query = query.eq('status', params.status);
  }

  query = query.order('date', { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as AttendanceLog[];
}

/**
 * 특정 학생의 특정 날짜 출석 기록 조회
 * @param studentId 학생 ID
 * @param date 날짜 (YYYY-MM-DD)
 * @returns 출석 기록 또는 null
 */
export async function getAttendanceLogByStudentAndDate(
  studentId: string,
  date: string
): Promise<AttendanceLog | null> {
  const { data, error } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('student_id', studentId)
    .eq('date', date)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? (data as unknown as AttendanceLog) : null;
}

/**
 * 출석 기록 업데이트
 * @param id 출석 기록 ID
 * @param input 업데이트 데이터
 * @returns 업데이트된 출석 기록
 */
export async function updateAttendanceLog(
  id: string,
  input: UpdateAttendanceLogInput
): Promise<AttendanceLog> {
  const updateData: AttendanceLogUpdate = {
    status: input.status,
    reason: input.reason ?? null,
  };

  const { data, error } = await supabase
    .from('attendance_logs')
    // @ts-expect-error - Supabase Database 타입 추론 이슈
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('출석 기록 업데이트에 실패했습니다.');
  }

  return data as unknown as AttendanceLog;
}

/**
 * 출석 기록 삭제
 * @param id 출석 기록 ID
 */
export async function deleteAttendanceLog(id: string): Promise<void> {
  const { error } = await supabase.from('attendance_logs').delete().eq('id', id);

  if (error) {
    throw error;
  }
}

/**
 * 특정 반의 특정 날짜 출석 기록 조회
 * @param classId 반 ID
 * @param date 날짜 (YYYY-MM-DD)
 * @returns 출석 기록 배열
 */
export async function getAttendanceLogsByClassAndDate(
  classId: string,
  date: string
): Promise<AttendanceLog[]> {
  const { data, error } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('class_id', classId)
    .eq('date', date);

  if (error) {
    throw error;
  }

  return (data ?? []) as AttendanceLog[];
}

/**
 * 출석 기록 생성 또는 업데이트 (Upsert)
 * @param input 출석 기록 데이터
 * @returns 생성/업데이트된 출석 기록
 */
export async function upsertAttendanceLog(
  input: CreateAttendanceLogInput
): Promise<AttendanceLog> {
  // 기존 기록 확인
  const existing = await getAttendanceLogByStudentAndDate(input.student_id, input.date);

  if (existing) {
    // 업데이트
    return updateAttendanceLog(existing.id, {
      status: input.status,
      reason: input.reason,
    });
  } else {
    // 생성
    return createAttendanceLog(input);
  }
}

/**
 * 출석 통계 조회
 * @param classId 반 ID
 * @param date 날짜 (YYYY-MM-DD)
 * @returns 출석 통계 객체
 */
export interface AttendanceStats {
  total: number; // 전체 학생 수
  present: number; // 출석 수
  absent: number; // 결석 수
  late: number; // 지각 수
  attendanceRate: number; // 출석률 (0-100)
}

export async function getAttendanceStats(
  classId: string,
  date: string
): Promise<AttendanceStats> {
  // 전체 학생 수 조회
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id', { count: 'exact' })
    .eq('class_id', classId)
    .eq('is_active', true);

  if (studentsError) {
    throw studentsError;
  }

  const total = students?.length ?? 0;

  // 출석 기록 조회
  const { data: logs, error: logsError } = await supabase
    .from('attendance_logs')
    .select('status')
    .eq('class_id', classId)
    .eq('date', date);

  if (logsError) {
    throw logsError;
  }

  const present =
    logs?.filter((log: { status: string }) => log.status === 'present').length ?? 0;
  const absent =
    logs?.filter((log: { status: string }) => log.status === 'absent').length ?? 0;
  const late = logs?.filter((log: { status: string }) => log.status === 'late').length ?? 0;

  // 출석률 계산 (출석 + 지각 / 전체)
  const attendanceRate = total > 0 ? ((present + late) / total) * 100 : 0;

  return {
    total,
    present,
    absent,
    late,
    attendanceRate: Math.round(attendanceRate * 10) / 10, // 소수점 첫째 자리까지
  };
}

/**
 * 반별 주간 출석 통계
 * @param classId 반 ID
 * @param startDate 시작 날짜 (YYYY-MM-DD, 일요일)
 * @param endDate 종료 날짜 (YYYY-MM-DD, 토요일)
 * @returns 출석 통계 객체
 */
export async function getClassAttendanceStatsByWeek(
  classId: string,
  startDate: string,
  endDate: string
): Promise<AttendanceStats> {
  // 전체 학생 수 조회
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id', { count: 'exact' })
    .eq('class_id', classId)
    .eq('is_active', true);

  if (studentsError) {
    throw studentsError;
  }

  const total = students?.length ?? 0;

  // 주간 출석 기록 조회
  const { data: logs, error: logsError } = await (supabase
    .from('attendance_logs')
    .select('status')
    .eq('class_id', classId)
    .gte('date', startDate)
    .lte('date', endDate) as any);

  if (logsError) {
    throw logsError;
  }

  const present =
    logs?.filter((log: { status: string }) => log.status === 'present').length ?? 0;
  const absent =
    logs?.filter((log: { status: string }) => log.status === 'absent').length ?? 0;
  const late = logs?.filter((log: { status: string }) => log.status === 'late').length ?? 0;

  // 출석률 계산 (출석 + 지각 / 전체)
  const attendanceRate = total > 0 ? ((present + late) / total) * 100 : 0;

  return {
    total,
    present,
    absent,
    late,
    attendanceRate: Math.round(attendanceRate * 10) / 10,
  };
}

/**
 * 전체 주간 출석 통계 (부서별/반별)
 * @param startDate 시작 날짜 (YYYY-MM-DD, 일요일)
 * @param endDate 종료 날짜 (YYYY-MM-DD, 토요일)
 * @returns 부서별/반별 출석 통계 배열
 */
export interface WeeklyAttendanceStatsByClass {
  classId: string;
  className: string;
  department: string;
  stats: AttendanceStats;
}

export async function getAllAttendanceStatsByWeek(
  startDate: string,
  endDate: string
): Promise<WeeklyAttendanceStatsByClass[]> {
  // 모든 반 조회 (현재 연도)
  const { getAllClasses } = await import('./classes');
  const classes = await getAllClasses();

  const results: WeeklyAttendanceStatsByClass[] = [];

  // 각 반별로 주간 통계 계산
  for (const classItem of classes) {
    const stats = await getClassAttendanceStatsByWeek(classItem.id, startDate, endDate);
    results.push({
      classId: classItem.id,
      className: classItem.name,
      department: classItem.department,
      stats,
    });
  }

  return results;
}
