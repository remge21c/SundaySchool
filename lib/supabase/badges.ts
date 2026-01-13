/**
 * 배지 API 함수
 * Supabase를 사용한 배지 CRUD 작업
 */

import { supabase } from './client';
import type { Database } from '@/types/supabase';

// 타입 정의 (Supabase 타입이 아직 생성되지 않았을 수 있으므로 임시로 정의)
export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  condition_type: string;
  condition_value: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentBadge {
  id: string;
  student_id: string;
  badge_id: string;
  earned_at: string;
  created_at: string;
  badge?: Badge; // 조인된 배지 정보
}

export interface CreateBadgeInput {
  name: string;
  description?: string;
  icon_url?: string;
  condition_type: string;
  condition_value: number;
  is_active?: boolean;
}

export interface UpdateBadgeInput {
  name?: string;
  description?: string;
  icon_url?: string;
  condition_type?: string;
  condition_value?: number;
  is_active?: boolean;
}

/**
 * 모든 배지 목록 조회
 * @returns 배지 배열
 */
export async function getAllBadges(): Promise<Badge[]> {
  const { data, error } = await (supabase
    .from('badges') as any)
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Badge[];
}

/**
 * 활성화된 배지 목록만 조회
 * @returns 활성화된 배지 배열
 */
export async function getActiveBadges(): Promise<Badge[]> {
  const { data, error } = await (supabase
    .from('badges') as any)
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Badge[];
}

/**
 * 학생의 배지 획득 이력 조회
 * @param studentId 학생 ID
 * @returns 학생 배지 배열 (배지 정보 포함)
 */
export async function getStudentBadges(studentId: string): Promise<StudentBadge[]> {
  const { data, error } = await (supabase
    .from('student_badges') as any)
    .select(
      `
      *,
      badges:badge_id (
        id,
        name,
        description,
        icon_url,
        condition_type,
        condition_value,
        is_active,
        created_at,
        updated_at
      )
    `
    )
    .eq('student_id', studentId)
    .order('earned_at', { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as any[]).map((item) => ({
    id: item.id,
    student_id: item.student_id,
    badge_id: item.badge_id,
    earned_at: item.earned_at,
    created_at: item.created_at,
    badge: item.badges as Badge,
  })) as StudentBadge[];
}

/**
 * 배지 생성 (관리자 전용)
 * @param input 배지 데이터
 * @returns 생성된 배지
 */
export async function createBadge(input: CreateBadgeInput): Promise<Badge> {
  const insertData = {
    name: input.name,
    description: input.description ?? null,
    icon_url: input.icon_url ?? null,
    condition_type: input.condition_type,
    condition_value: input.condition_value,
    is_active: input.is_active ?? true,
  };

  const { data, error } = await supabase
    .from('badges')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(insertData as any)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('배지 생성에 실패했습니다.');
  }

  return data as Badge;
}

/**
 * 배지 업데이트 (관리자 전용)
 * @param badgeId 배지 ID
 * @param input 업데이트할 데이터
 * @returns 업데이트된 배지
 */
export async function updateBadge(badgeId: string, input: UpdateBadgeInput): Promise<Badge> {
  const updateData: any = {};

  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description ?? null;
  if (input.icon_url !== undefined) updateData.icon_url = input.icon_url ?? null;
  if (input.condition_type !== undefined) updateData.condition_type = input.condition_type;
  if (input.condition_value !== undefined) updateData.condition_value = input.condition_value;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;

  const { data, error } = await supabase
    .from('badges')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(updateData as any)
    .eq('id', badgeId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('배지 업데이트에 실패했습니다.');
  }

  return data as Badge;
}

/**
 * 배지 삭제 (관리자 전용)
 * @param badgeId 배지 ID
 */
export async function deleteBadge(badgeId: string): Promise<void> {
  const { error } = await supabase
    .from('badges')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .delete()
    .eq('id', badgeId);

  if (error) {
    throw error;
  }
}

/**
 * 학생에게 배지 부여 (관리자 전용 또는 트리거로 자동 생성)
 * @param studentId 학생 ID
 * @param badgeId 배지 ID
 * @param earnedAt 획득일 (기본값: 오늘)
 * @returns 생성된 학생 배지
 */
export async function awardBadgeToStudent(
  studentId: string,
  badgeId: string,
  earnedAt?: string
): Promise<StudentBadge> {
  const insertData = {
    student_id: studentId,
    badge_id: badgeId,
    earned_at: earnedAt ?? new Date().toISOString().split('T')[0],
  };

  const { data, error } = await supabase
    .from('student_badges')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(insertData as any)
    .select()
    .single();

  if (error) {
    // UNIQUE 제약조건 위반 (이미 배지를 획득한 경우)
    if (error.code === '23505') {
      throw new Error('이미 해당 배지를 획득했습니다.');
    }
    throw error;
  }

  if (!data) {
    throw new Error('배지 부여에 실패했습니다.');
  }

  return data as StudentBadge;
}
