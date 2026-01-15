-- 부서별 권한 설정을 위한 JSONB 컬럼 추가
-- 형식: { "부서명": "department" | "class" }

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department_permissions JSONB DEFAULT '{}';

COMMENT ON COLUMN profiles.department_permissions IS '부서별 권한 설정 (JSON). 키: 부서명, 값: "department" 또는 "class"';
