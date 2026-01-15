-- ============================================
-- 학년도 전환 시스템 테이블 생성
-- ============================================

-- 1. classes 테이블에 is_active 컬럼 추가
ALTER TABLE classes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 기존 모든 반을 활성 상태로 설정
UPDATE classes SET is_active = TRUE WHERE is_active IS NULL;

-- ============================================
-- 2. class_assignments 테이블 (학생-반 매핑)
-- ============================================
CREATE TABLE IF NOT EXISTS class_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE, -- NULL이면 현재 소속
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 한 학생은 같은 연도에 하나의 반에만 속함
  UNIQUE(student_id, year)
);

-- 인덱스: 현재 활성 배정만 빠르게 조회
CREATE INDEX IF NOT EXISTS idx_class_assignments_active 
  ON class_assignments(student_id) 
  WHERE end_date IS NULL;

-- 인덱스: 연도별 조회
CREATE INDEX IF NOT EXISTS idx_class_assignments_year 
  ON class_assignments(year);

-- ============================================
-- 3. student_grade_history 테이블 (학년 이력)
-- ============================================
CREATE TABLE IF NOT EXISTS student_grade_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  grade INTEGER NOT NULL,
  school_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(student_id, year)
);

-- ============================================
-- 4. temp_class_assignments 테이블 (임시 배정)
-- ============================================
CREATE TABLE IF NOT EXISTS temp_class_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  assigned_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 한 학생은 같은 연도에 하나의 반에만 임시 배정
  UNIQUE(student_id, year)
);

-- ============================================
-- 5. year_transition_log 테이블 (전환 이력)
-- ============================================
CREATE TABLE IF NOT EXISTS year_transition_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_year INTEGER NOT NULL,
  to_year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, failed
  classes_created INTEGER DEFAULT 0,
  students_assigned INTEGER DEFAULT 0,
  executed_by UUID REFERENCES profiles(id),
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(from_year, to_year)
);

-- ============================================
-- 6. 학생 학년 증가 함수
-- ============================================
CREATE OR REPLACE FUNCTION increment_student_grades()
RETURNS void AS $$
BEGIN
  -- 학년 +1 (6학년은 그대로 유지 - 부서 이동은 별도 처리)
  UPDATE students
  SET grade = CASE
    WHEN grade < 6 THEN grade + 1
    ELSE grade
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. 인덱스 추가 (성능 최적화)
-- ============================================
-- classes 테이블 연도별 활성 반 조회
CREATE INDEX IF NOT EXISTS idx_classes_year_active 
  ON classes(year, is_active) 
  WHERE is_active = true;

-- ============================================
-- 8. RLS 정책 (DROP IF EXISTS 추가)
-- ============================================

-- class_assignments RLS
ALTER TABLE class_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "class_assignments_select_all" ON class_assignments;
CREATE POLICY "class_assignments_select_all" ON class_assignments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "class_assignments_insert_admin" ON class_assignments;
CREATE POLICY "class_assignments_insert_admin" ON class_assignments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "class_assignments_update_admin" ON class_assignments;
CREATE POLICY "class_assignments_update_admin" ON class_assignments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "class_assignments_delete_admin" ON class_assignments;
CREATE POLICY "class_assignments_delete_admin" ON class_assignments
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- student_grade_history RLS
ALTER TABLE student_grade_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "student_grade_history_select_all" ON student_grade_history;
CREATE POLICY "student_grade_history_select_all" ON student_grade_history
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "student_grade_history_insert_admin" ON student_grade_history;
CREATE POLICY "student_grade_history_insert_admin" ON student_grade_history
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- temp_class_assignments RLS
ALTER TABLE temp_class_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "temp_class_assignments_select_all" ON temp_class_assignments;
CREATE POLICY "temp_class_assignments_select_all" ON temp_class_assignments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "temp_class_assignments_insert_admin" ON temp_class_assignments;
CREATE POLICY "temp_class_assignments_insert_admin" ON temp_class_assignments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "temp_class_assignments_update_admin" ON temp_class_assignments;
CREATE POLICY "temp_class_assignments_update_admin" ON temp_class_assignments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "temp_class_assignments_delete_admin" ON temp_class_assignments;
CREATE POLICY "temp_class_assignments_delete_admin" ON temp_class_assignments
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- year_transition_log RLS
ALTER TABLE year_transition_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "year_transition_log_select_admin" ON year_transition_log;
CREATE POLICY "year_transition_log_select_admin" ON year_transition_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "year_transition_log_insert_admin" ON year_transition_log;
CREATE POLICY "year_transition_log_insert_admin" ON year_transition_log
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "year_transition_log_update_admin" ON year_transition_log;
CREATE POLICY "year_transition_log_update_admin" ON year_transition_log
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

