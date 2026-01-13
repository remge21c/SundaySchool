/**
 * 부서 관리 API 함수
 * 부서 CRUD 작업
 */

import { supabase } from './client';

export interface Department {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 모든 부서 조회 (활성화된 부서만)
 * @returns 부서 배열
 */
export async function getAllDepartments(): Promise<Department[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await ((supabase
    .from('departments') as any)
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true }));

  if (error) {
    throw error;
  }

  return (data ?? []) as Department[];
}

/**
 * 모든 부서 조회 (관리자용, 비활성화 포함)
 * @returns 부서 배열
 */
export async function getAllDepartmentsForAdmin(): Promise<Department[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await ((supabase
    .from('departments') as any)
    .select('*')
    .order('name', { ascending: true }));

  if (error) {
    throw error;
  }

  return (data ?? []) as Department[];
}

/**
 * 부서 생성 (관리자 전용)
 * @param input 부서 정보
 * @returns 생성된 부서 정보
 */
export async function createDepartment(input: {
  name: string;
  description?: string;
}): Promise<Department> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await ((supabase
    .from('departments') as any)
    .insert({
      name: input.name,
      description: input.description || null,
      is_active: true,
    })
    .select()
    .single());

  if (error) {
    throw error;
  }

  return data as Department;
}

/**
 * 부서 수정 (관리자 전용)
 * @param departmentId 부서 ID
 * @param input 수정할 부서 정보
 * @returns 수정된 부서 정보
 */
export async function updateDepartment(
  departmentId: string,
  input: {
    name?: string;
    description?: string;
    is_active?: boolean;
  }
): Promise<Department> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await ((supabase
    .from('departments') as any)
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.is_active !== undefined && { is_active: input.is_active }),
    })
    .eq('id', departmentId)
    .select()
    .single());

  if (error) {
    throw error;
  }

  return data as Department;
}

/**
 * 부서 삭제 (관리자 전용)
 * 실제로는 is_active = false로 설정 (소프트 삭제)
 * @param departmentId 부서 ID
 */
export async function deleteDepartment(departmentId: string): Promise<void> {
  // 소프트 삭제: is_active = false로 설정
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await ((supabase
    .from('departments') as any)
    .update({ is_active: false })
    .eq('id', departmentId));

  if (error) {
    throw error;
  }
}
