/**
 * 학생 리스트 조회를 위한 TanStack Query 훅
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getStudentsByClass,
  getStudentById,
  getAllStudents,
  getStudentsByDepartment,
} from '@/lib/supabase/students';
import type { Student, GetStudentsParams } from '@/types/student';

/**
 * 반별 학생 리스트 조회 훅
 * @param classId 반 ID
 * @param params 추가 필터 조건
 */
export function useStudentsByClass(
  classId: string | null | undefined,
  params: Omit<GetStudentsParams, 'class_id'> = {}
) {
  return useQuery({
    queryKey: ['students', 'class', classId, params],
    queryFn: () => {
      if (!classId) {
        throw new Error('classId is required');
      }
      return getStudentsByClass(classId, params);
    },
    enabled: !!classId, // classId가 있을 때만 쿼리 실행
    staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
  });
}

/**
 * 부서별 학생 리스트 조회 훅
 * @param departmentName 부서명
 * @param params 추가 필터 조건
 */
export function useStudentsByDepartment(
  departmentName: string | null | undefined,
  params: Omit<GetStudentsParams, 'class_id'> = {}
) {
  return useQuery({
    queryKey: ['students', 'department', departmentName, params],
    queryFn: () => {
      if (!departmentName) {
        throw new Error('departmentName is required');
      }
      return getStudentsByDepartment(departmentName, params);
    },
    enabled: !!departmentName, // departmentName이 있을 때만 쿼리 실행
    staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
  });
}

/**
 * 학생 ID로 단일 학생 조회 훅
 * @param studentId 학생 ID
 */
export function useStudent(studentId: string | null | undefined) {
  return useQuery({
    queryKey: ['students', studentId],
    queryFn: () => {
      if (!studentId) {
        throw new Error('studentId is required');
      }
      return getStudentById(studentId);
    },
    enabled: !!studentId, // studentId가 있을 때만 쿼리 실행
    staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
  });
}

/**
 * 모든 활성 학생 조회 훅
 * @param params 필터 조건
 */
export function useAllStudents(params: Omit<GetStudentsParams, 'class_id'> = {}) {
  return useQuery({
    queryKey: ['students', 'all', params],
    queryFn: () => getAllStudents(params),
    staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
  });
}
