'use client';

import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, fullName: string, position?: 'pastor' | 'director' | 'secretary' | 'treasurer' | 'teacher') => Promise<any>;
  signOut: () => Promise<void>;
}

export type UseAuthReturn = AuthState & AuthActions;

/**
 * Supabase 인증을 관리하는 커스텀 훅
 * 
 * @returns {UseAuthReturn} 인증 상태와 액션 함수
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 타임아웃 설정 (5초 후 로딩 해제)
    const timeoutId = setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 5000);

    // 초기 세션 확인
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (!mounted) return;

        if (error) {
          console.error('세션 조회 에러:', error);
        }

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        clearTimeout(timeoutId);
      })
      .catch((error) => {
        console.error('세션 조회 실패:', error);
        if (mounted) {
          setLoading(false);
          clearTimeout(timeoutId);
        }
      });

    // 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      clearTimeout(timeoutId);
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  /**
   * 이메일과 비밀번호로 로그인
   */
  const signIn = async (email: string, password: string) => {
    // 1. Supabase 로그인 시도
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return error;
    }

    if (data.session) {
      // 2. RPC 함수로 프로필 상태 확인 (RLS 우회)
      const { data: status, error: statusError } = await supabase.rpc('get_my_status');

      // 에러 발생 시 로그만 남기고 진행 (함수가 없거나 프로필이 없는 경우)
      if (statusError) {
        console.error('프로필 상태 확인 실패:', statusError);
      } else if (status === 'pending') {
        // 3. 승인 대기 중이면 즉시 로그아웃 및 에러 반환
        await supabase.auth.signOut();
        return new Error('승인 대기 중입니다. 관리자에게 문의하세요.');
      } else if (status === 'rejected') {
        // 4. 거절된 상태면 로그아웃
        await supabase.auth.signOut();
        return new Error('승인이 거절되었습니다. 관리자에게 문의하세요.');
      }

      // 5. 승인된 사용자면 세션 업데이트
      setSession(data.session);
      setUser(data.session.user);
    }

    return null;
  };

  /**
   * 회원가입
   */
  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    position: 'pastor' | 'director' | 'secretary' | 'treasurer' | 'teacher' = 'teacher'
  ) => {
    const { signUp: signUpApi } = await import('@/lib/supabase/auth');
    const result = await signUpApi(email, password, fullName, position);

    if (result.error) {
      return result.error;
    }

    // 회원가입 성공 시 세션 확인
    // 이메일 인증이 활성화된 경우 세션이 없을 수 있음
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setSession(session);
      setUser(session.user);
    }
    // 세션이 없어도 회원가입은 성공한 것으로 간주
    return null;
  };

  /**
   * 로그아웃
   */
  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  return {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
  };
}
