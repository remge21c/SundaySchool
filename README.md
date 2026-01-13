# 차세대 주일학교 교적부 웹 애플리케이션

> 행정은 간소하게, 사역은 깊이 있게

## 프로젝트 개요

종이 교적부의 비효율을 해결하고, 학생 이탈 조짐을 조기에 발견하여 목회적 '골든타임'을 확보하는 웹 애플리케이션입니다.

## 기술 스택

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **State Management**: TanStack Query (Server), Zustand (Client)
- **Testing**: Vitest, React Testing Library, Playwright

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Supabase 환경 변수 확인 방법:**
1. [Supabase 대시보드](https://app.supabase.com) 접속
2. 프로젝트 선택 (없으면 새로 생성)
3. 좌측 메뉴: **Settings** → **API**
4. **Project URL**과 **anon public** 키 복사

### 3. Supabase 연결 테스트

```bash
npm run check:supabase
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## Supabase 타입 생성

데이터베이스 스키마를 변경한 후, TypeScript 타입을 자동 생성할 수 있습니다:

```bash
# Supabase CLI 설치 (최초 1회)
npm install -g supabase

# 프로젝트 ID 확인 (Supabase 대시보드 > Settings > General)
# 환경 변수 설정
export SUPABASE_PROJECT_ID=your-project-id

# 타입 생성
npm run gen:types
```

또는 Supabase 대시보드에서:
1. **Settings** → **API** → **Generate types**
2. TypeScript 선택
3. 생성된 타입을 `types/supabase.ts`에 복사

## 프로젝트 구조

```
sunday-school/
├── app/                    # Next.js App Router
├── components/             # 재사용 컴포넌트
├── lib/                    # 유틸리티 함수
│   └── supabase/          # Supabase 클라이언트
├── hooks/                  # 커스텀 훅
├── stores/                 # Zustand 스토어
├── types/                  # TypeScript 타입
├── __tests__/              # 테스트 파일
├── supabase/               # Supabase 마이그레이션
└── docs/planning/          # 기획 문서
```

## 개발 워크플로우

### 태스크 실행

각 태스크는 `docs/planning/06-tasks.md`에 정의되어 있습니다.

태스크를 실행하려면:
```
"T0.1 진행해줘"
또는
"frontend-specialist 역할로 T0.1 진행해줘"
```

### Git Worktree (Phase 1+)

Phase 1 이상의 태스크는 Git Worktree를 사용합니다:

```bash
git worktree add ../project-phase1-auth -b phase/1-auth
cd ../project-phase1-auth
```

## 기획 문서

- `docs/planning/01-prd.md` - 제품 요구사항
- `docs/planning/02-trd.md` - 기술 요구사항
- `docs/planning/03-user-flow.md` - 사용자 흐름
- `docs/planning/04-database-design.md` - DB 설계
- `docs/planning/05-design-system.md` - 디자인 시스템
- `docs/planning/06-tasks.md` - 태스크 목록
- `docs/planning/07-coding-convention.md` - 코딩 컨벤션

## 유용한 명령어

```bash
# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 타입 체크
npm run type-check

# Supabase 연결 테스트
npm run check:supabase

# 타입 생성 (Supabase CLI 필요)
npm run gen:types

# 테스트 실행
npm run test

# 린트
npm run lint

# 포맷팅
npm run format
```

## 배포 및 운영

### 빠른 시작

1. **[배포 체크리스트](./docs/deployment-checklist.md)** - 배포 전 확인 사항
2. **[간단 배포 가이드](./docs/deployment-guide-simple.md)** - 현재 Supabase 프로젝트 사용 시 (파일럿 단계 권장)
3. **[배포 가이드](./docs/deployment-guide.md)** - 프로덕션 환경 배포 방법 (상세)

### 사용자 가이드

- [관리자 매뉴얼](./docs/admin-manual.md) - 시스템 관리자용
- [교사용 사용 가이드](./docs/user-guide.md) - 교사용
- [데이터 마이그레이션 가이드](./docs/data-migration-guide.md) - 기존 데이터 입력 방법

### 환경 변수 설정

`.env.local` 파일을 생성하기 전에 `.env.example` 파일을 참조하세요:

```bash
cp .env.example .env.local
# .env.local 파일을 열어 실제 값으로 수정
```

## 라이선스

ISC
