/**
 * Supabase 인증 유틸리티 함수 (클라이언트 전용)
 * 클라이언트 컴포넌트에서 사용 가능한 헬퍼 함수
 */

import { supabase } from './client';

/**
 * 클라이언트 사이드: 현재 사용자 세션 가져오기
 */
export async function getClientSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * 클라이언트 사이드: 현재 사용자 정보 가져오기
 */
export async function getClientUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * 회원가입
 * @param email 이메일 주소
 * @param password 비밀번호
 * @param fullName 이름
 * @param position 직책 (기본값: teacher)
 * @returns 성공 시 null, 실패 시 에러 객체
 */
export async function signUp(
  email: string,
  password: string,
  fullName: string,
  position: 'pastor' | 'director' | 'secretary' | 'treasurer' | 'teacher' = 'teacher'
): Promise<{ error: any } | { error: null }> {
  // 1. Supabase Auth에 사용자 생성
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        position: position,
      },
    },
  });

  if (authError) {
    return { error: authError };
  }

  // 2. 프로필 업데이트 (트리거로 자동 생성된 프로필에 full_name, position 추가)
  if (authData.user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: profileError } = await ((supabase
      .from('profiles') as any)
      .update({
        full_name: fullName,
        position: position,
        permission_scope: 'class', // 기본값: 담당 반만
        updated_at: new Date().toISOString(),
      })
      .eq('id', authData.user.id));

    if (profileError) {
      // 프로필 업데이트 실패해도 사용자는 생성되었으므로 경고만
      console.warn('프로필 업데이트 실패:', profileError);
    }

    // 3. 회원가입 후 즉시 로그아웃 (승인 전까지 로그인 차단)
    await supabase.auth.signOut();
  }

  return { error: null };
}
