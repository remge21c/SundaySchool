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
  sort_order: number;
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
    .order('sort_order', { ascending: true }));

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
    .order('sort_order', { ascending: true }));

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
  // 마지막 순서 찾기
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: lastDept } = await ((supabase
    .from('departments') as any)
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single());

  const nextOrder = lastDept ? (lastDept as Department).sort_order + 1 : 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await ((supabase
    .from('departments') as any)
    .insert({
      name: input.name,
      description: input.description || null,
      is_active: true,
      sort_order: nextOrder,
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

/**
 * 부서 순서 변경 (관리자 전용)
 * @param departmentId 부서 ID
 * @param direction 'up' 또는 'down'
 */
export async function moveDepartment(
  departmentId: string,
  direction: 'up' | 'down'
): Promise<void> {
  // 현재 부서 정보 가져오기
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: currentDept, error: fetchError } = await ((supabase
    .from('departments') as any)
    .select('sort_order')
    .eq('id', departmentId)
    .single());

  if (fetchError || !currentDept) {
    throw fetchError || new Error('부서를 찾을 수 없습니다.');
  }

  const currentOrder = (currentDept as Department).sort_order;
  const targetOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;

  // 대상 위치의 부서 찾기
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: targetDept, error: targetError } = await ((supabase
    .from('departments') as any)
    .select('id, sort_order')
    .eq('sort_order', targetOrder)
    .single());

  if (targetError || !targetDept) {
    // 이동할 대상이 없으면 (첫 번째 또는 마지막) 아무것도 하지 않음
    return;
  }

  const targetId = (targetDept as Department).id;

  // 두 부서의 순서 교환
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError1 } = await ((supabase
    .from('departments') as any)
    .update({ sort_order: targetOrder })
    .eq('id', departmentId));

  if (updateError1) {
    throw updateError1;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError2 } = await ((supabase
    .from('departments') as any)
    .update({ sort_order: currentOrder })
    .eq('id', targetId));

  if (updateError2) {
    throw updateError2;
  }
}
