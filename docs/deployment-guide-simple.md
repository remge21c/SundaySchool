# 간단 배포 가이드 (현재 Supabase 프로젝트 사용)

> 파일럿 단계: 개발 중 사용하는 Supabase 프로젝트를 그대로 사용

---

## 전제 조건

- ✅ Supabase 프로젝트가 이미 생성되어 있음 (개발 중 사용 중)
- ✅ 데이터베이스 스키마가 이미 적용되어 있음
- ✅ 환경 변수가 `.env.local`에 설정되어 있음

---

## 1단계: Supabase 환경 변수 확인

현재 사용 중인 Supabase 프로젝트의 환경 변수를 확인합니다.

**상세 가이드**: [Supabase 환경 변수 확인 가이드](./supabase-env-check.md) 참조

**빠른 확인 방법:**
1. [Supabase 대시보드](https://app.supabase.com) 접속
2. 개발 중 사용 중인 프로젝트 선택
3. 좌측 메뉴: **Settings** → **API**
4. 다음 값들을 메모해두세요 (Vercel 배포 시 필요):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** 키: `eyJhbGc...` (JWT 토큰)
   - **service_role** 키: `eyJhbGc...` (서버 사이드용, 선택사항)

---

## 2단계: GitHub 준비 (Vercel 배포 시 필요)

Vercel은 GitHub와 연동하여 배포합니다. 코드가 GitHub에 없으면 먼저 푸시해야 합니다.

### GitHub 저장소가 이미 있는 경우

```bash
# 현재 변경사항 확인
git status

# 변경사항 커밋
git add .
git commit -m "docs: 배포 준비 문서 추가"

# GitHub에 푸시
git push origin main
```

### GitHub 저장소가 없는 경우

1. [GitHub](https://github.com)에서 새 저장소 생성
2. 로컬에서 GitHub 저장소 연결:

```bash
# Git 초기화 (아직 안 했다면)
git init

# GitHub 저장소 연결
git remote add origin https://github.com/your-username/sunday-school.git

# 코드 커밋 및 푸시
git add .
git commit -m "Initial commit: MVP 완료"
git branch -M main
git push -u origin main
```

---

## 3단계: Vercel 배포

### 1. Vercel 계정 생성

1. [Vercel](https://vercel.com) 접속
2. **Sign Up** → **Continue with GitHub** 클릭
3. GitHub 계정으로 로그인 및 권한 승인

### 2. 프로젝트 배포

1. Vercel 대시보드: **Add New...** → **Project**
2. GitHub 저장소 선택 (방금 푸시한 저장소)
3. 프로젝트 설정:
   - **Framework Preset**: Next.js (자동 감지됨)
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `npm run build` (기본값)
   - **Output Directory**: `.next` (기본값)
   - **Install Command**: `npm install` (기본값)

### 3. 환경 변수 설정

**중요**: 환경 변수를 설정하지 않으면 배포가 실패합니다!

1. **Environment Variables** 섹션으로 스크롤
2. 다음 환경 변수 추가:

| Key | Value | 설명 |
|-----|-------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | 1단계에서 확인한 Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` | 1단계에서 확인한 anon public 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` | 1단계에서 확인한 service_role 키 (선택사항) |

**환경 변수 추가 방법:**
- 각 변수를 하나씩 추가:
  1. **Key** 입력
  2. **Value** 입력
  3. **Environment** 선택 (Production, Preview, Development 모두 선택 권장)
  4. **Add** 클릭

### 4. 배포 실행

1. 모든 설정 완료 후 **Deploy** 클릭
2. 배포 진행 상황 확인 (약 2-3분 소요)
3. 배포 완료 후 URL 확인 (예: `https://your-project.vercel.app`)

---

## 4단계: 배포 확인

### 1. 기본 확인

1. 생성된 URL로 접속 (예: `https://your-project.vercel.app`)
2. 홈 페이지 로드 확인
3. 로그인 페이지 접속 확인

### 2. 로그인 테스트

1. 로그인 페이지 접속
2. 기존에 생성한 관리자 계정으로 로그인 테스트
   - 로그인이 안 되면: Supabase 대시보드 → Authentication → Users에서 계정 확인

### 3. 기능 확인

- [ ] 대시보드 접속
- [ ] 출석 체크 페이지 접속
- [ ] 학생 프로필 페이지 접속 (학생 데이터가 있다면)

---

## 문제 해결

### 배포 실패

1. **빌드 로그 확인**
   - Vercel 대시보드 → 프로젝트 → **Deployments** → 실패한 배포 → **Build Logs**
   - 에러 메시지 확인

2. **일반적인 문제**
   - 환경 변수 누락: 환경 변수가 올바르게 설정되었는지 확인
   - 타입 에러: 로컬에서 `npm run type-check` 실행하여 확인
   - 빌드 에러: 로컬에서 `npm run build` 실행하여 확인

### 로그인 실패

1. **계정 확인**
   - Supabase 대시보드 → Authentication → Users
   - 사용자가 존재하는지 확인

2. **환경 변수 확인**
   - Vercel 프로젝트 설정 → Environment Variables
   - `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 올바른지 확인

---

## 다음 단계

배포가 완료되면:

1. **[데이터 마이그레이션 가이드](./data-migration-guide.md)** - 실제 데이터 입력
2. **[관리자 매뉴얼](./admin-manual.md)** - 시스템 운영
3. **[교사용 사용 가이드](./user-guide.md)** - 파일럿 사용자에게 전달

---

## 참고

- 상세 가이드: [배포 가이드](./deployment-guide.md)
- 체크리스트: [배포 체크리스트](./deployment-checklist.md)
