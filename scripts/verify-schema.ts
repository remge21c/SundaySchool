#!/usr/bin/env tsx
/**
 * 데이터베이스 스키마 검증 스크립트
 * 실행: npm run verify:schema
 * 
 * Supabase에 마이그레이션이 적용되었는지 확인합니다.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('   .env.local 파일에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정하세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 필요한 테이블 목록
const requiredTables = [
  'profiles',
  'students',
  'classes',
  'attendance_logs',
  'visitation_logs',
  'talent_transactions',
];

async function verifySchema() {
  console.log('🔍 데이터베이스 스키마 검증 중...\n');

  let allPassed = true;

  for (const table of requiredTables) {
    try {
      // 간단한 쿼리로 테이블 존재 확인
      const { error } = await supabase.from(table).select('count').limit(1);
      
      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.log(`❌ ${table}: 테이블이 존재하지 않습니다`);
          allPassed = false;
        } else {
          // RLS 정책으로 인한 에러는 테이블이 존재한다는 의미
          console.log(`✅ ${table}: 테이블 존재 확인`);
        }
      } else {
        console.log(`✅ ${table}: 테이블 존재 확인`);
      }
    } catch (error: any) {
      console.log(`❌ ${table}: 확인 실패 - ${error.message}`);
      allPassed = false;
    }
  }

  console.log('\n' + '='.repeat(50));

  if (allPassed) {
    console.log('✅ 모든 테이블이 정상적으로 생성되었습니다!');
    console.log('\n다음 단계:');
    console.log('1. RLS 정책이 올바르게 적용되었는지 확인하세요.');
    console.log('2. Supabase 대시보드에서 테이블 구조를 확인하세요.');
    console.log('3. 타입을 생성하세요: npm run gen:types');
  } else {
    console.log('❌ 일부 테이블이 생성되지 않았습니다.');
    console.log('\n해결 방법:');
    console.log('1. Supabase 대시보드 > SQL Editor 열기');
    console.log('2. supabase/migrations/001_initial_schema.sql 파일 내용 복사');
    console.log('3. Run 버튼 클릭하여 실행');
    process.exit(1);
  }
}

verifySchema();
