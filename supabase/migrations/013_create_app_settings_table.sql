-- app_settings 테이블 생성
-- 애플리케이션 설정을 저장하는 테이블 (단일 행)

CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_name TEXT NOT NULL DEFAULT '주일학교 교적부',
  description TEXT,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = '00000000-0000-0000-0000-000000000000'::uuid)
);

-- 단일 행 삽입 (초기값)
INSERT INTO app_settings (id, app_name, description)
VALUES ('00000000-0000-0000-0000-000000000000'::uuid, '주일학교 교적부', '행정은 간소하게, 사역은 깊이 있게')
ON CONFLICT (id) DO NOTHING;

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_app_settings_updated_at ON app_settings;
CREATE TRIGGER trigger_update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_app_settings_updated_at();

-- RLS 활성화
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모든 인증된 사용자는 조회 가능
DROP POLICY IF EXISTS "Authenticated users can view app settings" ON app_settings;
CREATE POLICY "Authenticated users can view app settings"
ON app_settings FOR SELECT
TO authenticated
USING (true);

-- RLS 정책: 관리자만 수정 가능
DROP POLICY IF EXISTS "Admins can update app settings" ON app_settings;
CREATE POLICY "Admins can update app settings"
ON app_settings FOR UPDATE
TO authenticated
USING (public.user_role() = 'admin')
WITH CHECK (public.user_role() = 'admin');
