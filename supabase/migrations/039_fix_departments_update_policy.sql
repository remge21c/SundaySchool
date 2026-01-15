-- 부서 테이블 UPDATE 정책 수정
-- 관리자에게 수정(Soft Delete 포함) 권한 명시적 부여

-- 기존 정책 안전하게 삭제
DROP POLICY IF EXISTS "관리자는 부서 수정 가능" ON departments;

-- RLS 정책: 관리자만 부서 수정 가능
-- USING: 어떤 행을 수정할 수 있는지 (관리자는 모든 행)
-- WITH CHECK: 수정 후 어떤 행이 되어야 하는지 (관리자는 모든 행 가능)
CREATE POLICY "관리자는 부서 수정 가능"
  ON departments
  FOR UPDATE
  TO authenticated
  USING (public.user_role() = 'admin')
  WITH CHECK (public.user_role() = 'admin');
