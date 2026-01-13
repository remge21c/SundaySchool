/**
 * Supabase 인증 유틸리티 함수
 * 서버 컴포넌트와 클라이언트 컴포넌트 모두에서 사용 가능한 헬퍼 함수
 */

import { createClient } from './server';
import { supabase } from './client';

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
