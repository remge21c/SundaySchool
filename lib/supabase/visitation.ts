/**
 * 심방 기록 API 함수
 * Supabase를 사용한 심방 기록 CRUD 작업
 */

import { supabase } from './client';
import type { Database } from '@/types/supabase';
import type {
  VisitationLog,
  CreateVisitationLogInput,
  UpdateVisitationLogInput,
  GetVisitationLogsParams,
} from '@/types/visitation';

type VisitationLogInsert = Database['public']['Tables']['visitation_logs']['Insert'];
type VisitationLogUpdate = Database['public']['Tables']['visitation_logs']['Update'];

/**
 * 심방 기록 생성
 * @param input 심방 기록 생성 데이터
 * @returns 생성된 심방 기록
 */
export async function createVisitationLog(
  input: CreateVisitationLogInput
): Promise<VisitationLog> {
  const insertData: VisitationLogInsert = {
    student_id: input.student_id,
    teacher_id: input.teacher_id,
    visit_date: input.visit_date,
    type: input.type,
    content: input.content,
    prayer_request: input.prayer_request ?? null,
    is_confidential: input.is_confidential ?? false,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from('visitation_logs') as any)
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('심방 기록 생성에 실패했습니다.');
  }

  return data as VisitationLog;
}

/**
 * 심방 기록 조회 (필터링 가능)
 * @param params 조회 파라미터
 * @returns 심방 기록 배열
 */
export async function getVisitationLogs(
  params: GetVisitationLogsParams = {}
): Promise<VisitationLog[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from('visitation_logs') as any).select(`
    *,
    profiles:teacher_id (
      full_name,
      email
    )
  `);

  if (params.student_id) {
    query = query.eq('student_id', params.student_id);
  }

  if (params.teacher_id) {
    query = query.eq('teacher_id', params.teacher_id);
  }

  if (params.visit_date) {
    query = query.eq('visit_date', params.visit_date);
  }

  if (params.start_date) {
    query = query.gte('visit_date', params.start_date);
  }

  if (params.end_date) {
    query = query.lte('visit_date', params.end_date);
  }

  if (params.type) {
    query = query.eq('type', params.type);
  }

  if (params.is_confidential !== undefined) {
    query = query.eq('is_confidential', params.is_confidential);
  }

  // 날짜 내림차순 정렬 (최신순)
  query = query.order('visit_date', { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as VisitationLog[];
}

/**
 * 심방 기록 ID로 단일 조회
 * @param id 심방 기록 ID
 * @returns 심방 기록 또는 null
 */
export async function getVisitationLogById(
  id: string
): Promise<VisitationLog | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await ((supabase
    .from('visitation_logs') as any)
    .select('*')
    .eq('id', id)
    .single());

  if (error) {
    // 레코드가 없는 경우
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data ? (data as VisitationLog) : null;
}

/**
 * 심방 기록 업데이트
 * @param id 심방 기록 ID
 * @param input 업데이트할 데이터
 * @returns 업데이트된 심방 기록
 */
export async function updateVisitationLog(
  id: string,
  input: UpdateVisitationLogInput
): Promise<VisitationLog> {
  const updateData: VisitationLogUpdate = {
    ...input,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await ((supabase
    .from('visitation_logs') as any)
    .update(updateData)
    .eq('id', id)
    .select()
    .single());

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('심방 기록 업데이트에 실패했습니다.');
  }

  return data as VisitationLog;
}

/**
 * 심방 기록 삭제
 * @param id 심방 기록 ID
 */
export async function deleteVisitationLog(id: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await ((supabase
    .from('visitation_logs') as any)
    .delete()
    .eq('id', id));

  if (error) {
    throw error;
  }
}

/**
 * 최근 심방 기록 조회 (비밀 보장 제외, 학생/반 정보 포함)
 * @param limit 조회 개수 (기본값: 10)
 * @returns 심방 기록 배열 (학생 이름, 반 정보 포함)
 */
export interface RecentVisitationLog extends VisitationLog {
  student_name: string;
  class_name: string;
  department: string;
}

export async function getRecentVisitationLogs(
  limit: number = 10
): Promise<RecentVisitationLog[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await ((supabase
    .from('visitation_logs') as any)
    .select(
      `
      *,
      students:student_id (
        name,
        classes:class_id (
          name,
          department
        )
      )
    `
    )
    .eq('is_confidential', false)
    .order('visit_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit));

  if (error) {
    throw error;
  }

  // 데이터 구조 변환
  return (data ?? []).map((item: any) => ({
    ...item,
    student_name: item.students?.name || '',
    class_name: item.students?.classes?.name || '',
    department: item.students?.classes?.department || '',
  })) as RecentVisitationLog[];
}
