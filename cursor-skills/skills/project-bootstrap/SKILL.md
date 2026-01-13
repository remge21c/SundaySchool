# Project Bootstrap 스킬 (Cursor 버전)

> 프로젝트용 AI 에이전트 팀 구조를 생성하고, 실제 프로젝트 환경까지 셋업합니다.

---

## 트리거 키워드

다음 키워드가 감지되면 이 스킬을 발동합니다:
- "에이전트 팀 만들어줘"
- "에이전트 팀 구성"
- "프로젝트 셋업해줘"
- "프로젝트 환경 만들어줘"

**주의**: 단순 코딩 요청이나 일반 프로젝트 생성 요청에는 반응하지 않습니다.

---

## 필수 실행 규칙

**중요: 이 스킬은 반드시 아래 단계를 순서대로 실행해야 합니다. 단계를 건너뛰지 말 것.**

---

## 1단계: 기술 스택 확인 (필수 질문)

사용자가 기술 스택을 명시했는지 확인합니다.

### Case A: 기술 스택이 명시된 경우

예: "FastAPI + React로 프로젝트 셋업해줘"

→ **2단계로 진행** (하위 선택 질문)

### Case B: 기술 스택이 명시되지 않은 경우

예: "프로젝트 셋업해줘", "에이전트 팀 만들어줘"

→ 다음 메시지를 출력한 후 기획 여부 확인:

```
기술 스택이 지정되지 않았습니다.

다음 중 선택해주세요:

1. 기획부터 시작 (권장)
   - "기획해줘"라고 말씀해주시면 21개 질문으로 기획을 진행합니다.

2. 기술 스택 직접 선택
   - 백엔드: FastAPI / Django / Express / Rails
   - 프론트엔드: React+Vite / Next.js / SvelteKit / Remix
   - 데이터베이스: PostgreSQL / MySQL / SQLite / MongoDB

   예: "FastAPI + React + PostgreSQL로 셋업해줘"
```

---

## 2단계: 하위 기술 스택 선택 (필수 질문)

### 질문 2-1: 데이터베이스 선택

```
어떤 데이터베이스를 사용하시겠습니까?

1. PostgreSQL (권장) - 벡터 DB 지원, 확장성
2. MySQL - 범용 관계형 DB
3. SQLite - 로컬 개발, 간단한 프로젝트
4. MongoDB - NoSQL 문서 DB

번호 또는 이름으로 선택해주세요:
```

### 질문 2-2: 인증 포함 여부

```
인증 기능(로그인/회원가입/프로필)을 포함할까요?

1. 예 (권장) - JWT 인증 + 로그인/회원가입/프로필 페이지
2. 아니오 - 인증 없이 기본 구조만
```

### 질문 2-3: 추가 기능 선택 (다중 선택)

```
추가로 필요한 기능이 있나요? (복수 선택 가능, 콤마로 구분)

1. 벡터 DB (PGVector) - AI/RAG 애플리케이션용
2. Redis 캐시 - 세션/캐시 저장소
3. 3D 엔진 (Three.js) - 3D 시각화
4. 없음

예: 1, 2 또는 "없음"
```

---

## 3단계: 프로젝트 셋업 확인 (필수 질문)

```
프로젝트 환경을 셋업할까요?

1. 예 (권장) - 에이전트 정의 + 백엔드 + 프론트엔드 + Docker
2. 에이전트 정의만 - .cursor/agents/ 파일만 생성
```

---

## 4단계: 프로젝트 생성

사용자 선택에 따라 다음을 생성합니다.

### 4-1. 에이전트 정의 생성 (항상 실행)

`cursor-skills/agents/` 디렉토리의 템플릿을 기반으로 에이전트 파일을 생성합니다.

```
.cursor/
  agents/
    orchestrator.md
    backend-specialist.md
    frontend-specialist.md
    database-specialist.md
    test-specialist.md
    3d-engine-specialist.md (3D 선택 시)
```

### 4-2. Docker Compose 생성

선택한 데이터베이스에 따라 docker-compose.yml을 생성합니다.

| 선택 | 포함 서비스 |
|------|------------|
| PostgreSQL | postgres |
| PostgreSQL + 벡터 | postgres + pgvector |
| PostgreSQL + Redis | postgres + redis |
| MySQL | mysql |
| MongoDB | mongodb |

### 4-3. 백엔드 생성

선택한 프레임워크에 따라 백엔드 구조를 생성합니다.

| 프레임워크 | 구조 |
|-----------|------|
| FastAPI | Python + SQLAlchemy + JWT |
| Express | Node.js + TypeScript + JWT |
| Rails | Ruby on Rails 8 + JWT |
| Django | Python + DRF |

### 4-4. 프론트엔드 생성

선택한 프레임워크에 따라 프론트엔드 구조를 생성합니다.

| 프레임워크 | 구조 |
|-----------|------|
| React + Vite | React 19 + Zustand + TailwindCSS |
| Next.js | App Router + Zustand + TailwindCSS |
| SvelteKit | Svelte 5 + TailwindCSS |
| Remix | Remix + TailwindCSS |

### 4-5. Git 초기화

```bash
git init
git add .
git commit -m "Initial commit: project setup"
```

---

## 5단계: 의존성 설치 확인 (필수 질문)

프로젝트 생성 완료 후 **반드시** 다음을 질문합니다:

```
✅ 프로젝트 셋업이 완료되었습니다!

의존성 설치와 DB 마이그레이션을 진행할까요?

1. 예 - Docker 시작 + 의존성 설치 + DB 마이그레이션
2. 아니오 - 나중에 수동으로 진행
```

### "예" 선택 시 실행할 명령어 안내:

```bash
# Docker 시작
docker compose up -d

# 백엔드 의존성 설치 (FastAPI 기준)
cd backend
pip install -r requirements.txt

# 프론트엔드 의존성 설치
cd ../frontend
npm install

# DB 마이그레이션 (있는 경우)
cd ../backend
alembic upgrade head
```

---

## 6단계: 다음 단계 안내

의존성 설치 완료 후 다음을 안내합니다:

```
✅ 프로젝트 셋업이 완료되었습니다!

📁 생성된 구조:
project-root/
├── .cursor/agents/       # 에이전트 정의
├── backend/              # 백엔드 (FastAPI)
├── frontend/             # 프론트엔드 (React)
├── docs/planning/        # 기획 문서 (있는 경우)
└── docker-compose.yml    # Docker 설정

---

🔜 다음 단계 선택:

1. 기획 문서가 없는 경우:
   "기획해줘" → 21개 질문으로 기획 진행

2. 기획 문서가 있는 경우:
   "T1.1 진행해줘" → 첫 번째 태스크 시작

3. 서버 실행:
   - 백엔드: cd backend && uvicorn app.main:app --reload
   - 프론트엔드: cd frontend && npm run dev
```

---

## 지원 기술 스택

### 백엔드 (✓ = 인증 템플릿 포함)

| Framework | Auth | 설명 |
|-----------|------|------|
| FastAPI ✓ | ✅ | Python + SQLAlchemy + JWT + Alembic |
| Express ✓ | ✅ | Node.js + TypeScript + JWT |
| Rails ✓ | ✅ | Ruby on Rails 8 + JWT/Session |
| Django | ❌ | Python + DRF |

### 프론트엔드 (✓ = 인증 UI 포함)

| Framework | Auth | 설명 |
|-----------|------|------|
| React+Vite ✓ | ✅ | React 19 + Zustand + TailwindCSS |
| Next.js ✓ | ✅ | App Router + Zustand + TailwindCSS |
| SvelteKit ✓ | ✅ | Svelte 5 + TailwindCSS |
| Remix ✓ | ✅ | Remix + TailwindCSS |

### 데이터베이스

| DB | Docker Template |
|----|-----------------|
| PostgreSQL | postgres |
| PostgreSQL + PGVector | postgres-pgvector |
| PostgreSQL + Redis | postgres-redis |
| MySQL | mysql |
| MongoDB | mongodb |

---

## 인증 UI 페이지 (인증 포함 선택 시 생성)

| 경로 | 기능 |
|------|------|
| `/login` | 로그인 |
| `/register` | 회원가입 |
| `/profile` | 프로필 (비밀번호 변경, 로그아웃, 계정 삭제) |

---

## 참조 파일

```
cursor-skills/skills/project-bootstrap/
├── SKILL.md              ← 이 파일
└── references/
    └── (에이전트 템플릿은 cursor-skills/agents/에 있음)
```

