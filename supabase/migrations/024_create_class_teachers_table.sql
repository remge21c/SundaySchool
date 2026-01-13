-- class_teachers 테이블 생성
-- 한 반에 여러 교사(담임, 보조 교사)를 배정할 수 있도록 하는 테이블

CREATE TABLE IF NOT EXISTS class_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, teacher_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_class_teachers_class_id ON class_teachers(class_id);
CREATE INDEX IF NOT EXISTS idx_class_teachers_teacher_id ON class_teachers(teacher_id);

-- RLS 활성화
ALTER TABLE class_teachers ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 교사는 자신이 배정된 반의 교사 목록 조회 가능
DROP POLICY IF EXISTS "Teachers can view class teachers" ON class_teachers;
CREATE POLICY "Teachers can view class teachers"
ON class_teachers FOR SELECT
TO authenticated
USING (
  teacher_id = auth.uid()
  OR class_id IN (
    SELECT id FROM classes
    WHERE main_teacher_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- RLS 정책: 관리자만 교사 배정 가능
DROP POLICY IF EXISTS "Admins can manage class teachers" ON class_teachers;
CREATE POLICY "Admins can manage class teachers"
ON class_teachers FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
