-- RLS 정책 수정: class_teachers 테이블이 없을 때도 작동하도록 조건부 처리
-- class_teachers 테이블이 존재하지 않으면 기존 정책(main_teacher_id만)으로 동작
-- 
-- 참고: 이 마이그레이션은 024_create_class_teachers_table.sql이 실행되지 않은 경우를 대비한 것입니다.
-- 정상적인 경우에는 024 -> 025 순서로 실행되므로 이 마이그레이션은 필요 없습니다.
-- 하지만 025가 먼저 실행되어 에러가 발생하는 경우를 방지하기 위해 작성되었습니다.

-- 1. classes 테이블 SELECT 정책 수정 (기존 정책으로 복원)
-- class_teachers 테이블이 없을 때는 main_teacher_id만 체크하도록 함
DROP POLICY IF EXISTS "Teachers can view their own classes" ON classes;
CREATE POLICY "Teachers can view their own classes"
ON classes FOR SELECT
TO authenticated
USING (
  main_teacher_id = auth.uid()
  OR (
    -- class_teachers 테이블이 존재하는 경우에만 체크 (에러 방지)
    -- pg_catalog를 사용하여 테이블 존재 여부 확인
    (SELECT COUNT(*) FROM pg_catalog.pg_tables 
     WHERE schemaname = 'public' AND tablename = 'class_teachers') > 0
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
      -- class_teachers 테이블이 존재하는 경우에만 체크
      (SELECT COUNT(*) FROM pg_catalog.pg_tables 
       WHERE schemaname = 'public' AND tablename = 'class_teachers') > 0
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
      -- class_teachers 테이블이 존재하는 경우에만 체크
      (SELECT COUNT(*) FROM pg_catalog.pg_tables 
       WHERE schemaname = 'public' AND tablename = 'class_teachers') > 0
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
        -- class_teachers 테이블이 존재하는 경우에만 체크
        (SELECT COUNT(*) FROM pg_catalog.pg_tables 
         WHERE schemaname = 'public' AND tablename = 'class_teachers') > 0
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
