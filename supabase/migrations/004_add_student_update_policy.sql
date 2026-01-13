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
