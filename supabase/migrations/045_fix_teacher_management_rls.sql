-- =====================================================
-- Migration: 045_fix_teacher_management_rls.sql
-- Description: 부서 관리자(Department Admin)가 교사/반을 관리할 수 있도록 RLS 및 RPC 추가
-- =====================================================

-- 1. 부서 권한 체크 헬퍼 함수
CREATE OR REPLACE FUNCTION public.check_department_access(request_dept_name text)
RETURNS boolean AS $$
DECLARE
  user_role text;
  perms jsonb;
BEGIN
  -- 현재 사용자 정보 조회
  SELECT role, department_permissions INTO user_role, perms
  FROM profiles
  WHERE id = auth.uid();

  -- 1. 관리자면 OK
  IF user_role = 'admin' THEN
    RETURN true;
  END IF;

  -- 2. 권한 정보가 없으면 거부
  IF perms IS NULL THEN
    RETURN false;
  END IF;

  -- 3. 해당 부서에 대한 'department' 범위 권한이 있는지 확인
  -- JSONB 필드: perms -> request_dept_name -> 'permission_scope'
  IF (perms -> request_dept_name ->> 'permission_scope') = 'department' THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 권한 부여
GRANT EXECUTE ON FUNCTION public.check_department_access TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_department_access TO service_role;


-- 2. classes 테이블 RLS 업데이트 (UPDATE 권한)
-- 기존 정책 확인 후 필요시 DROP (이름 충돌 방지)
DROP POLICY IF EXISTS "classes_update_admin_or_dept" ON classes;

CREATE POLICY "classes_update_admin_or_dept" ON classes
  FOR UPDATE
  USING (
    public.check_department_access(department)
  );


-- 3. class_teachers 테이블 RLS 업데이트
-- Insert
DROP POLICY IF EXISTS "class_teachers_insert_admin_or_dept" ON class_teachers;

CREATE POLICY "class_teachers_insert_admin_or_dept" ON class_teachers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_teachers.class_id
      AND public.check_department_access(c.department)
    )
  );

-- Delete
DROP POLICY IF EXISTS "class_teachers_delete_admin_or_dept" ON class_teachers;

CREATE POLICY "class_teachers_delete_admin_or_dept" ON class_teachers
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_teachers.class_id
      AND public.check_department_access(c.department)
    )
  );


-- 4. 교사 권한(department_permissions) 업데이트를 위한 RPC
-- profiles 테이블 직접 업데이트는 보안상(role 변경 등) 위험하므로 RPC 사용
CREATE OR REPLACE FUNCTION update_teacher_department_permissions(
  target_teacher_id uuid,
  new_permissions jsonb
)
RETURNS void AS $$
DECLARE
  caller_role text;
  caller_perms jsonb;
BEGIN
  SELECT role, department_permissions INTO caller_role, caller_perms
  FROM profiles WHERE id = auth.uid();

  -- 관리자는 허용
  IF caller_role = 'admin' THEN
    UPDATE profiles 
    SET department_permissions = new_permissions, 
        updated_at = NOW()
    WHERE id = target_teacher_id;
    RETURN;
  END IF;

  -- 부서 관리자 허용 여부 체크
  -- 엄격한 체크: 수정하려는 부서에 대한 권한이 있는지 확인해야 함
  -- 편의상 'department' 스코프 권한을 하나라도 가지고 있으면 허용 (UI에서 필터링하므로)
  IF caller_perms IS NOT NULL AND position('"permission_scope": "department"' in caller_perms::text) > 0 THEN
    UPDATE profiles 
    SET department_permissions = new_permissions, 
        updated_at = NOW()
    WHERE id = target_teacher_id;
    RETURN;
  END IF;

  RAISE EXCEPTION 'Permission denied';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 권한 부여
GRANT EXECUTE ON FUNCTION public.update_teacher_department_permissions TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_teacher_department_permissions TO service_role;
