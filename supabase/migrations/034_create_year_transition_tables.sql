-- 학년도 전환 시스템 테이블 생성
-- 매년 학년도 전환을 지원하기 위한 테이블과 함수들

-- ==================================================
-- 1. classes 테이블에 is_active 컬럼 추가
-- ==================================================
ALTER TABLE classes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 현재 연도 반을 활성화 상태로 설정
UPDATE classes SET is_active = TRUE WHERE is_active IS NULL;

-- is_active 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_classes_is_active ON classes(is_active);

-- ==================================================
-- 2. class_assignments 테이블 (학생-반 매핑 이력)
-- ==================================================
CREATE TABLE IF NOT EXISTS class_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE, -- NULL이면 현재 소속
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 한 학생은 같은 연도에 하나의 반에만 속함
  UNIQUE(student_id, year)
);

-- class_assignments 인덱스
CREATE INDEX IF NOT EXISTS idx_class_assignments_student ON class_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_class_assignments_class ON class_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_class_assignments_year ON class_assignments(year);
CREATE INDEX IF NOT EXISTS idx_class_assignments_active 
  ON class_assignments(student_id) 
  WHERE end_date IS NULL;

-- ==================================================
-- 3. student_grade_history 테이블 (학년 이력)
-- ==================================================
CREATE TABLE IF NOT EXISTS student_grade_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  grade INTEGER NOT NULL,
  school_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(student_id, year)
);

-- student_grade_history 인덱스
CREATE INDEX IF NOT EXISTS idx_student_grade_history_student ON student_grade_history(student_id);
CREATE INDEX IF NOT EXISTS idx_student_grade_history_year ON student_grade_history(year);

-- ==================================================
-- 4. temp_class_assignments 테이블 (임시 반 배정)
-- ==================================================
CREATE TABLE IF NOT EXISTS temp_class_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 한 학생은 같은 연도에 하나의 임시 배정만 가능
  UNIQUE(student_id, year)
);

-- temp_class_assignments 인덱스
CREATE INDEX IF NOT EXISTS idx_temp_class_assignments_year ON temp_class_assignments(year);

-- ==================================================
-- 5. year_transition_logs 테이블 (전환 로그)
-- ==================================================
CREATE TABLE IF NOT EXISTS year_transition_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_year INTEGER NOT NULL,
  to_year INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'rolled_back')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  executed_by UUID REFERENCES profiles(id),
  total_students INTEGER DEFAULT 0,
  assigned_students INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================
-- 6. RLS 정책
-- ==================================================

-- class_assignments RLS
ALTER TABLE class_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can view class assignments" ON class_assignments;
CREATE POLICY "Teachers can view class assignments"
ON class_assignments FOR SELECT
TO authenticated
USING (
  class_id IN (
    SELECT id FROM classes
    WHERE main_teacher_id = auth.uid()
  )
  OR class_id IN (
    SELECT class_id FROM class_teachers
    WHERE teacher_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can manage class assignments" ON class_assignments;
CREATE POLICY "Admins can manage class assignments"
ON class_assignments FOR ALL
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

-- student_grade_history RLS
ALTER TABLE student_grade_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can view grade history" ON student_grade_history;
CREATE POLICY "Teachers can view grade history"
ON student_grade_history FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT s.id FROM students s
    JOIN classes c ON s.class_id = c.id
    WHERE c.main_teacher_id = auth.uid()
  )
  OR student_id IN (
    SELECT s.id FROM students s
    JOIN class_teachers ct ON s.class_id = ct.class_id
    WHERE ct.teacher_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can manage grade history" ON student_grade_history;
CREATE POLICY "Admins can manage grade history"
ON student_grade_history FOR ALL
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

-- temp_class_assignments RLS
ALTER TABLE temp_class_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view temp assignments" ON temp_class_assignments;
CREATE POLICY "Admins can view temp assignments"
ON temp_class_assignments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can manage temp assignments" ON temp_class_assignments;
CREATE POLICY "Admins can manage temp assignments"
ON temp_class_assignments FOR ALL
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

-- year_transition_logs RLS
ALTER TABLE year_transition_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view transition logs" ON year_transition_logs;
CREATE POLICY "Admins can view transition logs"
ON year_transition_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can manage transition logs" ON year_transition_logs;
CREATE POLICY "Admins can manage transition logs"
ON year_transition_logs FOR ALL
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

-- ==================================================
-- 7. 학년 자동 증가 함수
-- ==================================================
CREATE OR REPLACE FUNCTION increment_student_grades()
RETURNS void AS $$
BEGIN
  UPDATE students
  SET grade = CASE
    WHEN grade < 6 THEN grade + 1
    WHEN grade = 6 THEN 1  -- 중1로 리셋 (부서 이동 필요할 수 있음)
    ELSE grade  -- 그 외는 유지
  END,
  updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- 8. 기존 데이터 마이그레이션 (현재 students.class_id를 class_assignments에 복사)
-- ==================================================
-- 이미 class_assignments에 데이터가 있으면 스킵
INSERT INTO class_assignments (student_id, class_id, year, start_date)
SELECT 
  s.id, 
  s.class_id, 
  c.year, 
  COALESCE(s.created_at::date, CURRENT_DATE)
FROM students s
JOIN classes c ON s.class_id = c.id
WHERE s.is_active = TRUE
ON CONFLICT (student_id, year) DO NOTHING;

-- 기존 학년 이력도 기록
INSERT INTO student_grade_history (student_id, year, grade, school_name)
SELECT 
  s.id,
  c.year,
  s.grade,
  s.school_name
FROM students s
JOIN classes c ON s.class_id = c.id
WHERE s.is_active = TRUE
ON CONFLICT (student_id, year) DO NOTHING;

-- ==================================================
-- 9. 헬퍼 뷰 생성: 현재 연도 활성 반 조회
-- ==================================================
CREATE OR REPLACE VIEW active_classes AS
SELECT c.*, 
       d.name as department_name,
       p.full_name as teacher_name
FROM classes c
LEFT JOIN departments d ON c.department = d.name
LEFT JOIN profiles p ON c.main_teacher_id = p.id
WHERE c.is_active = TRUE;

-- ==================================================
-- 10. 헬퍼 뷰 생성: 학생 현재 반 배정 조회
-- ==================================================
CREATE OR REPLACE VIEW current_class_assignments AS
SELECT ca.*, 
       s.name as student_name,
       s.grade,
       c.name as class_name,
       c.department
FROM class_assignments ca
JOIN students s ON ca.student_id = s.id
JOIN classes c ON ca.class_id = c.id
WHERE ca.end_date IS NULL;
