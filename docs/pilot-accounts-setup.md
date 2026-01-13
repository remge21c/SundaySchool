# 파일럿 사용자 계정 생성 가이드

> 테스트용 계정 생성 가이드

**작성일**: 2026-01-13

---

## 방법 1: 교사 직접 회원가입 (5개 계정)

교사가 직접 회원가입 페이지에서 가입합니다.

### 회원가입 링크 전달

교사에게 다음 정보를 전달하세요:

```
안녕하세요.

주일학교 교적부 시스템 파일럿 테스트에 참여해 주셔서 감사합니다.

회원가입 방법:
1. 다음 링크로 접속: https://sunday-school-eta.vercel.app/signup
   또는 메인 페이지(https://sunday-school-eta.vercel.app/)에서 "교사 회원가입" 버튼 클릭
2. 다음 정보를 입력하세요:
   - 이메일: [교사 이메일]
   - 비밀번호: [원하는 비밀번호, 4자 이상]
   - 비밀번호 확인: [동일한 비밀번호]
   - 이름: [교사 이름]
3. "회원가입" 버튼 클릭
4. 자동으로 로그인되어 대시보드로 이동합니다.

담당 반 배정:
- 회원가입 후 관리자가 담당 반을 배정합니다.
- 배정 완료 후 해당 반의 학생 정보를 조회할 수 있습니다.

문의사항이 있으시면 언제든지 연락주세요.

감사합니다.
```

### 교사 목록 (5명)

| 번호 | 이름 | 이메일 | 담당 반 | 상태 | 비고 |
|------|------|--------|---------|------|------|
| 1 | | | | 대기 | 교사가 직접 가입 예정 |
| 2 | | | | 대기 | 교사가 직접 가입 예정 |
| 3 | | | | 대기 | 교사가 직접 가입 예정 |
| 4 | | | | 대기 | 교사가 직접 가입 예정 |
| 5 | | | | 대기 | 교사가 직접 가입 예정 |

---

## 방법 2: 관리자 수동 생성 (테스트 계정)

Supabase 대시보드에서 테스트용 계정을 생성합니다.

### 테스트 계정 정보

다음 테스트 계정들을 생성하세요:

#### 테스트 계정 1
- **이메일**: `test.teacher1@sundayschool.test`
- **비밀번호**: `Test123!@#`
- **이름**: `테스트 교사 1`
- **역할**: `teacher`
- **담당 반**: (선택사항)

#### 테스트 계정 2
- **이메일**: `test.teacher2@sundayschool.test`
- **비밀번호**: `Test123!@#`
- **이름**: `테스트 교사 2`
- **역할**: `teacher`
- **담당 반**: (선택사항)

#### 테스트 계정 3
- **이메일**: `test.teacher3@sundayschool.test`
- **비밀번호**: `Test123!@#`
- **이름**: `테스트 교사 3`
- **역할**: `teacher`
- **담당 반**: (선택사항)

---

### Supabase에서 계정 생성 단계

#### 1단계: 사용자 생성 (Authentication)

각 테스트 계정마다 반복:

1. Supabase 대시보드 → **Authentication** → **Users**
2. **Add user** 버튼 클릭
3. **Create new user** 선택
4. 다음 정보 입력:
   - **Email**: `test.teacher1@sundayschool.test` (각 계정마다 변경)
   - **Password**: `Test123!@#`
   - **Auto Confirm User**: ✅ 체크
5. **Create user** 클릭
6. 생성된 사용자의 **UUID** 복사 (나중에 필요)

#### 2단계: 프로필 생성 (profiles 테이블)

각 테스트 계정마다 반복:

1. **Table Editor** → **profiles**
2. **Insert** → **Insert row** 클릭
3. 다음 정보 입력:
   - **id**: 1단계에서 복사한 사용자 UUID
   - **email**: `test.teacher1@sundayschool.test` (각 계정마다 변경)
   - **role**: `teacher` 선택
   - **full_name**: `테스트 교사 1` (각 계정마다 변경)
4. **Save** 클릭

---

### 테스트 계정 생성 체크리스트

#### 테스트 계정 1
- [ ] Authentication → Users에 사용자 생성
- [ ] UUID 복사: `_________________`
- [ ] Table Editor → profiles에 프로필 생성
- [ ] 로그인 테스트 완료

#### 테스트 계정 2
- [ ] Authentication → Users에 사용자 생성
- [ ] UUID 복사: `_________________`
- [ ] Table Editor → profiles에 프로필 생성
- [ ] 로그인 테스트 완료

#### 테스트 계정 3
- [ ] Authentication → Users에 사용자 생성
- [ ] UUID 복사: `_________________`
- [ ] Table Editor → profiles에 프로필 생성
- [ ] 로그인 테스트 완료

---

## 계정 생성 후 작업

### 1. 로그인 테스트

각 계정으로 로그인 테스트:
- URL: https://sunday-school-eta.vercel.app/
- 이메일과 비밀번호로 로그인
- 정상 로그인 확인

### 2. 담당 반 배정 (선택)

관리자 페이지에서:
- URL: https://sunday-school-eta.vercel.app/admin
- 반 수정 → 담임 교사 선택

### 3. 사용 가이드 전달

- 교사용 사용 가이드: `docs/user-guide.md`
- 관리자 매뉴얼: `docs/admin-manual.md`

---

## 계정 정보 요약

### 교사 직접 가입 (5개)
- 상태: 대기 중
- 가입 방법: 교사가 직접 회원가입 페이지에서 가입
- 프로필: 자동 생성

### 관리자 수동 생성 (3개)
- test.teacher1@sundayschool.test / Test123!@#
- test.teacher2@sundayschool.test / Test123!@#
- test.teacher3@sundayschool.test / Test123!@#

---

## 다음 단계

계정 생성 완료 후:
1. 로그인 테스트
2. 담당 반 배정 (필요시)
3. 사용 가이드 전달
4. 파일럿 테스트 시작
