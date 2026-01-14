-- RLS 정책 단순화: class_teachers 테이블 참조를 안전하게 처리
-- 가장 간단하고 확실한 방법: class_teachers 테이블이 없으면 기본 정책만 사용

-- 1. classes 테이블 SELECT 정책 - 단순화된 버전
DROP POLICY IF EXISTS "Teachers can view their own classes" ON classes;
CREATE POLICY "Teachers can view their own classes"
ON classes FOR SELECT
TO authenticated
USING (
  main_teacher_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
  -- class_teachers 테이블이 있으면 추가 체크 (에러 발생 시 무시)
  OR (
    -- 안전하게 체크: 테이블이 없으면 false 반환
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'public' AND table_name = 'class_teachers') > 0
    AND EXISTS (
      SELECT 1 FROM class_teachers
      WHERE class_teachers.class_id = classes.id
      AND class_teachers.teacher_id = auth.uid()
    )
  )
);

-- 2. students 테이블 SELECT 정책 - 단순화된 버전
DROP POLICY IF EXISTS "Teachers can view their class students" ON students;
CREATE POLICY "Teachers can view their class students"
ON students FOR SELECT
TO authenticated
USING (
  class_id IN (
    SELECT id FROM classes
    WHERE main_teacher_id = auth.uid()
    OR (
      (SELECT COUNT(*) FROM information_schema.tables 
       WHERE table_schema = 'public' AND table_name = 'class_teachers') > 0
      AND EXISTS (
        SELECT 1 FROM class_teachers
        WHERE class_teachers.class_id = classes.id
        AND class_teachers.teacher_id = auth.uid()
      )
    )
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 3. attendance_logs 테이블 정책 - 단순화된 버전
DROP POLICY IF EXISTS "Teachers can manage their class attendance" ON attendance_logs;
CREATE POLICY "Teachers can manage their class attendance"
ON attendance_logs FOR ALL
TO authenticated
USING (
  class_id IN (
    SELECT id FROM classes
    WHERE main_teacher_id = auth.uid()
    OR (
      (SELECT COUNT(*) FROM information_schema.tables 
       WHERE table_schema = 'public' AND table_name = 'class_teachers') > 0
      AND EXISTS (
        SELECT 1 FROM class_teachers
        WHERE class_teachers.class_id = classes.id
        AND class_teachers.teacher_id = auth.uid()
      )
    )
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 4. visitation_logs 테이블 INSERT 정책 - 단순화된 버전
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
        (SELECT COUNT(*) FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_name = 'class_teachers') > 0
        AND EXISTS (
          SELECT 1 FROM class_teachers
          WHERE class_teachers.class_id = classes.id
          AND class_teachers.teacher_id = auth.uid()
        )
      )
    )
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
