-- 모든 인증된 사용자가 반 정보를 조회할 수 있도록 함
-- 부서 이동 시 다른 부서의 반(특히 미배정 반)을 조회해야 하므로 필요함

DROP POLICY IF EXISTS "Teachers can view their classes" ON classes;
DROP POLICY IF EXISTS "All authenticated users can view classes" ON classes;

CREATE POLICY "All authenticated users can view classes"
ON classes FOR SELECT
TO authenticated
USING (true);
