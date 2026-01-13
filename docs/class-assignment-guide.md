# 반 배정 가이드

교사가 회원가입한 후 반을 배정하는 방법을 안내합니다.

## 방법 1: Supabase 대시보드에서 직접 배정 (즉시 사용 가능)

### 1단계: 교사 UUID 확인
1. [Supabase 대시보드](https://app.supabase.com) 접속
2. **Authentication** → **Users** 메뉴 클릭
3. 회원가입한 교사의 이메일을 찾아 **UUID** 복사
   - 예: `ed5bae57-5ccc-4d8e-b209-cc2e16d8a2c9`

### 2단계: 반에 교사 배정
1. **Table Editor** → **classes** 메뉴 클릭
2. 교사를 배정할 반을 찾아 **편집** 클릭
3. **main_teacher_id** 필드에 위에서 복사한 교사 UUID 입력
4. **Save** 클릭

### 3단계: 확인
1. 교사 계정으로 로그인
2. 대시보드에서 자신이 담당하는 반이 표시되는지 확인
3. 출석 체크 페이지에서 반이 보이는지 확인

---

## 방법 2: SQL로 직접 배정 (고급)

Supabase 대시보드의 **SQL Editor**에서 실행:

```sql
-- 1. 교사 UUID 확인 (이메일로 검색)
SELECT id, email, full_name, role 
FROM profiles 
WHERE email = 'teacher@example.com';

-- 2. 반에 교사 배정
UPDATE classes 
SET main_teacher_id = '교사_UUID_여기' 
WHERE id = '반_UUID_여기';

-- 예시: 유년부 사랑반에 교사 배정
UPDATE classes 
SET main_teacher_id = 'ed5bae57-5ccc-4d8e-b209-cc2e16d8a2c9' 
WHERE department = '유년부' AND name = '사랑반' AND year = 2026;
```

---

## 방법 3: 관리자 페이지에서 배정 (향후 구현)

관리자 페이지에서 반 배정 UI를 구현하면 더 편리하게 사용할 수 있습니다.

**구현 예정 기능:**
- 교사 목록 조회
- 반 목록 조회
- 드래그 앤 드롭 또는 드롭다운으로 반 배정
- 배정 이력 관리

---

## 주의사항

1. **RLS 정책**: 교사는 자신이 담당하는 반(`main_teacher_id`)의 데이터만 조회/수정할 수 있습니다.
2. **반 배정 전**: 교사가 로그인해도 담당 반이 없으면 데이터를 볼 수 없습니다.
3. **반 배정 후**: 교사는 자신이 담당하는 반의 학생, 출석, 심방 기록을 관리할 수 있습니다.

---

## 문제 해결

### 교사가 반을 볼 수 없는 경우
1. `classes` 테이블에서 해당 교사의 `main_teacher_id`가 올바르게 설정되었는지 확인
2. 교사 UUID가 정확한지 확인 (대소문자 구분)
3. 반의 `year`가 현재 연도와 일치하는지 확인

### 여러 반에 배정하고 싶은 경우
현재 시스템은 한 교사가 한 반만 담당할 수 있습니다. 여러 반을 담당하려면:
- 각 반에 별도의 교사 계정 생성
- 또는 향후 구현될 "보조 교사" 기능 사용

---

## 관련 문서
- [파일럿 사용자 설정 가이드](./pilot-user-setup.md)
- [데이터 입력 가이드](./data-input-guide.md)
