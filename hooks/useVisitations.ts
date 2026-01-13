/**
 * 심방 기록 조회를 위한 TanStack Query 훅
 */

import { useQuery } from '@tanstack/react-query';
import { getVisitationLogs } from '@/lib/supabase/visitation';
import type { VisitationLog, GetVisitationLogsParams } from '@/types/visitation';

/**
 * 심방 기록 조회 훅
 * @param params 조회 파라미터
 * @returns 심방 기록 데이터 및 로딩/에러 상태
 */
export function useVisitations(params: GetVisitationLogsParams = {}) {
  return useQuery<VisitationLog[], Error>({
    queryKey: ['visitations', params],
    queryFn: () => getVisitationLogs(params),
    staleTime: 2 * 60 * 1000, // 2분간 fresh 상태 유지
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
  });
}
