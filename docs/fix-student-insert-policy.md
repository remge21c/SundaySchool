# 학생 추가 RLS 정책 수정 가이드

> 학생 추가 기능이 작동하지 않는 문제 해결 가이드

**에러 메시지**: `new row violates row-level security policy for table "students"`

---

## 문제 원인

`students` 테이블에 INSERT 정책이 없어서 발생하는 문제입니다.  
마이그레이션 파일 `011_add_student_insert_policy.sql`이 Supabase에 적용되지 않았을 수 있습니다.

---

## 해결 방법

### 방법 1: Supabase 대시보드에서 직접 실행 (권장)

1. **[Supabase 대시보드](https://app.supabase.com) 접속**
2. 프로젝트 선택
3. 좌측 메뉴: **SQL Editor** 클릭
4. **New query** 클릭
5. 아래 SQL을 복사하여 붙여넣기:

```sql
-- students 테이블 INSERT 정책 추가
-- 교사는 자신이 담당하는 반에 학생 추가 가능, 관리자는 모든 반에 학생 추가 가능

DROP POLICY IF EXISTS "Teachers can insert students to their class" ON students;

CREATE POLICY "Teachers can insert students to their class"
ON students FOR INSERT
TO authenticated
WITH CHECK (
  class_id IN (
    SELECT id FROM classes
    WHERE main_teacher_id = auth.uid()
  )
  OR public.user_role() = 'admin'
);
```

6. **Run** 버튼 클릭 (또는 Ctrl/Cmd + Enter)
7. "Success. No rows returned" 메시지 확인

---

## 확인 방법

### 1. 정책이 적용되었는지 확인

SQL Editor에서 다음 쿼리 실행:

```sql
-- students 테이블의 모든 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'students'
ORDER BY policyname;
```

다음과 같은 결과가 나와야 합니다:
- `Teachers can view their class students` (SELECT)
- `Teachers can update their class students` (UPDATE)
- `Teachers can insert students to their class` (INSERT) ← **이것이 있어야 함**

### 2. 학생 추가 테스트

1. 웹 애플리케이션에서 관리자 또는 교사 계정으로 로그인
2. 학생 관리 페이지(`/students`) 접속
3. "학생 추가" 버튼 클릭
4. 학생 정보 입력 후 추가
5. 정상적으로 추가되면 성공!

---

## 문제 해결

### 정책이 적용되지 않는 경우

1. **에러 메시지 확인**
   - SQL Editor에서 실행 시 에러 메시지가 표시됩니다
   - 에러 메시지를 확인하고 수정하세요

2. **public.user_role() 함수 확인**
   
   다음 쿼리로 함수가 존재하는지 확인:
   
   ```sql
   SELECT 
     proname as function_name,
     pronargs as num_args,
     prorettype::regtype as return_type
   FROM pg_proc
   WHERE proname = 'user_role';
   ```
   
   함수가 없으면 다음 SQL 실행:
   
   ```sql
   CREATE OR REPLACE FUNCTION public.user_role()
   RETURNS text
   LANGUAGE sql
   SECURITY DEFINER
   STABLE
   AS $$
     SELECT role FROM profiles WHERE id = auth.uid();
   $$;
   ```

3. **RLS가 활성화되어 있는지 확인**
   
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' AND tablename = 'students';
   ```
   
   `rowsecurity`가 `true`여야 합니다. 만약 `false`라면:
   
   ```sql
   ALTER TABLE students ENABLE ROW LEVEL SECURITY;
   ```

---

## 참고

- **마이그레이션 파일 위치**: `supabase/migrations/011_add_student_insert_policy.sql`
- **관련 문서**: `docs/supabase-rls-policies.md`
