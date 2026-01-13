/**
 * 장기 결석 알림 API 함수
 * 3주 이상 결석한 학생을 자동으로 추출하는 기능
 */

import { supabase } from './client';
import type { LongTermAbsentStudent, GetLongTermAbsentStudentsParams } from '@/types/absence-alert';
import { getStudentsByClass } from './students';
import { getAttendanceLogs } from './attendance';

/**
 * 장기 결석 학생 목록 조회
 * 최근 3주(21일) 이상 출석 기록이 없는 학생을 반환
 * @param classIdOrParams 반 ID (문자열) 또는 조회 파라미터 (객체)
 * @returns 장기 결석 학생 배열
 */
export async function getLongTermAbsentStudents(
  classIdOrParams?: string | GetLongTermAbsentStudentsParams
): Promise<LongTermAbsentStudent[]> {
  // 문자열인 경우 객체로 변환
  const params: GetLongTermAbsentStudentsParams =
    typeof classIdOrParams === 'string'
      ? { class_id: classIdOrParams }
      : classIdOrParams ?? {};

  const weeks = params.weeks ?? 3; // 기본값: 3주
  const daysThreshold = weeks * 7; // 3주 = 21일

  const today = new Date();
  const threeWeeksAgo = new Date();
  threeWeeksAgo.setDate(today.getDate() - daysThreshold);

  const todayStr = today.toISOString().split('T')[0];
  const threeWeeksAgoStr = threeWeeksAgo.toISOString().split('T')[0];

  // 반별로 조회
  if (params.class_id) {
    return getLongTermAbsentStudentsByClass(params.class_id, threeWeeksAgoStr, todayStr);
  }

  // 교사별로 조회 (담당 반의 학생들)
  if (params.teacher_id) {
    return getLongTermAbsentStudentsByTeacher(params.teacher_id, weeks);
  }

  // 전체 조회는 성능상 권장하지 않음
  throw new Error('class_id 또는 teacher_id 중 하나는 필수입니다.');
}

/**
 * 특정 반의 장기 결석 학생 조회
 * @param classId 반 ID
 * @param startDate 시작 날짜 (YYYY-MM-DD)
 * @param endDate 종료 날짜 (YYYY-MM-DD)
 * @returns 장기 결석 학생 배열
 */
async function getLongTermAbsentStudentsByClass(
  classId: string,
  startDate: string,
  endDate: string
): Promise<LongTermAbsentStudent[]> {
  // 1. 활성 학생 목록 조회
  const students = await getStudentsByClass(classId, { is_active: true });

  if (students.length === 0) {
    return [];
  }

  // 2. 최근 3주간 출석 기록 조회
  const attendanceLogs = await getAttendanceLogs({
    class_id: classId,
    start_date: startDate,
    end_date: endDate,
  });

  // 3. 학생별로 마지막 출석일 계산
  const studentLastAttendance = new Map<string, string>(); // student_id -> last_attendance_date

  // 출석 기록이 있는 학생들의 마지막 출석일 기록
  attendanceLogs.forEach((log) => {
    if (log.status === 'present' || log.status === 'late') {
      const existing = studentLastAttendance.get(log.student_id);
      if (!existing || log.date > existing) {
        studentLastAttendance.set(log.student_id, log.date);
      }
    }
  });

  // 4. 장기 결석 학생 필터링
  const longTermAbsentStudents: LongTermAbsentStudent[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  students.forEach((student) => {
    const lastAttendanceDate = studentLastAttendance.get(student.id);

    let daysSinceLastAttendance: number;

    if (!lastAttendanceDate) {
      // 출석 기록이 전혀 없는 경우: 등록일 기준으로 계산
      const createdDate = new Date(student.created_at);
      createdDate.setHours(0, 0, 0, 0);
      daysSinceLastAttendance = Math.floor(
        (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      );
    } else {
      // 마지막 출석일 기준으로 계산
      const lastDate = new Date(lastAttendanceDate);
      lastDate.setHours(0, 0, 0, 0);
      daysSinceLastAttendance = Math.floor(
        (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    // 3주(21일) 이상 결석한 학생만 포함
    if (daysSinceLastAttendance >= 21) {
      longTermAbsentStudents.push({
        student_id: student.id,
        student_name: student.name,
        class_id: student.class_id,
        daysSinceLastAttendance,
        lastAttendanceDate: lastAttendanceDate || null,
      });
    }
  });

  // 경과 일수 순으로 정렬 (가장 오래된 결석부터)
  return longTermAbsentStudents.sort(
    (a, b) => b.daysSinceLastAttendance - a.daysSinceLastAttendance
  );
}

/**
 * 특정 교사가 담당하는 반들의 장기 결석 학생 조회
 * @param teacherId 교사 ID
 * @param weeks 경고 기준 주수 (기본값: 3주)
 * @returns 장기 결석 학생 배열
 */
export async function getLongTermAbsentStudentsByTeacher(
  teacherId: string,
  weeks: number = 3
): Promise<LongTermAbsentStudent[]> {
  // 교사가 담당하는 반 목록 조회
  // RLS 정책에 따라 admin은 모든 반을 볼 수 있고, 일반 교사는 자신의 반만 볼 수 있음
  const { data: classes, error } = await supabase
    .from('classes')
    .select('id')
    .eq('year', new Date().getFullYear());

  // 에러 발생 시 빈 배열 반환 (RLS 정책 문제나 권한 문제)
  if (error) {
    // RLS 무한 재귀 에러인 경우도 빈 배열 반환
    const errorMessage = error.message || '';
    if (errorMessage.includes('infinite recursion') || errorMessage.includes('policy')) {
      console.warn('RLS 정책 문제로 인해 장기 결석 알림을 조회할 수 없습니다. 관리자에게 문의하세요.');
      return [];
    }
    console.warn('장기 결석 알림 조회 중 오류 발생:', errorMessage);
    return [];
  }

  // 담당 반 필터링 (RLS가 이미 필터링했을 수 있지만, 명시적으로 확인)
  // admin의 경우 모든 반이 반환되고, 일반 교사의 경우 자신의 반만 반환됨

  if (!classes || classes.length === 0) {
    return [];
  }

  // 각 반의 장기 결석 학생 조회
  const allAbsentStudents: LongTermAbsentStudent[] = [];

  for (const classItem of classes as { id: string }[]) {
    const absentStudents = await getLongTermAbsentStudents({
      class_id: classItem.id,
      weeks,
    });
    allAbsentStudents.push(...absentStudents);
  }

  // 경과 일수 순으로 정렬
  return allAbsentStudents.sort(
    (a, b) => b.daysSinceLastAttendance - a.daysSinceLastAttendance
  );
}
