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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await ((supabase
      .from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single());

    if (error || !data) {
      return false;
    }

    return data.role === 'admin';
  } catch {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await ((supabase
      .from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single());

    if (error || !data) {
      return null;
    }

    return data.role as 'admin' | 'teacher' | 'parent';
  } catch {
    return null;
  }
}
