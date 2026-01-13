-- profiles 테이블 RLS 정책 수정
-- 무한 재귀 문제 방지를 위해 public.user_role() 함수 사용

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- 관리자는 모든 프로필 조회 가능 (public.user_role() 함수 사용)
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id  -- 자신의 프로필은 항상 조회 가능
  OR public.user_role() = 'admin'  -- 관리자는 모든 프로필 조회 가능
);
