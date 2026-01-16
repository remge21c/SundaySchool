/**
 * 인증 관련 유틸리티 함수
 */

import { supabase } from '@/lib/supabase/client';

/**
 * 현재 사용자가 관리자인지 확인
 * @returns 관리자 여부
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    // RPC 함수로 역할 확인 (RLS 우회)
    const { data: role, error } = await supabase.rpc('get_my_role');

    if (error) {
      console.error('관리자 권한 확인 중 에러:', error);
      return false;
    }

    return role === 'admin';
  } catch (err) {
    console.error('관리자 권한 확인 중 예외:', err);
    return false;
  }
}

/**
 * 현재 사용자의 역할 조회
 * @returns 역할 ('admin' | 'teacher' | 'parent' | null)
 */
export async function getUserRole(): Promise<'admin' | 'teacher' | 'parent' | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    // RPC 함수로 역할 확인 (RLS 우회)
    const { data: role, error } = await supabase.rpc('get_my_role');

    if (error || !role) {
      return null;
    }

    return role as 'admin' | 'teacher' | 'parent';
  } catch {
    return null;
  }
}
