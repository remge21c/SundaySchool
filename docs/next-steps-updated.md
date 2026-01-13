# 다음 진행사항 가이드 (최신)

> 2026-01-13 업데이트 (알레르기 편집, 메모집, 교적부 이름 설정 추가 후)

**배포 URL**: https://sunday-school-eta.vercel.app/  
**관리자 계정**: airemge@gmail.com / ddhqtus1

---

## ✅ 최근 완료된 작업

### 1. 알레르기 편집 기능
- ✅ `AllergyEditForm` 컴포넌트 추가
- ✅ 음식/약물 알레르기 태그 관리
- ✅ 학생 프로필 페이지에 통합

### 2. 메모집 기능
- ✅ `student_notes` 테이블 생성 (마이그레이션 012)
- ✅ `NoteForm`, `NoteTimeline` 컴포넌트 추가
- ✅ 학생 프로필 페이지에 통합
- ✅ 메모에 부서-반 정보 표시

### 3. 교적부 이름 설정 기능
- ✅ `app_settings` 테이블 생성 (마이그레이션 013)
- ✅ 관리자 페이지에 교적부 이름 설정 UI 추가
- ✅ Navbar에서 동적으로 교적부 이름 표시

### 4. 모바일 개선
- ✅ Viewport 메타 태그 추가
- ✅ useAuth 훅 타임아웃 및 에러 처리 개선
- ✅ 리다이렉트 로직 개선 (로그인 루프 방지)

---

## 🔴 즉시 진행 필요 (우선순위 높음)

### 1단계: Supabase 마이그레이션 적용 ✅ 완료

**목표**: 데이터베이스 스키마 업데이트

#### 1.1 student_notes 테이블 생성 ✅
- [x] Supabase 대시보드 → SQL Editor
- [x] `supabase/migrations/012_create_student_notes_table.sql` 실행
- [x] `student_notes` 테이블 확인
- [x] RLS 정책 확인

#### 1.2 app_settings 테이블 생성 ✅
- [x] Supabase 대시보드 → SQL Editor
- [x] `supabase/migrations/013_create_app_settings_table.sql` 실행
- [x] `app_settings` 테이블 확인
- [x] 초기 데이터 확인 (1개 행)

---

## 🟡 기능 검증 (마이그레이션 적용 완료)

### 2단계: 새로 추가된 기능 검증

#### 2.1 알레르기 편집 기능 확인
- [ ] 학생 프로필 페이지 접속
- [ ] 알레르기 정보 카드의 "수정" 버튼 클릭
- [ ] 음식 알레르기 추가/삭제 확인
- [ ] 약물 알레르기 추가/삭제 확인
- [ ] 기타 알레르기 입력 확인
- [ ] 저장 후 반영 확인

#### 2.2 메모집 기능 확인
- [ ] 학생 프로필 페이지 접속
- [ ] 메모 작성 폼 확인
  - [ ] 날짜 선택 (기본값: 오늘)
  - [ ] 작성자 표시 (현재 로그인한 교사)
  - [ ] 메모 내용 입력
- [ ] 메모 저장 후 타임라인에 표시 확인
- [ ] 메모에 부서-반 정보 표시 확인
- [ ] 메모 수정/삭제 기능 확인

#### 2.3 교적부 이름 설정 확인
- [ ] 관리자 페이지 접속 (`/admin`)
- [ ] "교적부 이름 설정" 카드 확인
- [ ] 이름 변경 후 저장
- [ ] 상단 Navbar에 변경된 이름 표시 확인
- [ ] 페이지 새로고침 후에도 변경된 이름 유지 확인

**예상 소요 시간**: 20분

---

## 🟢 파일럿 준비 (검증 완료 후)

### 3단계: 파일럿 사용자 계정 생성

#### 3.1 파일럿 사용자 계정 생성

**방법 1: 교사가 직접 회원가입 (권장)**
- [ ] 교사에게 회원가입 링크 전달
- [ ] URL: https://sunday-school-eta.vercel.app/signup
- [ ] 또는 메인 페이지의 "교사 회원가입" 버튼 클릭
- [ ] 교사가 직접 가입 완료 확인

**방법 2: 관리자가 수동 생성**
- [ ] Supabase 대시보드 → Authentication → Users
- [ ] "Add user" 클릭
- [ ] 이메일/비밀번호 입력 (4자 이상)
- [ ] "Auto Confirm User" 체크
- [ ] 프로필 생성 (Table Editor → profiles)
  - `id`: 사용자 UUID
  - `email`: 동일한 이메일
  - `role`: `teacher`
  - `full_name`: 교사 이름

**참고 문서**: `docs/pilot-user-setup.md`, `docs/pilot-accounts-setup.md`

#### 3.2 담당 반 배정
- [ ] 관리자 페이지 → 반 수정
- [ ] 각 교사에게 담당 반 배정
- [ ] 반 목록에서 담임 교사 표시 확인

**예상 소요 시간**: 30분

---

### 4단계: 사용 가이드 전달

#### 4.1 사용 가이드 검토 및 업데이트
- [ ] `docs/user-guide.md` 검토
- [ ] 새로 추가된 기능 설명 추가:
  - [ ] 알레르기 편집 기능
  - [ ] 메모집 기능
  - [ ] 교적부 이름 설정 (관리자용)
- [ ] 관리자 매뉴얼 업데이트 (`docs/admin-manual.md`)

#### 4.2 가이드 전달
- [ ] 사용 가이드 교사들에게 전달
- [ ] 주요 기능 설명
- [ ] 문제 발생 시 연락처 제공

**예상 소요 시간**: 30분

---

## 📋 체크리스트 요약

### 즉시 진행 (오늘)
- [x] **Supabase 마이그레이션 적용** ✅
  - [x] `012_create_student_notes_table.sql` 실행
  - [x] `013_create_app_settings_table.sql` 실행
- [ ] **새로 추가된 기능 검증** ← 다음 단계
  - [ ] 알레르기 편집 기능 확인
  - [ ] 메모집 기능 확인
  - [ ] 교적부 이름 설정 확인

### 파일럿 준비 (1-2일 내)
- [ ] 파일럿 사용자 계정 생성
- [ ] 담당 반 배정
- [ ] 사용 가이드 업데이트 및 전달

---

## 🎯 다음 마일스톤

### 파일럿 런칭
- **목표**: 소규모 부서(고등부)에서 파일럿 테스트
- **기간**: 2주
- **성공 지표**: 매주 출석 체크를 하는 교사 비율 80% 이상

---

## 📚 관련 문서

- **기능 검증 가이드**: 
  - `docs/admin-page-verification-guide.md`
  - `docs/signup-verification-guide.md`
- **마이그레이션 가이드**:
  - `docs/fix-student-insert-policy.md` (학생 추가 RLS 정책)
  - `docs/app-settings-migration-guide.md` (교적부 이름 설정)
- **사용 가이드**: `docs/user-guide.md`
- **관리자 매뉴얼**: `docs/admin-manual.md`
- **파일럿 준비**: 
  - `docs/pilot-user-setup.md`
  - `docs/pilot-accounts-setup.md`
  - `docs/pilot-test-guide.md`

---

## ⚠️ 주의사항

1. **마이그레이션 실행 필수**: 
   - `student_notes` 테이블이 없으면 메모 기능이 작동하지 않습니다.
   - `app_settings` 테이블이 없으면 교적부 이름 설정 기능이 작동하지 않습니다 (404 에러 발생).

2. **모바일 테스트**:
   - 삼성 노트20 등 실제 모바일 기기에서 테스트 권장
   - 브라우저: Chrome, Samsung Internet 등

3. **RLS 정책 확인**:
   - 마이그레이션 실행 후 RLS 정책이 올바르게 적용되었는지 확인
   - Supabase 대시보드 → Authentication → Policies
