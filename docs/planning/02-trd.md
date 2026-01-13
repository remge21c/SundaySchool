# TRD (기술 요구사항 정의서)

> 개발자/AI 코딩 파트너가 참조하는 기술 문서입니다.
> 기술 표현을 사용하되, "왜 이 선택인지"를 함께 설명합니다.

---

## MVP 캡슐

| # | 항목 | 내용 |
|---|------|------|
| 1 | 목표 | 종이 교적부의 비효율을 해결하고, 학생 이탈 조짐을 조기에 발견하여 목회적 '골든타임'을 확보 |
| 2 | 페르소나 | 바쁜 김교사 (35세, 유년부 담임, 스마트폰 기본 사용 가능) |
| 3 | 핵심 기능 | FEAT-1: 스마트 출석 체크 (모바일에서 터치 한 번으로 출석 처리) |
| 4 | 성공 지표 (노스스타) | 매주 출석 체크를 하는 교사 비율 **80% 이상** |
| 5 | 입력 지표 | 주간 활성 사용자 수 (WAU), 출석 기록 건수, 평균 출석 처리 시간 (3초 이내) |
| 6 | 비기능 요구 | 모바일에서 출석 체크 3초 이내 완료, WCAG 2.1 AA 접근성 준수 |
| 7 | Out-of-scope | 게이미피케이션, 통계 리포트, 학부모 포털, 자동 등반 시스템 (v2로 보류) |
| 8 | Top 리스크 | 교사들의 디지털 기기 익숙도 차이 |
| 9 | 완화/실험 | 극도로 단순한 UI (1~2번 터치로 완료), 온보딩 튜토리얼 (첫 사용 시 3분 가이드) |
| 10 | 다음 단계 | 소규모 부서(고등부) 파일럿 도입, 핵심 기능(출석, 심방) 안정화 |

---

## 1. 시스템 아키텍처

### 1.1 고수준 아키텍처

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Client        │────▶│   Supabase      │────▶│   PostgreSQL    │
│  (Next.js 15)   │     │  (BaaS)         │     │   (Database)    │
│                 │     │                 │     │                 │
│  - App Router   │     │  - Auth         │     │  - RLS Policies │
│  - Server Comp  │     │  - Realtime     │     │  - JSONB        │
│  - TanStack Q   │     │  - Storage      │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│   Vercel        │     │   Supabase      │
│  (Hosting)      │     │  (Hosting)      │
└─────────────────┘     └─────────────────┘
```

### 1.2 컴포넌트 설명

| 컴포넌트 | 역할 | 왜 이 선택? |
|----------|------|-------------|
| Frontend (Next.js 15) | 사용자 인터페이스, 서버 컴포넌트로 초기 로딩 최적화 | AI가 코드를 잘 생성하고, Vercel 배포 최적화, 서버 컴포넌트로 성능 향상 |
| Backend (Supabase) | 인증, 데이터베이스, 실시간 기능, 파일 저장 | 별도 백엔드 서버 구축 불필요, RLS로 보안 강제, 빠른 개발 속도 |
| Database (PostgreSQL) | 관계형 데이터 저장, JSONB로 유연한 데이터 구조 | Supabase 기본 제공, JSONB로 알레르기 등 가변 정보 처리 |

---

## 2. 권장 기술 스택

### 2.1 프론트엔드

| 항목 | 선택 | 이유 | 벤더 락인 리스크 |
|------|------|------|-----------------|
| 프레임워크 | Next.js 15 (App Router) | 서버 컴포넌트로 초기 로딩 최적화, Vercel 배포 최적화, AI 코드 생성에 최적 | 낮음 (오픈소스) |
| 언어 | TypeScript | 정적 타입 지정으로 안정성 확보, AI가 타입 추론에 유리 | - |
| 스타일링 | Tailwind CSS | 유틸리티 퍼스트, AI 코드 생성 최적화, 빠른 개발 | 낮음 (오픈소스) |
| UI Library | Shadcn/UI | Headless 컴포넌트로 커스터마이징 용이, 접근성 내장 | 낮음 (오픈소스) |
| 상태관리 (Server) | TanStack Query | 서버 데이터 캐싱 및 동기화 표준, Optimistic Update 지원 | 낮음 (오픈소스) |
| 상태관리 (Client) | Zustand | 가볍고 직관적, 복잡한 설정 불필요 | 낮음 (오픈소스) |
| HTTP 클라이언트 | Supabase Client | Supabase 공식 클라이언트, 타입 안정성 | 낮음 (Supabase 의존) |

### 2.2 백엔드

| 항목 | 선택 | 이유 | 벤더 락인 리스크 |
|------|------|------|-----------------|
| BaaS | Supabase | PostgreSQL 기반, Auth/Realtime/Storage 내장, RLS 보안 | 중간 (Supabase 의존) |
| 인증 | Supabase Auth | 이메일/비밀번호, 소셜 로그인 (v2), JWT 자동 관리 | 중간 (Supabase 의존) |
| 실시간 | Supabase Realtime | WebSocket 기반 실시간 업데이트 (v2에서 활용) | 중간 (Supabase 의존) |
| 파일 저장 | Supabase Storage | 프로필 이미지, QR코드 이미지 저장 | 중간 (Supabase 의존) |

### 2.3 데이터베이스

| 항목 | 선택 | 이유 |
|------|------|------|
| 메인 DB | PostgreSQL (Supabase) | 관계형 데이터 구조, JSONB로 유연한 데이터 처리, RLS 보안 |
| 캐시 | TanStack Query (메모리 캐시) | 서버 상태 캐싱, 별도 Redis 불필요 (MVP) |

### 2.4 인프라

| 항목 | 선택 | 이유 |
|------|------|------|
| 프론트엔드 호스팅 | Vercel | Next.js 최적화, 자동 배포, 무료 플랜 제공 |
| 백엔드 호스팅 | Supabase | PostgreSQL, Auth, Realtime 통합 제공, 무료 플랜 제공 |
| CI/CD | Vercel (자동) | Git 푸시 시 자동 배포, 별도 설정 불필요 |

---

## 3. 비기능 요구사항

### 3.1 성능

| 항목 | 요구사항 | 측정 방법 |
|------|----------|----------|
| 출석 처리 시간 | < 3초 (P95) | 모바일에서 출석 버튼 클릭부터 완료까지 시간 측정 |
| 초기 로딩 | < 2초 (FCP) | Lighthouse, Vercel Analytics |
| 페이지 전환 | < 500ms | Next.js App Router 클라이언트 네비게이션 |
| 데이터 동기화 | Optimistic Update로 즉각 반응 | TanStack Query Optimistic Update |

### 3.2 보안

| 항목 | 요구사항 |
|------|----------|
| 인증 | Supabase Auth (JWT + Refresh Token) |
| 비밀번호 | bcrypt 해싱 (Supabase 자동 처리) |
| HTTPS | 필수 (Vercel 자동 적용) |
| 입력 검증 | 서버 측 필수 (Supabase RLS + Pydantic 스키마) |
| 데이터 격리 | RLS (Row Level Security)로 DB 레벨 보안 강제 |

### 3.3 확장성

| 항목 | 현재 | 목표 |
|------|------|------|
| 동시 사용자 | MVP: 50명 (파일럿) | v2: 200명 (전체 주일학교) |
| 데이터 용량 | MVP: 100MB | v2: 1GB |
| 월간 트래픽 | MVP: 500MB (Supabase 무료 플랜) | v2: 5GB (유료 플랜 전환) |

---

## 4. 외부 API 연동

### 4.1 인증

| 서비스 | 용도 | 필수/선택 | 연동 방식 |
|--------|------|----------|----------|
| Supabase Auth | 이메일/비밀번호 로그인 | 필수 | Supabase SDK |
| Google OAuth | 소셜 로그인 | 선택 (v2) | OAuth 2.0 (Supabase 제공) |
| Apple 로그인 | 소셜 로그인 | 선택 (v2) | OAuth 2.0 (Supabase 제공) |

### 4.2 기타 서비스

| 서비스 | 용도 | 필수/선택 | 비고 |
|--------|------|----------|------|
| 카카오톡 알림 | 출석/결석 알림 발송 | 선택 (v2) | 카카오톡 비즈니스 API |
| SMS 알림 | 출석/결석 알림 발송 | 선택 (v2) | Supabase Edge Functions 활용 |

---

## 5. 접근제어·권한 모델

### 5.1 역할 정의

| 역할 | 설명 | 권한 |
|------|------|------|
| Admin | 관리자 (목회자) | 모든 데이터 접근, 비밀 심방 내용 열람 가능 |
| Teacher | 교사 | 자신이 담당하는 반(`class_id`)의 학생 정보만 조회/수정 |
| Parent | 학부모 | 자신의 자녀(`parent_contact` 일치) 정보만 조회 (v3) |

### 5.2 권한 매트릭스

| 리소스 | Admin | Teacher | Parent |
|--------|-------|---------|--------|
| 학생 프로필 조회 | O (전체) | O (담당 반만) | O (자녀만, v3) |
| 출석 기록 조회 | O (전체) | O (담당 반만) | O (자녀만, v3) |
| 출석 기록 생성 | O | O (담당 반만) | - |
| 심방 기록 조회 | O (전체) | O (담당 반만, 비밀 제외) | - |
| 심방 기록 생성 | O | O (담당 반만) | - |
| 비밀 심방 열람 | O | - | - |
| 학생 정보 수정 | O | O (담당 반만) | - |

**구현 방법:**
- Supabase RLS (Row Level Security) 정책으로 DB 레벨에서 강제
- 애플리케이션 레벨에서 추가 검증 (이중 보안)

---

## 6. 데이터 생명주기

### 6.1 원칙

- **최소 수집**: 필요한 데이터만 수집 (이름, 학년, 보호자 연락처)
- **명시적 동의**: 개인정보 수집 전 동의 (v3에서 학부모 포털 오픈 시)
- **보존 기한**: 목적 달성 후 삭제 (학생 졸업 후 1년 보관 후 삭제)

### 6.2 데이터 흐름

```
수집 → 저장 → 사용 → 보관 → 삭제/익명화
```

| 데이터 유형 | 보존 기간 | 삭제/익명화 |
|------------|----------|------------|
| 계정 정보 (교사) | 탈퇴 후 30일 | Hard delete |
| 학생 정보 | 졸업 후 1년 | Hard delete |
| 출석 기록 | 졸업 후 1년 | Hard delete |
| 심방 기록 | 졸업 후 1년 | Hard delete (비밀 정보 포함) |
| 달란트 거래 (v2) | 졸업 후 1년 | Hard delete |

---

## 7. 테스트 전략 (Contract-First TDD)

### 7.1 개발 방식: Contract-First Development

본 프로젝트는 **계약 우선 개발(Contract-First Development)** 방식을 채택합니다.
BE/FE가 독립적으로 병렬 개발하면서도 통합 시 호환성을 보장합니다.

```
┌─────────────────────────────────────────────────────────────┐
│                    Contract-First 흐름                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 계약 정의 (Phase 0)                                     │
│     ├─ Supabase 스키마: Database Design 문서 참조          │
│     ├─ TypeScript 타입: Supabase Client 자동 생성          │
│     └─ API 계약: Supabase RPC Functions (필요 시)          │
│                                                             │
│  2. 테스트 선행 작성 (🔴 RED)                               │
│     ├─ FE 테스트: src/__tests__/**/*.test.tsx              │
│     ├─ E2E 테스트: e2e/**/*.spec.ts                        │
│     └─ 모든 테스트가 실패하는 상태 (정상!)                  │
│                                                             │
│  3. Mock 생성 (FE 독립 개발용)                              │
│     └─ MSW 핸들러: src/mocks/handlers/*.ts                 │
│                                                             │
│  4. 병렬 구현 (🔴→🟢)                                       │
│     ├─ FE: Mock API로 개발 → 나중에 실제 Supabase 연결     │
│     └─ DB: RLS 정책 작성 및 테스트                          │
│                                                             │
│  5. 통합 검증                                               │
│     └─ Mock 제거 → E2E 테스트로 전체 흐름 검증              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 테스트 피라미드

| 레벨 | 도구 | 커버리지 목표 | 위치 |
|------|------|-------------|------|
| Unit | Vitest | ≥ 80% | src/__tests__/unit/ |
| Integration | Vitest + MSW | Critical paths | src/__tests__/integration/ |
| E2E | Playwright | Key user flows | e2e/ |

### 7.3 TDD 사이클

모든 기능 개발은 다음 사이클을 따릅니다:

```
🔴 RED    → 실패하는 테스트 먼저 작성
🟢 GREEN  → 테스트를 통과하는 최소한의 코드 구현
🔵 REFACTOR → 테스트 통과 유지하며 코드 개선
```

---

## 8. API 설계 원칙

### 8.1 Supabase 클라이언트 사용

Supabase는 REST API를 자동으로 생성하므로, 별도 API 서버 구축이 불필요합니다.

**예시:**
```typescript
// 출석 기록 조회
const { data, error } = await supabase
  .from('attendance_logs')
  .select('*')
  .eq('class_id', classId)
  .eq('date', today);

// 출석 기록 생성
const { data, error } = await supabase
  .from('attendance_logs')
  .insert({
    student_id: studentId,
    class_id: classId,
    date: today,
    status: 'present'
  });
```

### 8.2 응답 형식

**성공 응답:**
```json
{
  "data": [
    {
      "id": "uuid",
      "student_id": "uuid",
      "status": "present",
      "date": "2025-01-12"
    }
  ]
}
```

**에러 응답:**
```json
{
  "error": {
    "message": "RLS policy violation",
    "code": "PGRST301",
    "details": "New row violates row-level security policy"
  }
}
```

---

## Decision Log 참조

- **D-TECH-01**: 기술 스택 - Next.js 15 + Supabase 선택 (AI 개발 최적화)
- **D-TECH-02**: 백엔드 - 별도 서버 구축 없이 Supabase BaaS 사용 (개발 속도 우선)
- **D-TECH-03**: 상태 관리 - TanStack Query (Server) + Zustand (Client) 분리
- **D-TECH-04**: 보안 - RLS로 DB 레벨 보안 강제 (애플리케이션 레벨 이중 검증)
- **D-TECH-05**: 테스트 - Contract-First TDD 방식 채택 (병렬 개발 지원)
