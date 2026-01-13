-- RLS 정책 업데이트: class_teachers 테이블을 참조하도록 수정
-- 여러 교사가 한 반을 담당할 수 있도록 지원

-- 1. classes 테이블 SELECT 정책 업데이트
DROP POLICY IF EXISTS "Teachers can view their own classes" ON classes;
CREATE POLICY "Teachers can view their own classes"
ON classes FOR SELECT
TO authenticated
USING (
  main_teacher_id = auth.uid()
  OR id IN (
    SELECT class_id FROM class_teachers
    WHERE teacher_id = auth.uid()
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
    OR id IN (
      SELECT class_id FROM class_teachers
      WHERE teacher_id = auth.uid()
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
    OR id IN (
      SELECT class_id FROM class_teachers
      WHERE teacher_id = auth.uid()
    )
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 4. visitation_logs 테이블 SELECT 정책 업데이트 (INSERT 정책은 기존 정책 유지)
-- SELECT 정책은 이미 전체 비밀유지 제외로 변경되어 있지만, INSERT 정책은 업데이트 필요
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
      OR id IN (
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
