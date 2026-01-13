-- RLS 정책 수정 및 추가
-- classes, students 테이블 RLS 정책 수정 (500 에러 해결)
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
