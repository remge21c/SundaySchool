-- 게이미피케이션 시스템 테이블 생성 (FEAT-4)
-- 달란트 포인트 시스템 및 배지 시스템

-- 1. talent_transactions 테이블의 category CHECK 제약조건 제거 (더 많은 카테고리 허용)
ALTER TABLE talent_transactions DROP CONSTRAINT IF EXISTS talent_transactions_category_check;

-- 2. badges (배지 정의) 테이블 생성
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  condition_type TEXT NOT NULL,  -- 획득 조건 타입 (예: "consecutive_weeks")
  condition_value INTEGER NOT NULL,  -- 획득 조건 값 (예: 4주)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. student_badges (학생 배지 획득 이력) 테이블 생성
CREATE TABLE IF NOT EXISTS student_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, badge_id)
);

-- 4. talent_rules (달란트 포인트 규칙) 테이블 생성
CREATE TABLE IF NOT EXISTS talent_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  description TEXT,
  requires_approval BOOLEAN DEFAULT false,  -- 교사 승인 필요 여부
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_badges_is_active ON badges(is_active);
CREATE INDEX IF NOT EXISTS idx_student_badges_student_id ON student_badges(student_id);
CREATE INDEX IF NOT EXISTS idx_student_badges_badge_id ON student_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_talent_rules_category ON talent_rules(category);
CREATE INDEX IF NOT EXISTS idx_talent_rules_is_active ON talent_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_talent_rules_sort_order ON talent_rules(sort_order);

-- updated_at 자동 업데이트 트리거 함수 (badges)
CREATE OR REPLACE FUNCTION update_badges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 자동 업데이트 트리거 함수 (talent_rules)
CREATE OR REPLACE FUNCTION update_talent_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_badges_updated_at ON badges;
CREATE TRIGGER trigger_update_badges_updated_at
  BEFORE UPDATE ON badges
  FOR EACH ROW
  EXECUTE FUNCTION update_badges_updated_at();

DROP TRIGGER IF EXISTS trigger_update_talent_rules_updated_at ON talent_rules;
CREATE TRIGGER trigger_update_talent_rules_updated_at
  BEFORE UPDATE ON talent_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_talent_rules_updated_at();

-- RLS 활성화
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_rules ENABLE ROW LEVEL SECURITY;

-- RLS 정책: badges
-- 모든 인증 사용자는 배지 조회 가능
DROP POLICY IF EXISTS "Authenticated users can view badges" ON badges;
CREATE POLICY "Authenticated users can view badges"
ON badges FOR SELECT
TO authenticated
USING (true);

-- 관리자만 배지 관리 가능
DROP POLICY IF EXISTS "Admins can manage badges" ON badges;
CREATE POLICY "Admins can manage badges"
ON badges FOR ALL
TO authenticated
USING (public.user_role() = 'admin')
WITH CHECK (public.user_role() = 'admin');

-- RLS 정책: student_badges
-- 교사는 담당 반 학생의 배지 조회 가능, 관리자는 전체 조회 가능
DROP POLICY IF EXISTS "Teachers can view their class student badges" ON student_badges;
CREATE POLICY "Teachers can view their class student badges"
ON student_badges FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT id FROM students
    WHERE class_id IN (
      SELECT id FROM classes
      WHERE main_teacher_id = auth.uid()
    )
  )
  OR public.user_role() = 'admin'
);

-- 배지 부여는 트리거로 자동 생성 또는 관리자가 수동 생성
DROP POLICY IF EXISTS "Admins can manage student badges" ON student_badges;
CREATE POLICY "Admins can manage student badges"
ON student_badges FOR ALL
TO authenticated
USING (public.user_role() = 'admin')
WITH CHECK (public.user_role() = 'admin');

-- RLS 정책: talent_rules
-- 모든 인증 사용자는 규칙 조회 가능
DROP POLICY IF EXISTS "Authenticated users can view talent rules" ON talent_rules;
CREATE POLICY "Authenticated users can view talent rules"
ON talent_rules FOR SELECT
TO authenticated
USING (true);

-- 관리자만 규칙 관리 가능
DROP POLICY IF EXISTS "Admins can manage talent rules" ON talent_rules;
CREATE POLICY "Admins can manage talent rules"
ON talent_rules FOR ALL
TO authenticated
USING (public.user_role() = 'admin')
WITH CHECK (public.user_role() = 'admin');

-- RLS 정책: talent_transactions (추가)
-- 교사는 담당 반 학생의 달란트 거래 조회 가능, 관리자는 전체 조회 가능
DROP POLICY IF EXISTS "Teachers can view their class student talent transactions" ON talent_transactions;
CREATE POLICY "Teachers can view their class student talent transactions"
ON talent_transactions FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT id FROM students
    WHERE class_id IN (
      SELECT id FROM classes
      WHERE main_teacher_id = auth.uid()
    )
  )
  OR public.user_role() = 'admin'
);

-- 교사는 담당 반 학생에게 달란트 지급 가능 (트리거로 자동 생성 포함), 관리자는 전체 가능
DROP POLICY IF EXISTS "Teachers can insert talent transactions for their class students" ON talent_transactions;
CREATE POLICY "Teachers can insert talent transactions for their class students"
ON talent_transactions FOR INSERT
TO authenticated
WITH CHECK (
  student_id IN (
    SELECT id FROM students
    WHERE class_id IN (
      SELECT id FROM classes
      WHERE main_teacher_id = auth.uid()
    )
  )
  OR public.user_role() = 'admin'
);

-- 관리자만 거래 수정/삭제 가능
DROP POLICY IF EXISTS "Admins can update talent transactions" ON talent_transactions;
CREATE POLICY "Admins can update talent transactions"
ON talent_transactions FOR UPDATE
TO authenticated
USING (public.user_role() = 'admin')
WITH CHECK (public.user_role() = 'admin');

DROP POLICY IF EXISTS "Admins can delete talent transactions" ON talent_transactions;
CREATE POLICY "Admins can delete talent transactions"
ON talent_transactions FOR DELETE
TO authenticated
USING (public.user_role() = 'admin');

-- 초기 데이터 삽입: 기본 달란트 규칙
INSERT INTO talent_rules (category, amount, description, requires_approval, is_active, sort_order) VALUES
('출석', 10, '출석 시 자동 적립', false, true, 1),
('성경 암송', 20, '교사 승인 필요', true, true, 2),
('전도', 30, '교사 승인 필요', true, true, 3),
('봉사 활동', 15, '교사 승인 필요', true, true, 4),
('기도 제목 나눔', 5, '자동 적립 또는 교사 승인', false, true, 5),
('훈련 참여', 50, '교사 승인 필요', true, true, 6),
('추가 항목 1', 0, '', false, false, 7),
('추가 항목 2', 0, '', false, false, 8),
('추가 항목 3', 0, '', false, false, 9)
ON CONFLICT (category) DO NOTHING;

-- 초기 데이터 삽입: 4주 개근 배지
INSERT INTO badges (name, description, condition_type, condition_value, is_active) VALUES
('4주 개근', '4주 연속 출석 달성', 'consecutive_weeks', 4, true)
ON CONFLICT (name) DO NOTHING;
