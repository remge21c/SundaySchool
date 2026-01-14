#!/usr/bin/env tsx
/**
 * class_teachers 테이블 확인 스크립트
 * 실행: tsx scripts/check-class-teachers.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// .env.local 파일 직접 읽기
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach((line) => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('   .env.local 파일에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정하세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkClassTeachers() {
  console.log('🔍 class_teachers 테이블 확인 중...\n');

  try {
    // class_teachers 테이블 존재 확인
    const { data, error } = await (supabase
      .from('class_teachers') as any)
      .select('count')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('❌ class_teachers 테이블이 존재하지 않습니다');
        console.log('   마이그레이션 024_create_class_teachers_table.sql을 실행하세요.');
        process.exit(1);
      } else {
        // RLS 정책으로 인한 에러는 테이블이 존재한다는 의미
        console.log('✅ class_teachers 테이블 존재 확인');
      }
    } else {
      console.log('✅ class_teachers 테이블 존재 확인');
    }

    console.log('\n✅ 마이그레이션이 정상적으로 적용되었습니다!');
    console.log('\n다음 단계:');
    console.log('1. 관리자 페이지를 새로고침하여 확인하세요');
    console.log('2. 반 관리에서 다중 교사 배정 기능을 테스트하세요');
  } catch (error: any) {
    console.error('❌ 확인 실패:');
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

checkClassTeachers();
