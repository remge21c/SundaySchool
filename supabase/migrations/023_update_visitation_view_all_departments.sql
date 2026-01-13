-- 심방 기록 SELECT RLS 정책 수정
-- 교사가 비밀유지가 아닌 전체 부서의 심방 기록을 조회할 수 있도록 변경
-- 관리자는 기존과 동일하게 모든 심방 기록 조회 가능

-- 기존 SELECT 정책 삭제
DROP POLICY IF EXISTS "Teachers can view their class visitations" ON visitation_logs;

-- 새로운 SELECT 정책 생성: 비밀유지가 아닌 모든 심방 기록 조회 가능
CREATE POLICY "Teachers can view all non-confidential visitations"
ON visitation_logs FOR SELECT
TO authenticated
USING (
  is_confidential = false
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
