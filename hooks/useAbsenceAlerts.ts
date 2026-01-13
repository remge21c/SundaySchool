/**
 * 장기 결석 알림 조회를 위한 TanStack Query 훅
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getLongTermAbsentStudents,
  getLongTermAbsentStudentsByTeacher,
} from '@/lib/supabase/absence-alert';
import type {
  LongTermAbsentStudent,
  GetLongTermAbsentStudentsParams,
} from '@/types/absence-alert';

/**
 * 장기 결석 학생 목록 조회 훅
 * @param params 조회 파라미터 (class_id 또는 teacher_id 필수)
 * @returns 장기 결석 학생 데이터 및 로딩/에러 상태
 */
export function useAbsenceAlerts(
  params: GetLongTermAbsentStudentsParams
) {
  return useQuery<LongTermAbsentStudent[], Error>({
    queryKey: ['absence-alerts', params],
    queryFn: () => {
      if (params.teacher_id) {
        return getLongTermAbsentStudentsByTeacher(
          params.teacher_id,
          params.weeks
        );
      }
      if (params.class_id) {
        return getLongTermAbsentStudents(params);
      }
      throw new Error('class_id 또는 teacher_id 중 하나는 필수입니다.');
    },
    enabled: !!(params.class_id || params.teacher_id),
    staleTime: 1 * 60 * 1000, // 1분간 fresh 상태 유지 (자주 갱신 필요)
    gcTime: 5 * 60 * 1000, // 5분간 캐시 유지
  });
}
