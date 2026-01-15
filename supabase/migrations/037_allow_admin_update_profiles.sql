-- =====================================================
-- Migration: 037_allow_admin_update_profiles.sql
-- Description: 관리자가 교사 프로필을 업데이트할 수 있도록 RLS 정책 추가
-- =====================================================

-- 기존 정책 삭제 후 재생성 (자신의 프로필 + 관리자는 모든 프로필)
DROP POLICY IF EXISTS "Teachers can update own profile" ON profiles;

-- 1. 자신의 프로필 업데이트 + 관리자는 모든 프로필 업데이트 가능
CREATE POLICY "Teachers can update own profile or admins can update all"
ON profiles FOR UPDATE
TO authenticated
USING (
  auth.uid() = id  -- 자신의 프로필
  OR public.user_role() = 'admin'  -- 관리자는 모든 프로필 업데이트 가능
)
WITH CHECK (
  auth.uid() = id  -- 자신의 프로필
  OR public.user_role() = 'admin'  -- 관리자는 모든 프로필 업데이트 가능
);
