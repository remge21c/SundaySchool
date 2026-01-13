# 학생 정보 수정 RLS 정책 추가 가이드

> 학생 정보 수정 기능이 작동하지 않는 문제 해결

**문제**: 학생 프로필에서 정보 수정 시 데이터가 저장되지 않음  
**원인**: `students` 테이블에 UPDATE RLS 정책이 없음  
**해결**: UPDATE 정책 추가

---

## 해결 방법

### 1. Supabase 대시보드에서 SQL 실행

1. Supabase 대시보드 접속
2. **SQL Editor** 메뉴 클릭
3. 아래 SQL을 복사하여 실행:

```sql
-- students 테이블 UPDATE 정책 추가
-- 교사는 자신이 담당하는 반의 학생 정보 수정 가능, 관리자는 모든 학생 정보 수정 가능

DROP POLICY IF EXISTS "Teachers can update their class students" ON students;

CREATE POLICY "Teachers can update their class students"
ON students FOR UPDATE
TO authenticated
USING (
  class_id IN (
    SELECT id FROM classes
    WHERE main_teacher_id = auth.uid()
  )
  OR public.user_role() = 'admin'
)
WITH CHECK (
  class_id IN (
    SELECT id FROM classes
    WHERE main_teacher_id = auth.uid()
  )
  OR public.user_role() = 'admin'
);
```

### 2. 또는 마이그레이션 파일 실행

프로젝트 루트에서:

```bash
# Supabase CLI가 설치되어 있는 경우
supabase db push
```

또는 `supabase/migrations/004_add_student_update_policy.sql` 파일의 내용을 Supabase SQL Editor에서 실행

---

## 정책 설명

### 정책 이름
`Teachers can update their class students`

### 권한
- **교사**: 자신이 담당하는 반(`main_teacher_id`)의 학생 정보만 수정 가능
- **관리자**: 모든 학생 정보 수정 가능

### 조건
- `USING`: 기존 행을 수정할 수 있는지 확인 (담당 반의 학생이거나 관리자)
- `WITH CHECK`: 수정 후 데이터가 정책을 만족하는지 확인

---

## 확인 방법

1. Supabase 대시보드 → **Authentication** → **Policies**
2. `students` 테이블 선택
3. `Teachers can update their class students` 정책이 있는지 확인

또는 SQL로 확인:

```sql
SELECT * FROM pg_policies WHERE tablename = 'students' AND policyname = 'Teachers can update their class students';
```

---

## 참고

- 기존 SELECT 정책은 그대로 유지됩니다
- 이 정책은 UPDATE만 허용하며, INSERT/DELETE는 별도 정책이 필요합니다
- `public.user_role()` 함수는 `002_fix_rls_policies.sql`에서 이미 생성되어 있어야 합니다
