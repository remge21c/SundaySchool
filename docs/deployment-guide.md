# 배포 가이드

> 프로덕션 환경 배포를 위한 단계별 가이드

---

## 목차

1. [개요](#개요)
2. [프로덕션 Supabase 설정](#프로덕션-supabase-설정)
3. [Vercel 배포](#vercel-배포)
4. [환경 변수 설정](#환경-변수-설정)
5. [배포 후 확인 사항](#배포-후-확인-사항)
6. [문제 해결](#문제-해결)

---

## 개요

이 애플리케이션은 **Vercel**에서 호스팅하고, **Supabase**를 백엔드로 사용합니다.

### 필수 요구사항

- GitHub 계정 (Vercel과 연동)
- Supabase 계정 (프로덕션 프로젝트)
- 도메인 (선택사항, Vercel 무료 도메인 사용 가능)

---

## 프로덕션 Supabase 설정

### 1. 새 프로젝트 생성

1. [Supabase 대시보드](https://app.supabase.com) 접속
2. **New Project** 클릭
3. 프로젝트 정보 입력:
   - **Name**: `sunday-school-prod` (또는 원하는 이름)
   - **Database Password**: 강력한 비밀번호 설정 (안전하게 보관)
   - **Region**: 한국 사용자라면 `Northeast Asia (Seoul)` 권장
4. **Create new project** 클릭 (생성에 몇 분 소요)

### 2. 데이터베이스 스키마 적용

프로덕션 데이터베이스에 스키마를 적용합니다:

1. Supabase 대시보드에서 프로젝트 선택
2. 좌측 메뉴: **SQL Editor**
3. `supabase/migrations/001_initial_schema.sql` 파일 내용을 복사
4. SQL Editor에 붙여넣기
5. **Run** 클릭하여 실행
6. 성공 메시지 확인

### 3. 환경 변수 확인

1. 좌측 메뉴: **Settings** → **API**
2. 다음 값들을 메모 (나중에 Vercel에 입력):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** 키: `eyJhbGc...`
   - **service_role** 키: `eyJhbGc...` (비밀 관리, 환경 변수에만 사용)

---

## Vercel 배포

### 1. Vercel 계정 생성 및 GitHub 연동

1. [Vercel](https://vercel.com) 접속
2. **Sign Up** → **Continue with GitHub** 클릭
3. GitHub 계정으로 로그인
4. 권한 승인

### 2. 프로젝트 GitHub에 푸시 (아직 안 했다면)

```bash
# Git 초기화 (아직 안 했다면)
git init

# GitHub에 새 저장소 생성 후
git remote add origin https://github.com/your-username/sunday-school.git
git branch -M main
git add .
git commit -m "Initial commit: MVP 완료"
git push -u origin main
```

### 3. Vercel에서 프로젝트 배포

1. Vercel 대시보드: **Add New...** → **Project**
2. GitHub 저장소 선택
3. 프로젝트 설정:
   - **Framework Preset**: Next.js (자동 감지)
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `npm run build` (기본값)
   - **Output Directory**: `.next` (기본값)
   - **Install Command**: `npm install` (기본값)
4. **Environment Variables** 섹션으로 스크롤
5. 환경 변수 추가 (아래 참조)
6. **Deploy** 클릭

### 4. 환경 변수 설정

Vercel 프로젝트 설정에서 다음 환경 변수를 추가합니다:

| 변수명 | 값 | 설명 |
|--------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` | Supabase anon 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` | Service role 키 (서버 사이드용, 선택) |

**환경 변수 추가 방법:**
1. Vercel 프로젝트 설정 → **Environment Variables**
2. **Add New** 클릭
3. **Key**와 **Value** 입력
4. **Environment** 선택 (Production, Preview, Development 모두 선택 가능)
5. **Save** 클릭

### 5. 첫 배포 완료

- 배포가 완료되면 Vercel이 자동으로 URL을 생성합니다 (예: `https://your-project.vercel.app`)
- 배포 로그를 확인하여 에러가 없는지 확인합니다
- 생성된 URL로 접속하여 애플리케이션이 정상 작동하는지 확인합니다

---

## 배포 후 확인 사항

### 1. 기본 기능 확인

- [ ] 홈 페이지 접속 가능
- [ ] 로그인 페이지 접속 가능
- [ ] 로그인 기능 작동
- [ ] 대시보드 접속 가능
- [ ] 출석 체크 페이지 접속 가능

### 2. 관리자 계정 생성

프로덕션 환경에서 관리자 계정을 생성합니다:

```bash
# 로컬에서 실행 (환경 변수를 프로덕션 Supabase로 변경 필요)
# .env.local 파일을 임시로 프로덕션 값으로 변경
npm run create-admin
```

또는 Supabase 대시보드에서:
1. **Authentication** → **Users**
2. **Add user** → **Create new user**
3. 이메일과 비밀번호 입력
4. 생성 후 **profiles** 테이블에서 `role`을 `admin`으로 설정

### 3. 데이터베이스 연결 확인

```bash
# 로컬 환경 변수를 프로덕션으로 변경 후
npm run check:supabase
```

---

## 환경 변수 설정

### 로컬 개발 환경 (`.env.local`)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-role-key

# 데이터베이스 (선택, 로컬 개발용)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sunday_school
```

### 프로덕션 환경 (Vercel)

Vercel 대시보드에서 환경 변수를 설정합니다. 위의 [환경 변수 설정](#4-환경-변수-설정) 섹션을 참조하세요.

---

## 문제 해결

### 배포 실패

1. **빌드 로그 확인**
   - Vercel 대시보드 → 프로젝트 → **Deployments** → 실패한 배포 → **Build Logs**
   - 에러 메시지 확인

2. **일반적인 문제**
   - 환경 변수 누락: Vercel 프로젝트 설정에서 환경 변수 확인
   - 타입 에러: 로컬에서 `npm run type-check` 실행하여 확인
   - 빌드 에러: 로컬에서 `npm run build` 실행하여 확인

### 데이터베이스 연결 실패

1. **Supabase 프로젝트 상태 확인**
   - Supabase 대시보드에서 프로젝트가 활성 상태인지 확인

2. **환경 변수 확인**
   - Vercel에서 환경 변수가 올바르게 설정되었는지 확인
   - URL과 키에 오타가 없는지 확인

3. **RLS 정책 확인**
   - Supabase 대시보드 → **Authentication** → **Policies**
   - 필요한 RLS 정책이 적용되어 있는지 확인

### 로그인 실패

1. **사용자 생성 확인**
   - Supabase 대시보드 → **Authentication** → **Users**
   - 사용자가 생성되어 있는지 확인

2. **프로필 확인**
   - Supabase 대시보드 → **Table Editor** → **profiles**
   - 사용자에 대한 프로필 레코드가 있는지 확인

---

## 다음 단계

배포가 완료되면:

1. [데이터 마이그레이션 가이드](./data-migration-guide.md) 참조 (작성 예정)
2. [관리자 매뉴얼](./admin-manual.md) 참조 (작성 예정)
3. [교사용 사용 가이드](./user-guide.md) 참조 (작성 예정)

---

## 참고 자료

- [Vercel 공식 문서](https://vercel.com/docs)
- [Supabase 공식 문서](https://supabase.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
