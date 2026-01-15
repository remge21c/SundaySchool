-- 부서 테이블 RLS 정책 수정
-- 관리자에게 삭제 권한 명시적 부여

-- 기존 정책이 있다면 안전하게 삭제 후 재생성
DROP POLICY IF EXISTS "관리자는 부서 삭제 가능" ON departments;

-- RLS 정책: 관리자만 부서 삭제 가능
CREATE POLICY "관리자는 부서 삭제 가능"
  ON departments
  FOR DELETE
  TO authenticated
  USING (public.user_role() = 'admin');
