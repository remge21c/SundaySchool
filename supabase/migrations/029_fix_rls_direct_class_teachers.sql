-- RLS 정책 수정: class_teachers 테이블을 직접 참조하도록 변경
-- table_exists() 함수 사용 제거 (일반 사용자 권한 문제 해결)

-- 1. classes 테이블 SELECT 정책
DROP POLICY IF EXISTS "Teachers can view their own classes" ON classes;
CREATE POLICY "Teachers can view their own classes"
ON classes FOR SELECT
TO authenticated
USING (
  main_teacher_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM class_teachers
    WHERE class_teachers.class_id = id
    AND class_teachers.teacher_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 2. students 테이블 SELECT 정책
DROP POLICY IF EXISTS "Teachers can view their class students" ON students;
CREATE POLICY "Teachers can view their class students"
ON students FOR SELECT
TO authenticated
USING (
  class_id IN (
    SELECT id FROM classes
    WHERE main_teacher_id = auth.uid()
  )
  OR class_id IN (
    SELECT class_id FROM class_teachers
    WHERE teacher_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 3. attendance_logs 테이블 정책
DROP POLICY IF EXISTS "Teachers can manage their class attendance" ON attendance_logs;
CREATE POLICY "Teachers can manage their class attendance"
ON attendance_logs FOR ALL
TO authenticated
USING (
  class_id IN (
    SELECT id FROM classes
    WHERE main_teacher_id = auth.uid()
  )
  OR class_id IN (
    SELECT class_id FROM class_teachers
    WHERE teacher_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 4. visitation_logs 테이블 INSERT 정책
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
    )
    OR class_id IN (
      SELECT class_id FROM class_teachers
      WHERE teacher_id = auth.uid()
    )
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 5. student_notes 테이블 정책 (보조교사도 볼 수 있도록)
DROP POLICY IF EXISTS "Teachers can view their students notes" ON student_notes;
CREATE POLICY "Teachers can view their students notes"
ON student_notes FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT id FROM students
    WHERE class_id IN (
      SELECT id FROM classes
      WHERE main_teacher_id = auth.uid()
    )
    OR class_id IN (
      SELECT class_id FROM class_teachers
      WHERE teacher_id = auth.uid()
    )
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 6. talent_transactions 테이블 정책 (보조교사도 관리 가능하도록)
DROP POLICY IF EXISTS "Teachers can manage their students talents" ON talent_transactions;
CREATE POLICY "Teachers can manage their students talents"
ON talent_transactions FOR ALL
TO authenticated
USING (
  student_id IN (
    SELECT id FROM students
    WHERE class_id IN (
      SELECT id FROM classes
      WHERE main_teacher_id = auth.uid()
    )
    OR class_id IN (
      SELECT class_id FROM class_teachers
      WHERE teacher_id = auth.uid()
    )
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
