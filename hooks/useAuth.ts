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
  signUp: (email: string, password: string, fullName: string) => Promise<any>;
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
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * 이메일과 비밀번호로 로그인
   */
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return error;
    }

    setSession(data.session);
    setUser(data.user);
    return null;
  };

  /**
   * 회원가입
   */
  const signUp = async (email: string, password: string, fullName: string) => {
    const { signUp: signUpApi } = await import('@/lib/supabase/auth');
    const result = await signUpApi(email, password, fullName);

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
