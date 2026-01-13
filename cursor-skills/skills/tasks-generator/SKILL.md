# Tasks Generator 스킬 (Cursor 버전)

> TDD 워크플로우, Git Worktree, Phase 번호, 태스크 독립성 규칙이 적용된 TASKS.md를 생성합니다.
> /socrates 완료 후 호출되거나 독립적으로 실행 가능합니다.

---

## 트리거 키워드

다음 키워드가 감지되면 이 스킬을 발동합니다:
- "태스크 생성해줘"
- "TASKS.md 만들어줘"
- "/tasks-generator"
- "태스크 목록 만들어줘"

---

## 역할

`docs/planning/`의 기획 문서들(PRD, TRD, Database Design 등)을 읽고,
오케스트레이터와 서브 에이전트가 사용할 **TASKS.md**를 생성합니다.

---

## 워크플로우

### 1단계: 기획 문서 읽기

다음 파일들을 순서대로 읽습니다:

```
docs/planning/
├── 01-prd.md           # 제품 요구사항 → 기능 목록 추출
├── 02-trd.md           # 기술 요구사항 → 기술 스택 확인
├── 03-user-flow.md     # 사용자 흐름 → 마일스톤 구조화
├── 04-database-design.md # DB 설계 → DB 태스크 추출
└── 05-design-system.md # 디자인 시스템 → UI 태스크 참고
```

### 2단계: 규칙 파일 읽기

**필수!** TASKS 생성 전에 반드시 읽습니다:

```
cursor-skills/skills/tasks-generator/references/tasks-rules.md
```

### 3단계: TASKS.md 생성

규칙을 적용하여 `docs/planning/06-tasks.md` 생성

### 4단계: 다음 단계 안내

TASKS 생성 완료 후, 사용자에게 다음 단계를 안내합니다:

```
✅ TASKS.md 생성이 완료되었습니다!

📁 생성된 파일:
- docs/planning/06-tasks.md

---

🔜 다음 단계: 프로젝트 환경 셋업

에이전트 팀과 프로젝트 구조를 생성하려면:
"프로젝트 셋업해줘" 또는 "에이전트 팀 만들어줘"

라고 말씀해주세요!

또는 기획 문서만 필요하시다면 이대로 사용하셔도 됩니다.
```

---

## 핵심 규칙 요약

상세 규칙은 `references/tasks-rules.md`에 있습니다.

### Phase 번호 규칙

| Phase | Git Worktree | 설명 |
|-------|-------------|------|
| Phase 0 | 불필요 | main 브랜치에서 직접 작업 |
| Phase 1+ | **필수** | 별도 worktree에서 작업 |

### TDD 워크플로우

```
Phase 1+ 태스크는 반드시:
1. RED: 테스트 먼저 작성 (실패 확인)
2. GREEN: 최소 구현 (테스트 통과)
3. REFACTOR: 리팩토링 (테스트 유지)
```

### 태스크 독립성

```
각 태스크는 독립적으로 실행 가능해야 함:
- 의존성이 있으면 Mock 설정 포함
- 병렬 실행 가능 여부 명시
```

---

## 출력 형식

### 파일 위치

```
docs/planning/06-tasks.md
```

### 문서 구조

```markdown
# TASKS: {프로젝트명} - AI 개발 파트너용 태스크 목록

## MVP 캡슐
1. 목표: ...
2. 페르소나: ...
...
10. 다음 단계: ...

---

## 마일스톤 개요

| 마일스톤 | 설명 | 주요 기능 |
|----------|------|----------|
| M0 | 프로젝트 셋업 | Phase 0 |
| M1 | FEAT-0 공통 흐름 | Phase 1 |
| M2 | FEAT-1 핵심기능 | Phase 2 |
...

---

## M0: 프로젝트 셋업

### [] Phase 0, T0.1: {태스크명}
**담당**: {specialist}
**산출물**: ...

---

## M1: FEAT-0 공통 흐름

### [] Phase 1, T1.1: {태스크명} RED→GREEN
**담당**: {specialist}

**Git Worktree 설정**:
git worktree add ../project-phase1-{feature} -b phase/1-{feature}

**TDD 사이클**:
1. RED: 테스트 작성
2. GREEN: 구현
3. REFACTOR: 정리

**산출물**: ...
**인수 조건**: ...

---

## 의존성 그래프
(Mermaid flowchart)

## 병렬 실행 가능 태스크
(테이블)
```

---

## 담당자 매핑

| 태스크 유형 | 담당 에이전트 |
|------------|--------------|
| 프로젝트 구조, 빌드 설정 | frontend-specialist |
| DB 스키마, 마이그레이션 | database-specialist |
| API 엔드포인트, 비즈니스 로직 | backend-specialist |
| UI 컴포넌트, 상태관리 | frontend-specialist |
| 테스트 작성, 품질 검증 | test-specialist |

---

## 독립 실행

기획 문서가 이미 있는 경우 독립적으로 실행 가능:

```
사용자: "태스크 생성해줘"
또는
사용자: "TASKS.md 만들어줘"
```

이 경우 `docs/planning/`에서 기존 문서를 읽고 TASKS.md만 생성합니다.

---

## 참조 파일

```
cursor-skills/skills/tasks-generator/
├── SKILL.md                    ← 이 파일
└── references/
    └── tasks-rules.md          ← TASKS 생성 규칙
```

