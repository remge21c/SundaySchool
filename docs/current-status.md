# 현재 상태 및 다음 진행사항

> 2026-01-13 업데이트

---

## ✅ 최근 완료된 작업

### 1. 부서 관리 기능 추가
- ✅ 데이터베이스 마이그레이션: `departments` 테이블 생성
- ✅ API 함수: 부서 CRUD 함수 구현
- ✅ UI 컴포넌트: 부서 관리 섹션 추가
- ✅ 반 생성 시 데이터베이스에서 부서 목록 동적 로드

### 2. 부서 순서 조정 기능 추가
- ✅ 데이터베이스 마이그레이션: `sort_order` 컬럼 추가
- ✅ API 함수: 순서 변경 함수 구현
- ✅ UI 컴포넌트: 위/아래 화살표 버튼 추가

### 3. 기타 개선사항
- ✅ Favicon 추가
- ✅ 교사 회원가입 기능
- ✅ 관리자 페이지 (반 관리, 교사 배정)

---

## 🔴 즉시 진행 필요 (우선순위 높음)

### 1단계: Supabase 마이그레이션 적용

**목표**: 데이터베이스 스키마 업데이트

#### 1.1 부서 관리 테이블 생성
- [ ] Supabase 대시보드 → SQL Editor
- [ ] `supabase/migrations/008_create_departments_table.sql` 실행
- [ ] `departments` 테이블 확인
- [ ] 초기 데이터 4개 확인 (유년부, 초등부, 중등부, 고등부)

#### 1.2 부서 순서 컬럼 추가
- [ ] Supabase 대시보드 → SQL Editor
- [ ] `supabase/migrations/009_add_department_order.sql` 실행
- [ ] `departments` 테이블에 `sort_order` 컬럼 확인
- [ ] 기존 부서들에 순서가 부여되었는지 확인

**예상 소요 시간**: 10분

---

## 🟡 기능 검증 (마이그레이션 적용 후)

### 2단계: 관리자 페이지 검증

**URL**: https://sunday-school-eta.vercel.app/admin  
**관리자 계정**: airemge@gmail.com / ddhqtus1

#### 검증 항목
- [ ] 관리자 페이지 접근 확인
- [ ] 부서 관리 섹션 확인
  - [ ] 부서 목록 표시
  - [ ] 부서 생성 기능
  - [ ] 부서 수정 기능
  - [ ] 부서 삭제 기능
  - [ ] 부서 순서 조정 (위/아래 화살표)
- [ ] 반 관리 섹션 확인
  - [ ] 반 목록 표시
  - [ ] 반 생성 기능 (부서 선택 드롭다운에 데이터베이스 부서 목록 표시)
  - [ ] 반 수정 기능
  - [ ] 교사 배정 기능
  - [ ] 담임 선택 시 교사 이름 표시 확인
  - [ ] 반 삭제 기능
  - [ ] 부서별 필터링

**참고 문서**: `docs/admin-page-verification-guide.md`

**예상 소요 시간**: 20분

---

### 3단계: 교사 회원가입 검증

**URL**: https://sunday-school-eta.vercel.app/signup

#### 검증 항목
- [ ] 회원가입 페이지 접근 확인
- [ ] 입력 필드 검증 확인
- [ ] 정상 회원가입 확인
- [ ] Supabase에서 프로필 자동 생성 확인
  - [ ] Authentication → Users에 사용자 추가 확인
  - [ ] Table Editor → profiles에 프로필 자동 생성 확인
  - [ ] `role`이 `teacher`로 자동 설정되었는지 확인

**참고 문서**: `docs/signup-verification-guide.md`

**예상 소요 시간**: 10분

---

## 🟢 파일럿 준비 (검증 완료 후)

### 4단계: 파일럿 사용자 계정 생성

#### 4.1 교사 계정 생성
- [ ] Supabase 대시보드 → Authentication → Users
- [ ] "Add user" 클릭
- [ ] 이메일/비밀번호 입력
- [ ] "Auto Confirm User" 체크
- [ ] 프로필 생성 (Table Editor → profiles)
  - `id`: 사용자 UUID
  - `email`: 동일한 이메일
  - `role`: `teacher` 또는 `admin`
  - `full_name`: 교사 이름

#### 4.2 계정 정보 전달
- [ ] 이메일/비밀번호를 안전하게 전달
- [ ] 사용 가이드 링크 제공 (`docs/user-guide.md`)

**참고 문서**: `docs/pilot-user-setup.md`

**예상 소요 시간**: 15분

---

### 5단계: 사용 가이드 전달

#### 5.1 사용 가이드 검토
- [ ] `docs/user-guide.md` 검토
- [ ] 부서 관리 기능 설명 추가
- [ ] 반 관리 기능 설명 추가
- [ ] 교사 회원가입 안내 추가

#### 5.2 관리자 매뉴얼 검토
- [ ] `docs/admin-manual.md` 검토
- [ ] 부서 관리 섹션 추가
- [ ] 부서 순서 조정 방법 추가

**예상 소요 시간**: 30분

---

## 📋 체크리스트 요약

### 즉시 진행 (오늘)
- [ ] Supabase 마이그레이션 적용 (008, 009)
- [ ] 관리자 페이지 검증
- [ ] 교사 회원가입 검증

### 파일럿 준비 (1-2일 내)
- [ ] 파일럿 사용자 계정 생성
- [ ] 사용 가이드 전달
- [ ] 관리자 매뉴얼 업데이트

---

## 🎯 다음 마일스톤

### 파일럿 런칭
- 목표: 소규모 부서(고등부)에서 파일럿 테스트
- 기간: 2주
- 성공 지표: 매주 출석 체크를 하는 교사 비율 80% 이상

---

## 📚 관련 문서

- **기능 검증 가이드**: 
  - `docs/admin-page-verification-guide.md`
  - `docs/signup-verification-guide.md`
- **사용 가이드**: `docs/user-guide.md`
- **관리자 매뉴얼**: `docs/admin-manual.md`
- **파일럿 준비**: `docs/pilot-user-setup.md`
- **다음 단계**: `docs/next-steps.md`
