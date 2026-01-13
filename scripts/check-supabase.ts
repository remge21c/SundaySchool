#!/usr/bin/env tsx
/**
 * Supabase 연결 테스트 스크립트
 * 실행: npm run check:supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('   .env.local 파일에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정하세요.');
  process.exit(1);
}

console.log('🔍 Supabase 연결 테스트 중...');
console.log(`   URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // 간단한 쿼리로 연결 테스트
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      // 테이블이 없어도 연결은 성공한 것으로 간주
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('✅ Supabase 연결 성공! (테이블은 아직 생성되지 않았습니다)');
        console.log('   다음 단계: T0.3에서 데이터베이스 스키마를 생성하세요.');
        return;
      }
      throw error;
    }
    
    console.log('✅ Supabase 연결 성공!');
    console.log('✅ 데이터베이스 스키마가 정상적으로 설정되어 있습니다.');
  } catch (error: any) {
    console.error('❌ Supabase 연결 실패:');
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

testConnection();
