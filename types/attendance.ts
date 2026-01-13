/**
 * 출석 기록 관련 TypeScript 타입 정의
 */

export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface AttendanceLog {
  id: string;
  student_id: string;
  class_id: string;
  date: string; // YYYY-MM-DD 형식
  status: AttendanceStatus;
  reason: string | null;
  created_at: string;
}

export interface CreateAttendanceLogInput {
  student_id: string;
  class_id: string;
  date: string; // YYYY-MM-DD 형식
  status: AttendanceStatus;
  reason?: string | null;
}

export interface UpdateAttendanceLogInput {
  status?: AttendanceStatus;
  reason?: string | null;
}

export interface GetAttendanceLogsParams {
  class_id?: string;
  student_id?: string;
  date?: string;
  start_date?: string;
  end_date?: string;
  status?: AttendanceStatus;
}
