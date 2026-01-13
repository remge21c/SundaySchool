-- 부서 관리 테이블 생성
-- 관리자가 부서를 생성/수정/삭제할 수 있도록 함

-- 1. departments 테이블 생성
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON departments(is_active);

-- 3. 기존 하드코딩된 부서들을 초기 데이터로 삽입
INSERT INTO departments (name, description, is_active)
VALUES
  ('유년부', '유년부 설명', true),
  ('초등부', '초등부 설명', true),
  ('중등부', '중등부 설명', true),
  ('고등부', '고등부 설명', true)
ON CONFLICT (name) DO NOTHING;

-- 4. RLS 활성화
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책: 모든 사용자가 부서 조회 가능 (활성화된 부서만)
CREATE POLICY "모든 사용자는 활성화된 부서 조회 가능"
  ON departments
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- 6. RLS 정책: 관리자만 부서 생성 가능
CREATE POLICY "관리자는 부서 생성 가능"
  ON departments
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_role() = 'admin');

-- 7. RLS 정책: 관리자만 부서 수정 가능
CREATE POLICY "관리자는 부서 수정 가능"
  ON departments
  FOR UPDATE
  TO authenticated
  USING (public.user_role() = 'admin')
  WITH CHECK (public.user_role() = 'admin');

-- 8. RLS 정책: 관리자만 부서 삭제 가능 (실제로는 is_active = false로 처리)
CREATE POLICY "관리자는 부서 삭제 가능"
  ON departments
  FOR DELETE
  TO authenticated
  USING (public.user_role() = 'admin');

-- 9. updated_at 자동 업데이트 트리거 함수 (이미 존재하면 스킵)
CREATE OR REPLACE FUNCTION update_departments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_departments_updated_at ON departments;
CREATE TRIGGER trigger_update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_departments_updated_at();
