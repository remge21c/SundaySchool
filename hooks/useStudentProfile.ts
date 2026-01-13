/**
 * 학생 프로필 조회를 위한 TanStack Query 훅
 */

import { useQuery } from '@tanstack/react-query';
import { getStudentProfile } from '@/lib/supabase/students';
import type { Student } from '@/types/student';

/**
 * 학생 프로필 조회 훅
 * @param studentId 학생 ID
 * @returns 학생 프로필 데이터 및 로딩/에러 상태
 */
export function useStudentProfile(studentId: string | null | undefined) {
  return useQuery<Student | null, Error>({
    queryKey: ['student-profile', studentId],
    queryFn: () => {
      if (!studentId) {
        return Promise.resolve(null);
      }
      return getStudentProfile(studentId);
    },
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
  });
}
