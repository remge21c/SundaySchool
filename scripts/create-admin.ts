/**
 * 관리자 계정 생성 스크립트
 * 개발 환경에서 초기 관리자 계정을 생성하는 스크립트
 * 
 * 사용법:
 *   npm run create-admin -- email=admin@example.com password=admin123456
 * 
 * 또는 환경 변수로:
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=admin123456 npm run create-admin
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
      const value = match[2].trim().replace(/^["']|["']$/g, ''); // 따옴표 제거
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.');
  console.error('   .env.local 파일을 확인하세요.');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.');
  console.error('   Supabase 대시보드 > Settings > API > service_role key를 복사하세요.');
  console.error('   ⚠️  service_role key는 서버 사이드에서만 사용하세요!');
  process.exit(1);
}

// Service role key를 사용하여 관리자 권한으로 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAdminUser() {
  // 명령줄 인자 또는 환경 변수에서 이메일/비밀번호 가져오기
  const email =
    process.argv.find((arg) => arg.startsWith('email='))?.split('=')[1] ||
    process.env.ADMIN_EMAIL ||
    'admin@example.com';

  const password =
    process.argv.find((arg) => arg.startsWith('password='))?.split('=')[1] ||
    process.env.ADMIN_PASSWORD ||
    'admin123456';

  console.log('📝 관리자 계정 생성 시작...');
  console.log(`   이메일: ${email}`);
  console.log(`   비밀번호: ${password.substring(0, 3)}***`);

  try {
    // 1. 사용자 생성 (Supabase Auth)
    console.log('\n1️⃣  Supabase Auth에 사용자 생성 중...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // 이메일 인증 자동 확인
    });

    let userId: string;

    if (authError) {
      // 이미 존재하는 사용자인 경우
      if (authError.message.includes('already registered')) {
        console.log('   ⚠️  이미 존재하는 사용자입니다. 기존 사용자를 사용합니다.');
        
        // 기존 사용자 조회
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) {
          throw listError;
        }
        
        const existingUser = existingUsers.users.find((u) => u.email === email);
        if (!existingUser) {
          throw new Error('사용자를 찾을 수 없습니다.');
        }
        
        userId = existingUser.id;
        console.log(`   ✅ 기존 사용자 ID: ${userId}`);
      } else {
        throw authError;
      }
    } else {
      if (!authData?.user) {
        throw new Error('사용자 생성에 실패했습니다.');
      }
      userId = authData.user.id;
      console.log(`   ✅ 사용자 생성 완료: ${userId}`);
    }

    // 2. 프로필 생성 (profiles 테이블)
    console.log('\n2️⃣  profiles 테이블에 프로필 생성 중...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: email,
        role: 'admin',
        full_name: '관리자',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileError) {
      // 이미 프로필이 있는 경우
      if (profileError.code === '23505') {
        console.log('   ⚠️  이미 프로필이 존재합니다. 업데이트합니다.');
        
        const { data: updateData, error: updateError } = await supabase
          .from('profiles')
          .update({
            role: 'admin',
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }
        
        console.log('   ✅ 프로필 업데이트 완료');
      } else {
        throw profileError;
      }
    } else {
      console.log('   ✅ 프로필 생성 완료');
    }

    // 3. 결과 출력
    console.log('\n✨ 관리자 계정 생성 완료!');
    console.log('\n📋 로그인 정보:');
    console.log(`   이메일: ${email}`);
    console.log(`   비밀번호: ${password}`);
    console.log(`   사용자 ID: ${userId}`);
    console.log('\n🔐 로그인 방법:');
    console.log(`   1. http://localhost:3000/login 접속`);
    console.log(`   2. 위의 이메일과 비밀번호로 로그인`);
    console.log('\n⚠️  주의: 프로덕션 환경에서는 비밀번호를 변경하세요!');
  } catch (error) {
    console.error('\n❌ 오류 발생:');
    console.error(error);
    process.exit(1);
  }
}

createAdminUser();
