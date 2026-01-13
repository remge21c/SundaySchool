/**
 * 심방 기록 관련 TypeScript 타입 정의
 */

export type VisitationType = 'call' | 'visit' | 'kakao';

export interface VisitationLog {
  id: string;
  student_id: string;
  teacher_id: string;
  visit_date: string; // YYYY-MM-DD 형식
  type: VisitationType;
  content: string;
  prayer_request: string | null;
  is_confidential: boolean;
  created_at: string;
}

export interface CreateVisitationLogInput {
  student_id: string;
  teacher_id: string;
  visit_date: string; // YYYY-MM-DD 형식
  type: VisitationType;
  content: string;
  prayer_request?: string | null;
  is_confidential?: boolean;
}

export interface UpdateVisitationLogInput {
  visit_date?: string;
  type?: VisitationType;
  content?: string;
  prayer_request?: string | null;
  is_confidential?: boolean;
}

export interface GetVisitationLogsParams {
  student_id?: string;
  teacher_id?: string;
  visit_date?: string;
  start_date?: string;
  end_date?: string;
  type?: VisitationType;
  is_confidential?: boolean;
}
