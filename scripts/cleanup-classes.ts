/**
 * 부서별로 한 반만 남기고 나머지 삭제하는 스크립트
 * 테스트를 쉽게 하기 위한 데이터 정리
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// .env.local 파일에서 환경 변수 읽기
function loadEnv() {
  try {
    const envPath = join(process.cwd(), '.env.local');
    const envFile = readFileSync(envPath, 'utf-8');
    const envVars: Record<string, string> = {};
    
    envFile.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          envVars[key.trim()] = value.trim();
        }
      }
    });
    
    return envVars;
  } catch (error) {
    console.warn('⚠️  .env.local 파일을 읽을 수 없습니다. 환경 변수를 직접 설정하세요.');
    return {};
  }
}

const envVars = loadEnv();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  console.error('   NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 확인하세요.');
  process.exit(1);
}

// Service Role Key를 사용하여 RLS 정책을 우회
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupClasses() {
  try {
    console.log('🔍 현재 부서별 반 개수 확인 중...\n');

    // 1단계: 현재 상태 확인
    const { data: currentClasses, error: selectError } = await supabase
      .from('classes')
      .select('id, name, department, created_at')
      .order('department')
      .order('created_at', { ascending: true });

    if (selectError) {
      throw selectError;
    }

    if (!currentClasses || currentClasses.length === 0) {
      console.log('✅ 삭제할 반이 없습니다.');
      return;
    }

    // 부서별로 그룹화
    const classesByDepartment = currentClasses.reduce((acc, cls) => {
      if (!acc[cls.department]) {
        acc[cls.department] = [];
      }
      acc[cls.department].push(cls);
      return acc;
    }, {} as Record<string, typeof currentClasses>);

    // 현재 상태 출력
    console.log('📊 현재 상태:');
    for (const [department, classes] of Object.entries(classesByDepartment)) {
      console.log(`   ${department}: ${classes.length}개 반`);
      classes.forEach((cls, index) => {
        const marker = index === 0 ? '✅ (유지)' : '❌ (삭제 예정)';
        console.log(`      ${marker} ${cls.name} (생성일: ${new Date(cls.created_at).toLocaleDateString('ko-KR')})`);
      });
    }

    // 삭제할 반 ID 목록 (각 부서별 첫 번째 반 제외)
    const classesToDelete = currentClasses.filter((cls, index, arr) => {
      // 같은 부서의 첫 번째 반인지 확인
      const isFirstInDepartment = arr.findIndex(c => c.department === cls.department) === index;
      return !isFirstInDepartment;
    });

    if (classesToDelete.length === 0) {
      console.log('\n✅ 이미 각 부서별로 한 반만 있습니다. 삭제할 반이 없습니다.');
      return;
    }

    console.log(`\n🗑️  ${classesToDelete.length}개 반을 삭제합니다...`);

    // 2단계: 삭제 실행
    const classIdsToDelete = classesToDelete.map(cls => cls.id);
    
    // RLS 정책 때문에 직접 DELETE가 안 될 수 있으므로, 각 반을 개별적으로 삭제
    let deletedCount = 0;
    for (const classId of classIdsToDelete) {
      const { error: deleteError } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId);

      if (deleteError) {
        console.error(`   ❌ 반 삭제 실패 (ID: ${classId}):`, deleteError.message);
      } else {
        deletedCount++;
        const deletedClass = classesToDelete.find(c => c.id === classId);
        console.log(`   ✅ 삭제 완료: ${deletedClass?.department} - ${deletedClass?.name}`);
      }
    }

    console.log(`\n✅ 삭제 완료: ${deletedCount}/${classesToDelete.length}개 반 삭제됨`);

    // 3단계: 결과 확인
    console.log('\n🔍 삭제 후 상태 확인 중...\n');
    const { data: remainingClasses, error: finalSelectError } = await supabase
      .from('classes')
      .select('id, name, department')
      .order('department')
      .order('name');

    if (finalSelectError) {
      throw finalSelectError;
    }

    const remainingByDepartment = remainingClasses.reduce((acc, cls) => {
      if (!acc[cls.department]) {
        acc[cls.department] = [];
      }
      acc[cls.department].push(cls);
      return acc;
    }, {} as Record<string, typeof remainingClasses>);

    console.log('📊 최종 상태:');
    for (const [department, classes] of Object.entries(remainingByDepartment)) {
      console.log(`   ${department}: ${classes.length}개 반`);
      classes.forEach(cls => {
        console.log(`      ✅ ${cls.name}`);
      });
    }

    console.log('\n✅ 작업 완료!');
  } catch (error: any) {
    console.error('\n❌ 오류 발생:');
    console.error(error.message);
    
    if (error.message?.includes('permission') || error.message?.includes('policy')) {
      console.error('\n💡 RLS 정책 때문에 삭제가 실패했습니다.');
      console.error('   Supabase 대시보드에서 직접 SQL을 실행하세요:');
      console.error('   1. Supabase 대시보드 → SQL Editor');
      console.error('   2. 다음 SQL 실행:');
      console.error('\n   DELETE FROM classes');
      console.error('   WHERE id NOT IN (');
      console.error('     SELECT DISTINCT ON (department) id');
      console.error('     FROM classes');
      console.error('     ORDER BY department, created_at ASC');
      console.error('   );');
    }
    
    process.exit(1);
  }
}

cleanupClasses();
