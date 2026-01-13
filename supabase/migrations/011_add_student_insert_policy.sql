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
