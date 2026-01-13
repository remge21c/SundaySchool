# Vercel 배포 단계별 가이드

> remge21c GitHub 계정으로 Vercel 배포하기

---

## 전제 조건

- ✅ GitHub에 코드 푸시 완료: `remge21c/SundaySchool`
- ✅ Supabase 환경 변수 확인 (아래 참조)

---

## 1단계: Vercel 계정 생성 및 로그인

1. [Vercel 웹사이트](https://vercel.com) 접속
2. **Sign Up** 또는 **Log In** 클릭
3. **Continue with GitHub** 클릭
4. GitHub 계정 권한 승인
   - `remge21c` 계정으로 로그인
   - Vercel이 GitHub 저장소에 접근할 권한 승인

---

## 2단계: 새 프로젝트 생성

1. Vercel 대시보드에서 **Add New...** → **Project** 클릭
2. **Import Git Repository** 섹션에서:
   - `remge21c/SundaySchool` 저장소 찾기
   - 저장소 옆의 **Import** 버튼 클릭

---

## 3단계: 프로젝트 설정

### 기본 설정 (자동 감지됨)

- **Framework Preset**: Next.js (자동 감지)
- **Root Directory**: `./` (기본값)
- **Build Command**: `npm run build` (기본값)
- **Output Directory**: `.next` (기본값)
- **Install Command**: `npm install` (기본값)

**이 설정들은 기본값 그대로 두면 됩니다.**

---

## 4단계: 환경 변수 설정 (⚠️ 중요!)

**이 단계를 건너뛰면 배포가 실패합니다!**

### 환경 변수 추가

1. **Environment Variables** 섹션으로 스크롤
2. 다음 환경 변수를 하나씩 추가:

#### 환경 변수 1: NEXT_PUBLIC_SUPABASE_URL

- **Key**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: Supabase 프로젝트 URL
  - 형식: `https://xxxxx.supabase.co`
  - Supabase 대시보드 → Settings → API에서 확인
- **Environment**: 
  - ✅ Production
  - ✅ Preview
  - ✅ Development
  - (모두 선택)
- **Add** 클릭

#### 환경 변수 2: NEXT_PUBLIC_SUPABASE_ANON_KEY

- **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: Supabase anon public key
  - 형식: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (긴 JWT 토큰)
  - Supabase 대시보드 → Settings → API에서 확인
- **Environment**: 모두 선택 (Production, Preview, Development)
- **Add** 클릭

#### 환경 변수 3: SUPABASE_SERVICE_ROLE_KEY (선택사항)

- **Key**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: Supabase service_role key
  - 서버 사이드 스크립트용 (선택사항)
  - Supabase 대시보드 → Settings → API에서 확인
- **Environment**: 모두 선택
- **Add** 클릭

### 환경 변수 확인

모든 환경 변수를 추가한 후:
- Key와 Value가 올바른지 확인
- 환경(Production, Preview, Development)이 모두 선택되어 있는지 확인

---

## 5단계: 배포 실행

1. 모든 설정 완료 후 **Deploy** 버튼 클릭
2. 배포 진행 상황 확인:
   - "Building..." 메시지 표시
   - 빌드 로그가 실시간으로 표시됨
   - 약 2-3분 소요

---

## 6단계: 배포 확인

### 배포 성공 시

- ✅ "Ready" 상태 표시
- ✅ 배포 URL 생성 (예: `https://sunday-school-xxxxx.vercel.app`)
- ✅ "Visit" 버튼 클릭하여 사이트 접속

### 배포 실패 시

1. **Build Logs** 확인:
   - 실패한 배포 클릭
   - **Build Logs** 탭에서 에러 메시지 확인

2. **일반적인 문제:**
   - 환경 변수 누락: Environment Variables 확인
   - 빌드 에러: 로컬에서 `npm run build` 테스트
   - 타입 에러: 로컬에서 `npm run type-check` 테스트

---

## 7단계: 배포 후 확인

### 기본 확인

1. 생성된 URL로 접속 (예: `https://sunday-school-xxxxx.vercel.app`)
2. 홈 페이지 로드 확인
3. 로그인 페이지 접속 확인

### 기능 테스트

- [ ] 로그인 기능 작동
- [ ] 대시보드 접속
- [ ] 출석 체크 페이지 접속
- [ ] 데이터베이스 연결 확인

---

## Supabase 환경 변수 확인 방법

환경 변수를 아직 확인하지 않았다면:

1. [Supabase 대시보드](https://app.supabase.com) 접속
2. 프로젝트 선택 (SundaySchool)
3. **Settings** → **API** 메뉴
4. 다음 값 확인:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** 키: `eyJhbGc...`
   - **service_role** 키: `eyJhbGc...` (선택)

**상세 가이드**: [Supabase 환경 변수 확인 가이드](./supabase-env-check.md)

---

## 다음 단계

배포가 완료되면:

1. [배포 후 확인](./deployment-guide.md#배포-후-확인-사항)
2. [데이터 마이그레이션 가이드](./data-migration-guide.md)
3. [관리자 매뉴얼](./admin-manual.md)
4. [교사용 사용 가이드](./user-guide.md)

---

## 문제 해결

### 빌드 실패

- 로컬에서 `npm run build` 실행하여 에러 확인
- 환경 변수 확인
- 타입 체크: `npm run type-check`

### 배포 후 오류

- 브라우저 콘솔 확인 (F12)
- 환경 변수 확인 (Vercel 대시보드)
- Supabase 연결 확인

### 상세 가이드

- [배포 가이드 - 문제 해결](./deployment-guide.md#문제-해결)

---

## 참고

- [간단 배포 가이드](./deployment-guide-simple.md)
- [배포 체크리스트](./deployment-checklist.md)
