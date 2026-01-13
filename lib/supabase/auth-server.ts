/**
 * Supabase 인증 유틸리티 함수 (서버 전용)
 * 서버 컴포넌트에서만 사용 가능
 */

import { createClient } from './server';

/**
 * 서버 사이드: 현재 사용자 세션 가져오기
 */
export async function getServerSession() {
  const supabaseClient = await createClient();
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  return session;
}

/**
 * 서버 사이드: 현재 사용자 정보 가져오기
 */
export async function getServerUser() {
  const supabaseClient = await createClient();
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();
  return user;
}
