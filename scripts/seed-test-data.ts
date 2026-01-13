/**
 * 테스트 데이터 생성 스크립트
 * 개발 환경에서 반/학생/출석/심방 샘플 데이터를 생성하는 스크립트
 * 
 * 사용법:
 *   npm run seed-test-data
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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.');
  process.exit(1);
}

// Service role key를 사용하여 관리자 권한으로 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// 한국 이름 샘플 데이터
const maleNames = [
  '민준', '서준', '도윤', '예준', '시우', '하준', '주원', '지호', '준서', '건우',
  '현우', '우진', '지훈', '선우', '연우', '정우', '승우', '민성', '준영', '시윤'
];

const femaleNames = [
  '서윤', '지우', '서연', '하은', '민서', '채원', '수아', '지유', '지원', '예은',
  '윤서', '다은', '소윤', '지안', '예린', '채은', '시은', '유나', '아인', '하린'
];

const surnames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임'];

// 랜덤 이름 생성
function generateName(gender?: 'male' | 'female'): { name: string; gender: string } {
  const surname = surnames[Math.floor(Math.random() * surnames.length)];
  const isMale = gender === 'male' || (gender === undefined && Math.random() > 0.5);
  const givenName = isMale
    ? maleNames[Math.floor(Math.random() * maleNames.length)]
    : femaleNames[Math.floor(Math.random() * femaleNames.length)];
  
  return {
    name: `${surname}${givenName}`,
    gender: isMale ? 'male' : 'female',
  };
}

// 랜덤 생년월일 생성 (15-18세)
function generateBirthday(): string {
  const currentYear = new Date().getFullYear();
  const age = 15 + Math.floor(Math.random() * 4); // 15-18세
  const year = currentYear - age;
  const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
  const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 랜덤 전화번호 생성
function generatePhoneNumber(): string {
  const prefixes = ['010', '011', '016', '017', '018', '019'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const middle = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  const last = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `${prefix}-${middle}-${last}`;
}

// 랜덤 주소 생성
function generateAddress(): string {
  const cities = ['서울시', '부산시', '대구시', '인천시', '광주시', '대전시', '울산시'];
  const districts = ['강남구', '강서구', '서초구', '송파구', '마포구', '종로구', '용산구'];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const district = districts[Math.floor(Math.random() * districts.length)];
  const street = `${Math.floor(Math.random() * 100) + 1}길 ${Math.floor(Math.random() * 50) + 1}`;
  return `${city} ${district} ${street}`;
}

// 알레르기 정보 생성
function generateAllergies(): string[] | null {
  const allergies = ['견과류', '우유', '계란', '밀가루', '갑각류', '생선', '복숭아'];
  const hasAllergy = Math.random() > 0.7; // 30% 확률로 알레르기 있음
  if (!hasAllergy) return null;
  
  const count = Math.floor(Math.random() * 2) + 1; // 1-2개
  const selected = new Set<string>();
  while (selected.size < count) {
    selected.add(allergies[Math.floor(Math.random() * allergies.length)]);
  }
  return Array.from(selected);
}

async function seedTestData() {
  console.log('🌱 테스트 데이터 생성 시작...\n');

  try {
    // 1. 관리자 계정 찾기 (반의 main_teacher_id로 사용)
    console.log('1️⃣  관리자 계정 조회 중...');
    const { data: adminProfiles, error: adminError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (adminError) {
      throw adminError;
    }

    if (!adminProfiles || adminProfiles.length === 0) {
      console.error('❌ 관리자 계정을 찾을 수 없습니다.');
      console.error('   먼저 "npm run create-admin"을 실행하여 관리자 계정을 생성하세요.');
      process.exit(1);
    }

    const adminId = adminProfiles[0].id;
    console.log(`   ✅ 관리자 ID: ${adminId}\n`);

    // 2. 반(classes) 생성
    console.log('2️⃣  반 데이터 생성 중...');
    const currentYear = new Date().getFullYear();
    const departments = ['고등부', '중등부', '초등부'];
    const classesToCreate = [];

    for (const dept of departments) {
      // 각 부서마다 2-3개 반 생성
      const classCount = dept === '고등부' ? 3 : 2;
      for (let i = 1; i <= classCount; i++) {
        classesToCreate.push({
          name: `${i}반`,
          department: dept,
          year: currentYear,
          main_teacher_id: adminId, // 임시로 관리자를 담임으로 설정
        });
      }
    }

    const { data: createdClasses, error: classesError } = await supabase
      .from('classes')
      .insert(classesToCreate)
      .select();

    let classes: any[] = [];

    if (classesError) {
      // 이미 데이터가 있는 경우
      if (classesError.code === '23505') {
        console.log('   ⚠️  일부 반이 이미 존재합니다. 기존 데이터를 사용합니다.');
        const { data: existingClasses } = await supabase
          .from('classes')
          .select('*')
          .eq('year', currentYear);
        
        if (existingClasses && existingClasses.length > 0) {
          console.log(`   ✅ 기존 반 ${existingClasses.length}개 사용\n`);
          classes = existingClasses;
        } else {
          throw classesError;
        }
      } else {
        throw classesError;
      }
    } else {
      console.log(`   ✅ 반 ${createdClasses?.length || 0}개 생성 완료\n`);
      classes = createdClasses || [];
    }

    // 3. 학생(students) 생성
    console.log('3️⃣  학생 데이터 생성 중...');
    const studentsToCreate = [];

    for (const classItem of classes) {
      // 각 반마다 10-15명의 학생 생성
      const studentCount = 10 + Math.floor(Math.random() * 6);
      for (let i = 0; i < studentCount; i++) {
        const { name, gender } = generateName();
        const grade = classItem.department === '고등부' 
          ? 10 + Math.floor(Math.random() * 3)  // 10-12학년
          : classItem.department === '중등부'
          ? 7 + Math.floor(Math.random() * 3)   // 7-9학년
          : 1 + Math.floor(Math.random() * 6);  // 1-6학년

        studentsToCreate.push({
          name,
          birthday: generateBirthday(),
          gender,
          school_name: `${classItem.department === '고등부' ? '고등학교' : '중학교'}`,
          grade,
          parent_contact: generatePhoneNumber(),
          address: generateAddress(),
          allergies: generateAllergies(),
          is_active: Math.random() > 0.1, // 90% 확률로 활성 학생
          class_id: classItem.id,
        });
      }
    }

    // 학생 데이터를 배치로 나누어 삽입 (Supabase 제한 고려)
    const batchSize = 50;
    let totalCreated = 0;

    for (let i = 0; i < studentsToCreate.length; i += batchSize) {
      const batch = studentsToCreate.slice(i, i + batchSize);
      const { data: createdStudents, error: studentsError } = await supabase
        .from('students')
        .insert(batch)
        .select();

      if (studentsError) {
        console.error(`   ⚠️  학생 데이터 일부 생성 실패 (배치 ${Math.floor(i / batchSize) + 1}):`, studentsError.message);
      } else {
        totalCreated += createdStudents?.length || 0;
      }
    }

    console.log(`   ✅ 학생 ${totalCreated}명 생성 완료\n`);

    // 4. 출석 기록(attendance_logs) 생성 (최근 4주)
    console.log('4️⃣  출석 기록 데이터 생성 중...');
    const { data: allStudents, error: fetchStudentsError } = await supabase
      .from('students')
      .select('id, class_id')
      .eq('is_active', true)
      .limit(1000); // 최대 1000명까지

    if (fetchStudentsError) {
      throw fetchStudentsError;
    }

    if (allStudents && allStudents.length > 0) {
      const attendanceLogs = [];
      const today = new Date();
      
      // 최근 4주간의 일요일 날짜 계산
      for (let week = 0; week < 4; week++) {
        const date = new Date(today);
        date.setDate(today.getDate() - (week * 7) - (today.getDay() || 7));
        const sunday = date.toISOString().split('T')[0];

        // 각 학생마다 출석 기록 생성 (80% 출석률)
        for (const student of allStudents.slice(0, 200)) { // 최대 200명까지만
          const status = Math.random() > 0.2 ? 'present' : (Math.random() > 0.5 ? 'absent' : 'late');
          
          attendanceLogs.push({
            student_id: student.id,
            class_id: student.class_id,
            date: sunday,
            status,
            reason: status !== 'present' ? (status === 'absent' ? '개인사정' : '지각') : null,
          });
        }
      }

      // 출석 기록을 배치로 나누어 삽입
      let attendanceCreated = 0;
      for (let i = 0; i < attendanceLogs.length; i += batchSize) {
        const batch = attendanceLogs.slice(i, i + batchSize);
        const { error: attendanceError } = await supabase
          .from('attendance_logs')
          .upsert(batch, { onConflict: 'student_id,date' });

        if (attendanceError) {
          // UNIQUE 제약 조건 오류는 무시 (이미 존재하는 기록)
          if (!attendanceError.message.includes('duplicate')) {
            console.error(`   ⚠️  출석 기록 일부 생성 실패:`, attendanceError.message);
          }
        } else {
          attendanceCreated += batch.length;
        }
      }

      console.log(`   ✅ 출석 기록 ${attendanceCreated}건 생성 완료\n`);
    }

    // 5. 심방 기록(visitation_logs) 생성 (최근 2개월)
    console.log('5️⃣  심방 기록 데이터 생성 중...');
    if (allStudents && allStudents.length > 0) {
      const visitationsToCreate = [];
      const today = new Date();
      
      // 최근 2개월간 랜덤 심방 기록
      for (let i = 0; i < Math.min(30, allStudents.length); i++) {
        const student = allStudents[Math.floor(Math.random() * allStudents.length)];
        const daysAgo = Math.floor(Math.random() * 60); // 최근 60일
        const visitDate = new Date(today);
        visitDate.setDate(today.getDate() - daysAgo);
        const dateStr = visitDate.toISOString().split('T')[0];

        const types = ['call', 'visit', 'kakao'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const contents = [
          '학생과 전화 통화했습니다. 잘 지내고 있다고 합니다.',
          '가정 방문했습니다. 가족 모두 건강합니다.',
          '카카오톡으로 연락했습니다. 교회에 나올 예정이라고 합니다.',
          '전화 상담을 진행했습니다. 학교 생활에 대해 이야기했습니다.',
        ];
        
        const prayerRequests = [
          '학교 시험을 위해 기도 요청',
          '가족 건강을 위해 기도 요청',
          '교회 생활 복귀를 위해 기도 요청',
          null,
        ];

        visitationsToCreate.push({
          student_id: student.id,
          teacher_id: adminId,
          visit_date: dateStr,
          type,
          content: contents[Math.floor(Math.random() * contents.length)],
          prayer_request: prayerRequests[Math.floor(Math.random() * prayerRequests.length)],
          is_confidential: Math.random() > 0.8, // 20% 확률로 기밀
        });
      }

      const { error: visitationError } = await supabase
        .from('visitation_logs')
        .insert(visitationsToCreate);

      if (visitationError) {
        console.error(`   ⚠️  심방 기록 생성 실패:`, visitationError.message);
      } else {
        console.log(`   ✅ 심방 기록 ${visitationsToCreate.length}건 생성 완료\n`);
      }
    }

    // 6. 결과 요약
    console.log('✨ 테스트 데이터 생성 완료!\n');
    console.log('📊 생성된 데이터 요약:');
    console.log(`   - 반: ${classes.length}개`);
    console.log(`   - 학생: ${totalCreated}명`);
    if (allStudents) {
      console.log(`   - 활성 학생: ${allStudents.length}명`);
    }
    console.log('\n🔍 확인 방법:');
    console.log('   1. http://localhost:3000/dashboard 접속');
    console.log('   2. 관리자 계정으로 로그인');
    console.log('   3. 출석 체크 페이지에서 반과 학생 확인');
    console.log('   4. 대시보드에서 장기 결석 알림 확인 (4주 이상 결석 학생)');
    console.log('\n⚠️  주의: 이 스크립트는 개발 환경에서만 사용하세요!');

  } catch (error) {
    console.error('\n❌ 오류 발생:');
    console.error(error);
    process.exit(1);
  }
}

seedTestData();
