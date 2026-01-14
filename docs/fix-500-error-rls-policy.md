# 500 에러 해결 가이드: RLS 정책 문제

## 문제 원인

`class_teachers` 테이블을 참조하는 RLS 정책이 실행되는데, 해당 테이블이 아직 생성되지 않아 500 에러가 발생합니다.

## 해결 방법

### 방법 1: 마이그레이션 순서 확인 및 재실행 (권장)

1. **Supabase 대시보드** → **SQL Editor**로 이동
2. 다음 순서로 마이그레이션 실행:

#### 1단계: class_teachers 테이블 생성

```sql
-- class_teachers 테이블 생성
-- 한 반에 여러 교사(담임, 보조 교사)를 배정할 수 있도록 하는 테이블

CREATE TABLE IF NOT EXISTS class_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, teacher_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_class_teachers_class_id ON class_teachers(class_id);
CREATE INDEX IF NOT EXISTS idx_class_teachers_teacher_id ON class_teachers(teacher_id);

-- RLS 활성화
ALTER TABLE class_teachers ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 교사는 자신이 배정된 반의 교사 목록 조회 가능
DROP POLICY IF EXISTS "Teachers can view class teachers" ON class_teachers;
CREATE POLICY "Teachers can view class teachers"
ON class_teachers FOR SELECT
TO authenticated
USING (
  teacher_id = auth.uid()
  OR class_id IN (
    SELECT id FROM classes
    WHERE main_teacher_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- RLS 정책: 관리자만 교사 배정 가능
DROP POLICY IF EXISTS "Admins can manage class teachers" ON class_teachers;
CREATE POLICY "Admins can manage class teachers"
ON class_teachers FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

#### 2단계: RLS 정책 업데이트

**아래 SQL을 Supabase SQL Editor에서 실행하세요:**

```sql
-- 1. classes 테이블 SELECT 정책 수정
DROP POLICY IF EXISTS "Teachers can view their own classes" ON classes;
CREATE POLICY "Teachers can view their own classes"
ON classes FOR SELECT
TO authenticated
USING (
  main_teacher_id = auth.uid()
  OR (
    EXISTS (SELECT 1 FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename = 'class_teachers')
    AND id IN (
      SELECT class_id FROM class_teachers
      WHERE teacher_id = auth.uid()
    )
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 2. students 테이블 SELECT 정책 수정
DROP POLICY IF EXISTS "Teachers can view their class students" ON students;
CREATE POLICY "Teachers can view their class students"
ON students FOR SELECT
TO authenticated
USING (
  class_id IN (
    SELECT id FROM classes
    WHERE main_teacher_id = auth.uid()
    OR (
      EXISTS (SELECT 1 FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename = 'class_teachers')
      AND id IN (
        SELECT class_id FROM class_teachers
        WHERE teacher_id = auth.uid()
      )
    )
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 3. attendance_logs 테이블 정책 수정
DROP POLICY IF EXISTS "Teachers can manage their class attendance" ON attendance_logs;
CREATE POLICY "Teachers can manage their class attendance"
ON attendance_logs FOR ALL
TO authenticated
USING (
  class_id IN (
    SELECT id FROM classes
    WHERE main_teacher_id = auth.uid()
    OR (
      EXISTS (SELECT 1 FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename = 'class_teachers')
      AND id IN (
        SELECT class_id FROM class_teachers
        WHERE teacher_id = auth.uid()
      )
    )
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 4. visitation_logs 테이블 INSERT 정책 수정
DROP POLICY IF EXISTS "Teachers can create visitations" ON visitation_logs;
CREATE POLICY "Teachers can create visitations"
ON visitation_logs FOR INSERT
TO authenticated
WITH CHECK (
  student_id IN (
    SELECT id FROM students
    WHERE class_id IN (
      SELECT id FROM classes
      WHERE main_teacher_id = auth.uid()
      OR (
        EXISTS (SELECT 1 FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename = 'class_teachers')
        AND id IN (
          SELECT class_id FROM class_teachers
          WHERE teacher_id = auth.uid()
        )
      )
    )
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

**실행 완료 후 브라우저를 새로고침하여 500 에러가 해결되었는지 확인하세요.**

---

### 방법 3: 더 안전한 RLS 정책 적용 (방법 2가 작동하지 않는 경우)

방법 2가 작동하지 않으면 아래 SQL을 실행하세요. 이 방법은 `table_exists` 함수를 사용하여 더 안전합니다:

```sql
-- PostgreSQL 함수: class_teachers 테이블 존재 여부 확인
CREATE OR REPLACE FUNCTION public.table_exists(table_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'public' AND tablename = table_name
  );
END;
$$;

-- 1. classes 테이블 SELECT 정책 업데이트
DROP POLICY IF EXISTS "Teachers can view their own classes" ON classes;
CREATE POLICY "Teachers can view their own classes"
ON classes FOR SELECT
TO authenticated
USING (
  main_teacher_id = auth.uid()
  OR (
    public.table_exists('class_teachers')
    AND id IN (
      SELECT class_id FROM class_teachers
      WHERE teacher_id = auth.uid()
    )
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 2. students 테이블 SELECT 정책 업데이트
DROP POLICY IF EXISTS "Teachers can view their class students" ON students;
CREATE POLICY "Teachers can view their class students"
ON students FOR SELECT
TO authenticated
USING (
  class_id IN (
    SELECT id FROM classes
    WHERE main_teacher_id = auth.uid()
    OR (
      public.table_exists('class_teachers')
      AND id IN (
        SELECT class_id FROM class_teachers
        WHERE teacher_id = auth.uid()
      )
    )
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 3. attendance_logs 테이블 정책 업데이트
DROP POLICY IF EXISTS "Teachers can manage their class attendance" ON attendance_logs;
CREATE POLICY "Teachers can manage their class attendance"
ON attendance_logs FOR ALL
TO authenticated
USING (
  class_id IN (
    SELECT id FROM classes
    WHERE main_teacher_id = auth.uid()
    OR (
      public.table_exists('class_teachers')
      AND id IN (
        SELECT class_id FROM class_teachers
        WHERE teacher_id = auth.uid()
      )
    )
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 4. visitation_logs 테이블 INSERT 정책 업데이트
DROP POLICY IF EXISTS "Teachers can create visitations" ON visitation_logs;
CREATE POLICY "Teachers can create visitations"
ON visitation_logs FOR INSERT
TO authenticated
WITH CHECK (
  student_id IN (
    SELECT id FROM students
    WHERE class_id IN (
      SELECT id FROM classes
      WHERE main_teacher_id = auth.uid()
      OR (
        public.table_exists('class_teachers')
        AND id IN (
          SELECT class_id FROM class_teachers
          WHERE teacher_id = auth.uid()
        )
      )
    )
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

**실행 완료 후 브라우저를 새로고침하여 500 에러가 해결되었는지 확인하세요.**

---

### 방법 2: 수정된 RLS 정책 직접 실행 (방법 1의 2단계와 동일)

방법 1의 2단계 SQL과 동일한 내용입니다. 위의 2단계 SQL을 실행하시면 됩니다.

---

## 확인 사항

1. **class_teachers 테이블 존재 여부 확인**:
```sql
SELECT EXISTS (
  SELECT 1 FROM pg_catalog.pg_tables 
  WHERE schemaname = 'public' AND tablename = 'class_teachers'
);
```

2. **RLS 정책 확인**:
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('classes', 'students', 'attendance_logs', 'visitation_logs')
ORDER BY tablename, policyname;
```

## 예상 결과

- ✅ `classes` 테이블 조회 시 500 에러 해결
- ✅ `visitation_logs` 테이블 조회 시 500 에러 해결
- ✅ `class_teachers` 테이블이 없어도 기존 기능 정상 작동
- ✅ `class_teachers` 테이블이 있으면 다중 교사 배정 기능 사용 가능

## 참고

- `class_teachers` 테이블이 없으면 기존 정책(main_teacher_id만)으로 동작합니다.
- `class_teachers` 테이블이 있으면 다중 교사 배정 기능이 활성화됩니다.
- 마이그레이션 순서: `024` → `025` (반드시 순서대로 실행)
