/**
 * 학생 리스트 조회를 위한 TanStack Query 훅
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getStudentsByClass,
  getStudentById,
  getAllStudents,
  getStudentsByDepartment,
  updateStudentsClass,
  graduateStudents,
  deleteStudents,
  transferStudentsToDepartment,
  promoteStudentsGrade,
} from '@/lib/supabase/students';
import type { Student, GetStudentsParams } from '@/types/student';

/**
 * 반별 학생 리스트 조회 훅
 * @param classId 반 ID
 * @param params 추가 필터 조건
 */
export function useStudentsByClass(
  classId: string | null | undefined,
  params: Omit<GetStudentsParams, 'class_id'> & { grade?: number | null } = {}
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
  params: Omit<GetStudentsParams, 'class_id'> & { grade?: number | null } = {}
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
export function useAllStudents(
  params: Omit<GetStudentsParams, 'class_id'> & { grade?: number | null } = {}
) {
  return useQuery({
    queryKey: ['students', 'all', params],
    queryFn: () => getAllStudents(params),
    staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
  });
}

/**
 * 학생 일괄 반 이동 훅
 */
export function useUpdateStudentsClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      studentIds,
      targetClassId,
    }: {
      studentIds: string[];
      targetClassId: string;
    }) => updateStudentsClass(studentIds, targetClassId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
}

/**
 * 학생 일괄 졸업 처리 훅
 */
export function useGraduateStudents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      studentIds,
      graduationYear,
      targetClassId,
    }: {
      studentIds: string[];
      graduationYear: number;
      targetClassId?: string;
    }) => graduateStudents(studentIds, graduationYear, targetClassId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
}

/**
 * 학생 일괄 삭제 훅
 */
export function useDeleteStudents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentIds: string[]) => deleteStudents(studentIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
}

/**
 * 학생 부서 이동 훅
 */
export function useTransferToDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      studentIds,
      targetClassId,
    }: {
      studentIds: string[];
      targetClassId: string;
    }) => transferStudentsToDepartment(studentIds, targetClassId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
}

/**
 * 학생 학년 승급 훅
 */
export function usePromoteGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentIds: string[]) => promoteStudentsGrade(studentIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}
