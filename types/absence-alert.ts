/**
 * 장기 결석 알림 관련 TypeScript 타입 정의
 */

import type { Student } from './student';

/**
 * 장기 결석 학생 정보
 */
export interface LongTermAbsentStudent {
  student_id: string;
  student_name: string;
  class_id: string;
  class_name?: string;
  daysSinceLastAttendance: number; // 마지막 출석일로부터 경과 일수
  lastAttendanceDate: string | null; // 마지막 출석일 (YYYY-MM-DD) 또는 null
}

/**
 * 장기 결석 알림 조회 파라미터
 */
export interface GetLongTermAbsentStudentsParams {
  class_id?: string;
  teacher_id?: string; // 담당 교사 ID (선택)
  weeks?: number; // 경고 기준 주수 (기본값: 3주)
}
