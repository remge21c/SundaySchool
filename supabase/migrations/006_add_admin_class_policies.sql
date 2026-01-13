-- 관리자 반 관리 정책 추가
-- 관리자는 반을 생성, 수정, 삭제할 수 있음

-- classes 테이블 INSERT 정책 (관리자만)
DROP POLICY IF EXISTS "Admins can create classes" ON classes;
CREATE POLICY "Admins can create classes"
ON classes FOR INSERT
TO authenticated
WITH CHECK (
  public.user_role() = 'admin'
);

-- classes 테이블 UPDATE 정책 (관리자만)
DROP POLICY IF EXISTS "Admins can update classes" ON classes;
CREATE POLICY "Admins can update classes"
ON classes FOR UPDATE
TO authenticated
USING (
  public.user_role() = 'admin'
)
WITH CHECK (
  public.user_role() = 'admin'
);

-- classes 테이블 DELETE 정책 (관리자만)
DROP POLICY IF EXISTS "Admins can delete classes" ON classes;
CREATE POLICY "Admins can delete classes"
ON classes FOR DELETE
TO authenticated
USING (
  public.user_role() = 'admin'
);
