/**
 * 반 정보 조회를 위한 TanStack Query 훅
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getAllClasses,
  getClassesByDepartment,
  getClassById,
  getClassesByTeacher,
  getDepartments,
} from '@/lib/supabase/classes';
import type { Class } from '@/types/class';

/**
 * 모든 반 조회 훅
 * @param year 연도 (선택)
 */
export function useAllClasses(year?: number) {
  return useQuery({
    queryKey: ['classes', 'all', year],
    queryFn: () => getAllClasses(year),
    staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
  });
}

/**
 * 부서별 반 조회 훅
 * @param department 부서명
 * @param year 연도 (선택)
 */
export function useClassesByDepartment(department: string, year?: number) {
  return useQuery({
    queryKey: ['classes', 'department', department, year],
    queryFn: () => getClassesByDepartment(department, year),
    enabled: !!department, // department가 있을 때만 쿼리 실행
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * 반 ID로 단일 반 조회 훅
 * @param classId 반 ID
 */
export function useClass(classId: string | null | undefined) {
  return useQuery({
    queryKey: ['classes', classId],
    queryFn: () => {
      if (!classId) {
        throw new Error('classId is required');
      }
      return getClassById(classId);
    },
    enabled: !!classId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * 교사의 담당 반 조회 훅
 * @param teacherId 교사 ID
 * @param year 연도 (선택)
 */
export function useClassesByTeacher(teacherId: string | null | undefined, year?: number) {
  return useQuery({
    queryKey: ['classes', 'teacher', teacherId, year],
    queryFn: () => {
      if (!teacherId) {
        throw new Error('teacherId is required');
      }
      return getClassesByTeacher(teacherId, year);
    },
    enabled: !!teacherId, // teacherId가 있을 때만 쿼리 실행
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * 부서 목록 조회 훅
 * @param year 연도 (선택)
 */
export function useDepartments(year?: number) {
  return useQuery({
    queryKey: ['classes', 'departments', year],
    queryFn: () => getDepartments(year),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
