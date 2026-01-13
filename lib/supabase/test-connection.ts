/**
 * Supabase 연결 테스트 유틸리티
 * 개발 환경에서만 사용
 */

import { supabase } from './client';

export async function testSupabaseConnection(): Promise<boolean> {
  try {
    // 간단한 쿼리로 연결 테스트
    const { error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      // 테이블이 없어도 연결은 성공한 것으로 간주
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('✅ Supabase 연결 성공 (테이블은 아직 생성되지 않음)');
        return true;
      }
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Supabase 연결 실패:', error);
    return false;
  }
}
