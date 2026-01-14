#!/usr/bin/env tsx
/**
 * 마이그레이션 실행 가이드 스크립트
 * 실행: npm run migrate
 * 
 * Supabase 마이그레이션 파일들을 확인하고 실행 방법을 안내합니다.
 * 
 * 참고: Supabase JavaScript 클라이언트로는 SQL을 직접 실행할 수 없으므로,
 * Supabase CLI 또는 대시보드의 SQL Editor를 사용해야 합니다.
 */

import * as fs from 'fs';
import * as path from 'path';

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');

interface MigrationFile {
  name: string;
  path: string;
  content: string;
}

/**
 * 마이그레이션 파일 목록 조회
 */
function getMigrationFiles(): MigrationFile[] {
  if (!fs.existsSync(migrationsDir)) {
    console.error(`❌ 마이그레이션 디렉토리가 없습니다: ${migrationsDir}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  return files.map((file) => ({
    name: file,
    path: path.join(migrationsDir, file),
    content: fs.readFileSync(path.join(migrationsDir, file), 'utf-8'),
  }));
}

/**
 * 마이그레이션 실행 가이드 출력
 */
function printMigrationGuide(files: MigrationFile[]) {
  console.log('📋 Supabase 마이그레이션 실행 가이드\n');
  console.log('='.repeat(60));
  console.log('');

  console.log('✅ 발견된 마이그레이션 파일:');
  files.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file.name}`);
  });

  console.log('');
  console.log('='.repeat(60));
  console.log('');

  console.log('📝 실행 방법:\n');

  console.log('방법 1: Supabase CLI 사용 (권장)\n');
  console.log('   1. Supabase CLI 설치:');
  console.log('      npm install -g supabase\n');
  console.log('   2. 프로젝트 연결:');
  console.log('      supabase link --project-ref YOUR_PROJECT_REF\n');
  console.log('   3. 마이그레이션 적용:');
  console.log('      supabase db push\n');
  console.log('   또는 특정 마이그레이션만 실행:');
  console.log('      supabase db reset  # (주의: 모든 데이터 삭제)');
  console.log('');

  console.log('방법 2: Supabase 대시보드 SQL Editor 사용\n');
  console.log('   1. Supabase 대시보드 접속');
  console.log('   2. SQL Editor 열기');
  console.log('   3. 아래 마이그레이션 파일들을 순서대로 실행:\n');
  
  files.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file.name}`);
    console.log(`      경로: ${file.path}\n`);
  });

  console.log('='.repeat(60));
  console.log('');

  console.log('⚠️  중요 사항:');
  console.log('   - 마이그레이션은 순서대로 실행해야 합니다');
  console.log('   - 프로덕션 환경에서는 백업을 먼저 수행하세요');
  console.log('   - RLS 정책 변경은 기존 데이터 접근에 영향을 줄 수 있습니다');
  console.log('');

  console.log('🔍 마이그레이션 상태 확인:');
  console.log('   npm run verify:schema');
  console.log('');
}

/**
 * 특정 마이그레이션 파일 내용 출력
 */
function printMigrationContent(fileName: string) {
  const files = getMigrationFiles();
  const file = files.find((f) => f.name === fileName);

  if (!file) {
    console.error(`❌ 마이그레이션 파일을 찾을 수 없습니다: ${fileName}`);
    process.exit(1);
  }

  console.log(`📄 ${file.name}\n`);
  console.log('='.repeat(60));
  console.log(file.content);
  console.log('='.repeat(60));
}

/**
 * 주요 마이그레이션 파일 목록 출력
 */
function printKeyMigrations() {
  const files = getMigrationFiles();
  
  const keyMigrations = [
    '024_create_class_teachers_table.sql',
    '025_update_rls_for_multiple_teachers.sql',
  ];

  console.log('🔑 실행해야 할 주요 마이그레이션:\n');
  
  keyMigrations.forEach((keyMigration) => {
    const file = files.find((f) => f.name === keyMigration);
    if (file) {
      console.log(`✅ ${keyMigration}`);
      console.log(`   경로: ${file.path}\n`);
    } else {
      console.log(`❌ ${keyMigration} (파일 없음)\n`);
    }
  });
}

// 메인 실행
const args = process.argv.slice(2);
const command = args[0];

if (command === 'list') {
  const files = getMigrationFiles();
  files.forEach((file, index) => {
    console.log(`${index + 1}. ${file.name}`);
  });
} else if (command === 'show' && args[1]) {
  printMigrationContent(args[1]);
} else if (command === 'key') {
  printKeyMigrations();
} else {
  const files = getMigrationFiles();
  printMigrationGuide(files);
  
  // 주요 마이그레이션도 함께 표시
  console.log('');
  printKeyMigrations();
}
