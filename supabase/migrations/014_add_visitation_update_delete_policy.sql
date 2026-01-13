-- 심방 기록 UPDATE/DELETE RLS 정책 추가
-- 작성자는 자신이 작성한 심방 기록만 수정/삭제 가능
-- 관리자는 모든 심방 기록 수정/삭제 가능

-- UPDATE 정책: 작성자만 자신의 심방 기록 수정 가능, 관리자는 모든 심방 기록 수정 가능
DROP POLICY IF EXISTS "Teachers can update their own visitations" ON visitation_logs;
CREATE POLICY "Teachers can update their own visitations"
ON visitation_logs FOR UPDATE
TO authenticated
USING (
  teacher_id = auth.uid()
  OR public.user_role() = 'admin'
)
WITH CHECK (
  teacher_id = auth.uid()
  OR public.user_role() = 'admin'
);

-- DELETE 정책: 작성자만 자신의 심방 기록 삭제 가능, 관리자는 모든 심방 기록 삭제 가능
DROP POLICY IF EXISTS "Teachers can delete their own visitations" ON visitation_logs;
CREATE POLICY "Teachers can delete their own visitations"
ON visitation_logs FOR DELETE
TO authenticated
USING (
  teacher_id = auth.uid()
  OR public.user_role() = 'admin'
);
