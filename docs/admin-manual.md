# 관리자 매뉴얼

> 시스템 관리자를 위한 운영 가이드

---

## 목차

1. [관리자 역할](#관리자-역할)
2. [시스템 접속](#시스템-접속)
3. [사용자 관리](#사용자-관리)
4. [데이터 관리](#데이터-관리)
5. [시스템 모니터링](#시스템-모니터링)
6. [문제 해결](#문제-해결)

---

## 관리자 역할

관리자는 다음 권한을 가집니다:

- 모든 반과 학생 정보 조회
- 모든 데이터 접근
- (향후) 사용자 계정 생성 및 관리
- (향후) 시스템 설정 변경

---

## 시스템 접속

### 1. 로그인

1. 웹 애플리케이션 URL 접속 (예: `https://your-app.vercel.app`)
2. **로그인** 페이지에서 관리자 계정으로 로그인
   - 이메일: 관리자 이메일
   - 비밀번호: 설정한 비밀번호

### 2. 대시보드 접속

로그인 후 자동으로 **대시보드** 페이지로 이동합니다.

대시보드에서 다음을 확인할 수 있습니다:
- 빠른 액션 카드 (출석 체크, 학생 관리)
- 장기 결석 알림 (3주 이상 결석한 학생)

---

## 사용자 관리

### 교사 계정 생성

현재 MVP 버전에서는 **Supabase 대시보드**에서 직접 생성합니다.

**Supabase 대시보드 방법:**

1. [Supabase 대시보드](https://app.supabase.com) 접속
2. 프로젝트 선택
3. **Authentication** → **Users**
4. **Add user** → **Create new user**
5. 다음 정보 입력:
   - **Email**: 교사 이메일
   - **Password**: 임시 비밀번호 (4자 이상)
6. **Create user** 클릭
7. 생성된 사용자 ID 복사

**프로필 생성:**

1. **Table Editor** → **profiles** 테이블 열기
2. **Insert row** 클릭
3. 다음 정보 입력:
   - `id`: 위에서 복사한 사용자 ID
   - `role`: `teacher` (또는 `admin`)
   - `email`: 교사 이메일
4. **Save** 클릭

**비밀번호 전달:**

- 생성한 임시 비밀번호를 교사에게 안전하게 전달
- 첫 로그인 시 비밀번호 변경 권장 (향후 기능)

### 교사 계정 관리

- **비밀번호 초기화**: Supabase 대시보드 → Authentication → Users → 해당 사용자 → Reset password
- **계정 비활성화**: (향후 기능) 웹 애플리케이션에서 관리

---

## 데이터 관리

### 반(Class) 데이터 관리

**추가:**

1. Supabase 대시보드 → **Table Editor** → **classes**
2. **Insert row** 클릭
3. 정보 입력 후 **Save**

**수정/삭제:**

1. Table Editor에서 해당 행 클릭
2. 정보 수정 후 **Save** 또는 **Delete**

### 학생 데이터 관리

**추가:**

1. Supabase 대시보드 → **Table Editor** → **students**
2. **Insert row** 클릭
3. 정보 입력 (반 ID 포함) 후 **Save**

**수정/삭제:**

1. Table Editor에서 해당 행 클릭
2. 정보 수정 후 **Save** 또는 **Delete**

### 출석 기록 확인

1. 웹 애플리케이션에서 로그인
2. **출석 체크** 페이지 접속
3. 반 선택 → 날짜 선택 → 출석 기록 확인

또는 Supabase 대시보드:
1. **Table Editor** → **attendance_logs**
2. 필터링 및 정렬로 기록 확인

### 심방 기록 확인

1. 웹 애플리케이션에서 로그인
2. **학생 프로필** 페이지 접속 (출석 체크에서 학생 클릭)
3. 심방 타임라인에서 기록 확인

또는 Supabase 대시보드:
1. **Table Editor** → **visitation_logs**
2. 필터링 및 정렬로 기록 확인

---

## 시스템 모니터링

### 사용자 활동 확인

**Supabase 대시보드:**

1. **Authentication** → **Users**
2. 마지막 로그인 시간, 로그인 횟수 등 확인

### 데이터베이스 상태 확인

1. **Database** → **Tables**
2. 각 테이블의 레코드 수 확인
3. 데이터 증가 추이 확인

### 성능 모니터링

1. **Settings** → **Usage**
2. API 요청 수, 저장 공간 사용량 확인
3. 무료 플랜 한도 확인 (월 500MB 트래픽)

---

## 문제 해결

### 사용자가 로그인할 수 없을 때

1. **계정 존재 확인**
   - Supabase 대시보드 → Authentication → Users
   - 사용자 이메일로 검색

2. **프로필 확인**
   - Table Editor → profiles
   - 해당 사용자 ID의 프로필이 있는지 확인

3. **비밀번호 초기화**
   - Authentication → Users → 해당 사용자
   - Reset password 클릭

### 데이터가 보이지 않을 때

1. **RLS 정책 확인**
   - Supabase 대시보드 → Authentication → Policies
   - 필요한 정책이 활성화되어 있는지 확인

2. **권한 확인**
   - 관리자 계정은 모든 데이터에 접근 가능
   - 교사 계정은 담당 반의 데이터만 접근 가능

### 시스템 오류 발생 시

1. **에러 로그 확인**
   - 브라우저 개발자 도구 (F12) → Console 탭
   - 에러 메시지 확인

2. **Supabase 상태 확인**
   - [Supabase Status Page](https://status.supabase.com) 확인

3. **지원 요청**
   - 문제 상세 내용 기록
   - 에러 메시지 스크린샷
   - 발생 시나리오 설명

---

## 다음 단계

- [교사용 사용 가이드](./user-guide.md) - 교사에게 전달할 가이드
- [데이터 마이그레이션 가이드](./data-migration-guide.md) - 기존 데이터 입력 방법
- [배포 가이드](./deployment-guide.md) - 시스템 배포 및 설정

---

## 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [데이터베이스 설계 문서](./planning/04-database-design.md)
- [RLS 정책 문서](./supabase-rls-policies.md)
