/**
 * 달란트 포인트 API 함수
 * Supabase를 사용한 달란트 포인트 CRUD 작업
 */

import { supabase } from './client';
import type { Database } from '@/types/supabase';

type TalentTransactionRow = Database['public']['Tables']['talent_transactions']['Row'];
type TalentTransactionInsert = Database['public']['Tables']['talent_transactions']['Insert'];

export interface TalentTransaction extends TalentTransactionRow { }

// talent_rules 테이블 타입 (Supabase 타입이 아직 생성되지 않았을 수 있으므로 임시로 정의)
export interface TalentRule {
  id: string;
  category: string;
  amount: number;
  description: string | null;
  requires_approval: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTalentRuleInput {
  category: string;
  amount: number;
  description?: string;
  requires_approval?: boolean;
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdateTalentRuleInput {
  category?: string;
  amount?: number;
  description?: string;
  requires_approval?: boolean;
  is_active?: boolean;
  sort_order?: number;
}

/**
 * 학생의 달란트 잔액 조회
 * @param studentId 학생 ID
 * @returns 달란트 잔액 (총합)
 */
export async function getTalentBalance(studentId: string): Promise<number> {
  const { data, error } = await (supabase
    .from('talent_transactions') as any)
    .select('amount')
    .eq('student_id', studentId);

  if (error) {
    throw error;
  }

  const balance = (data ?? []).reduce((sum: number, transaction: { amount: number }) => {
    return sum + transaction.amount;
  }, 0);

  return balance;
}

/**
 * 학생의 달란트 거래 내역 조회
 * @param studentId 학생 ID
 * @param limit 조회할 최대 개수 (기본값: 50)
 * @returns 달란트 거래 배열
 */
export async function getTalentTransactions(
  studentId: string,
  limit: number = 50
): Promise<TalentTransaction[]> {
  const { data, error } = await (supabase
    .from('talent_transactions') as any)
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as TalentTransaction[];
}

/**
 * 달란트 거래 생성 (교사 승인 항목)
 * @param studentId 학생 ID
 * @param category 카테고리 (예: "성경 암송", "전도")
 * @returns 생성된 달란트 거래
 */
export async function awardTalentByCategory(
  studentId: string,
  category: string
): Promise<TalentTransaction> {
  // talent_rules에서 해당 카테고리의 포인트 조회
  const { data: rule, error: ruleError } = await (supabase
    .from('talent_rules') as any)
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .single();

  if (ruleError) {
    throw new Error(`달란트 규칙을 찾을 수 없습니다: ${category}`);
  }

  if (!rule) {
    throw new Error(`활성화된 달란트 규칙이 없습니다: ${category}`);
  }

  // 달란트 거래 생성
  const insertData = {
    student_id: studentId,
    amount: rule.amount,
    category: category,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from('talent_transactions') as any)
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('달란트 거래 생성에 실패했습니다.');
  }

  return data as TalentTransaction;
}

/**
 * 달란트 규칙 목록 조회
 * @returns 달란트 규칙 배열 (sort_order 순서대로)
 */
export async function getTalentRules(): Promise<TalentRule[]> {
  const { data, error } = await (supabase
    .from('talent_rules') as any)
    .select('*')
    .order('sort_order', { ascending: true })
    .order('category', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as TalentRule[];
}

/**
 * 활성화된 달란트 규칙만 조회 (교사 승인 필요한 항목)
 * @returns 활성화된 달란트 규칙 배열
 */
export async function getActiveTalentRules(): Promise<TalentRule[]> {
  const { data, error } = await (supabase
    .from('talent_rules') as any)
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('category', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as TalentRule[];
}

/**
 * 달란트 규칙 생성 (관리자 전용)
 * @param input 달란트 규칙 데이터
 * @returns 생성된 달란트 규칙
 */
export async function createTalentRule(input: CreateTalentRuleInput): Promise<TalentRule> {
  const insertData = {
    category: input.category,
    amount: input.amount,
    description: input.description ?? null,
    requires_approval: input.requires_approval ?? false,
    is_active: input.is_active ?? true,
    sort_order: input.sort_order ?? 0,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from('talent_rules') as any)
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('달란트 규칙 생성에 실패했습니다.');
  }

  return data as TalentRule;
}

/**
 * 달란트 규칙 업데이트 (관리자 전용)
 * @param ruleId 규칙 ID
 * @param input 업데이트할 데이터
 * @returns 업데이트된 달란트 규칙
 */
export async function updateTalentRule(
  ruleId: string,
  input: UpdateTalentRuleInput
): Promise<TalentRule> {
  const updateData: any = {};

  if (input.category !== undefined) updateData.category = input.category;
  if (input.amount !== undefined) updateData.amount = input.amount;
  if (input.description !== undefined) updateData.description = input.description ?? null;
  if (input.requires_approval !== undefined) updateData.requires_approval = input.requires_approval;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;
  if (input.sort_order !== undefined) updateData.sort_order = input.sort_order;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from('talent_rules') as any)
    .update(updateData)
    .eq('id', ruleId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('달란트 규칙 업데이트에 실패했습니다.');
  }

  return data as TalentRule;
}

/**
 * 달란트 규칙 삭제 (관리자 전용)
 * @param ruleId 규칙 ID
 */
export async function deleteTalentRule(ruleId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase
    .from('talent_rules') as any)
    .delete()
    .eq('id', ruleId);

  if (error) {
    throw error;
  }
}

/**
 * 달란트 거래 수정
 * @param transactionId 거래 ID
 * @param input 수정할 데이터
 * @returns 수정된 거래
 */
export interface UpdateTalentTransactionInput {
  amount?: number;
  category?: string;
}

export async function updateTalentTransaction(
  transactionId: string,
  input: UpdateTalentTransactionInput
): Promise<TalentTransaction> {
  const updateData: any = {};

  if (input.amount !== undefined) updateData.amount = input.amount;
  if (input.category !== undefined) updateData.category = input.category;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from('talent_transactions') as any)
    .update(updateData)
    .eq('id', transactionId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('달란트 거래 수정에 실패했습니다.');
  }

  return data as TalentTransaction;
}

/**
 * 달란트 거래 삭제
 * @param transactionId 거래 ID
 */
export async function deleteTalentTransaction(transactionId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase
    .from('talent_transactions') as any)
    .delete()
    .eq('id', transactionId);

  if (error) {
    throw error;
  }
}
