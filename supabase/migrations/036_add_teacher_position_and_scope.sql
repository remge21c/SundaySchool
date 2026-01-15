-- =====================================================
-- Migration: 036_add_teacher_position_and_scope.sql
-- Description: 교사 직책 및 권한 범위 컬럼 추가
-- =====================================================

-- 1. 직책 enum 타입 생성
-- pastor: 담당목회자, director: 부장, secretary: 총무, treasurer: 회계, teacher: 교사
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'teacher_position') THEN
    CREATE TYPE teacher_position AS ENUM ('pastor', 'director', 'secretary', 'treasurer', 'teacher');
  END IF;
END
$$;

-- 2. 권한 범위 enum 타입 생성
-- department: 부서 전체 접근, class: 담당 반만 접근
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'permission_scope') THEN
    CREATE TYPE permission_scope AS ENUM ('department', 'class');
  END IF;
END
$$;

-- 3. profiles 테이블에 컬럼 추가
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS position teacher_position DEFAULT 'teacher',
ADD COLUMN IF NOT EXISTS permission_scope permission_scope DEFAULT 'class';

-- 4. 기존 admin 역할 사용자는 department 권한으로 설정
UPDATE profiles 
SET permission_scope = 'department' 
WHERE role = 'admin' AND permission_scope IS NULL;

-- 5. 인덱스 추가 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_profiles_position ON profiles(position);
CREATE INDEX IF NOT EXISTS idx_profiles_permission_scope ON profiles(permission_scope);

-- 6. 코멘트 추가
COMMENT ON COLUMN profiles.position IS '교사 직책: pastor(담당목회자), director(부장), secretary(총무), treasurer(회계), teacher(교사)';
COMMENT ON COLUMN profiles.permission_scope IS '권한 범위: department(부서 전체), class(담당 반만)';
