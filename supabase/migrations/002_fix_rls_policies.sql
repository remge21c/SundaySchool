-- RLS 정책 수정 및 추가
-- classes, students, attendance_logs, visitation_logs 테이블 RLS 정책 수정 (500 에러 해결)
-- 무한 재귀 문제 방지를 위해 함수 사용

-- 역할 확인 함수 생성 (public 스키마에 생성)
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- classes 테이블 정책 추가/수정
DROP POLICY IF EXISTS "Teachers can view their classes" ON classes;
DROP POLICY IF EXISTS "Teachers can view their own classes" ON classes;
DROP POLICY IF EXISTS "Admins can view all classes" ON classes;

-- 교사는 자신이 담당하는 반 조회 가능, 관리자는 모든 반 조회 가능
CREATE POLICY "Teachers can view their classes"
ON classes FOR SELECT
TO authenticated
USING (
  main_teacher_id = auth.uid()
  OR public.user_role() = 'admin'
);

-- students 테이블 정책 수정 (무한 재귀 방지)
DROP POLICY IF EXISTS "Teachers can view their class students" ON students;

-- 교사는 자신이 담당하는 반의 학생 조회 가능, 관리자는 모든 학생 조회 가능
CREATE POLICY "Teachers can view their class students"
ON students FOR SELECT
TO authenticated
USING (
  class_id IN (
    SELECT id FROM classes
    WHERE main_teacher_id = auth.uid()
  )
  OR public.user_role() = 'admin'
);

-- attendance_logs 테이블 정책 수정 (무한 재귀 방지)
DROP POLICY IF EXISTS "Teachers can manage their class attendance" ON attendance_logs;

-- 교사는 자신이 담당하는 반의 출석 기록 조회/생성/수정 가능, 관리자는 모든 출석 기록 가능
CREATE POLICY "Teachers can manage their class attendance"
ON attendance_logs FOR ALL
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

-- visitation_logs 테이블 정책 수정 (무한 재귀 방지)
DROP POLICY IF EXISTS "Teachers can view their class visitations" ON visitation_logs;
DROP POLICY IF EXISTS "Teachers can create visitations" ON visitation_logs;

-- 교사는 담당 반의 비밀 보장되지 않은 심방 기록 조회 가능, 관리자는 모든 심방 기록 조회 가능
CREATE POLICY "Teachers can view their class visitations"
ON visitation_logs FOR SELECT
TO authenticated
USING (
  (student_id IN (
    SELECT id FROM students
    WHERE class_id IN (
      SELECT id FROM classes
      WHERE main_teacher_id = auth.uid()
    )
  ) AND is_confidential = false)
  OR public.user_role() = 'admin'
);

-- 교사는 담당 반의 학생에 대한 심방 기록 생성 가능, 관리자는 모든 심방 기록 생성 가능
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
  )
  OR public.user_role() = 'admin'
);
