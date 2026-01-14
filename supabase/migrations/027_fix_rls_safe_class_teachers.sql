-- RLS 정책 안전하게 수정: class_teachers 테이블이 없어도 작동하도록
-- pg_catalog.pg_tables 사용 대신 더 안전한 방법 사용

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

-- 1. classes 테이블 SELECT 정책 업데이트 (더 안전한 방법)
DROP POLICY IF EXISTS "Teachers can view their own classes" ON classes;
CREATE POLICY "Teachers can view their own classes"
ON classes FOR SELECT
TO authenticated
USING (
  main_teacher_id = auth.uid()
  OR (
    -- class_teachers 테이블이 존재하는 경우에만 체크
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
