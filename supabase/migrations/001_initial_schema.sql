-- 차세대 주일학교 교적부 초기 스키마
-- Database Design 문서 참조

-- 1. profiles (사용자/교사)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'parent')),
  full_name TEXT,
  phone_number TEXT,
  department_id UUID,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. classes (반 정보)
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  year INTEGER NOT NULL,
  main_teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. students (학생 정보)
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  birthday DATE,
  gender TEXT,
  school_name TEXT,
  grade INTEGER NOT NULL,
  parent_contact TEXT NOT NULL,
  address TEXT,
  allergies JSONB,
  is_active BOOLEAN DEFAULT true,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. attendance_logs (출석 기록)
CREATE TABLE IF NOT EXISTS attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- 5. visitation_logs (심방 기록)
CREATE TABLE IF NOT EXISTS visitation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('call', 'visit', 'kakao')),
  content TEXT NOT NULL,
  prayer_request TEXT,
  is_confidential BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. talent_transactions (달란트 장부) - v2
CREATE TABLE IF NOT EXISTS talent_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('출석', '암송', '마켓사용')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_is_active ON students(is_active);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
CREATE INDEX IF NOT EXISTS idx_classes_year ON classes(year);
CREATE INDEX IF NOT EXISTS idx_classes_department ON classes(department);
CREATE INDEX IF NOT EXISTS idx_classes_main_teacher_id ON classes(main_teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance_logs(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance_logs(class_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_visitation_student ON visitation_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_visitation_teacher ON visitation_logs(teacher_id);
CREATE INDEX IF NOT EXISTS idx_visitation_date ON visitation_logs(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_talent_student ON talent_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_talent_category ON talent_transactions(category);
CREATE INDEX IF NOT EXISTS idx_talent_date ON talent_transactions(created_at DESC);

-- RLS (Row Level Security) 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_transactions ENABLE ROW LEVEL SECURITY;

-- RLS 정책 (기본 정책 - 상세 정책은 별도 마이그레이션에서)
-- 기존 정책이 있으면 삭제 후 재생성 (멱등성 보장)

-- profiles 테이블 정책
DROP POLICY IF EXISTS "Teachers can view own profile" ON profiles;
CREATE POLICY "Teachers can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Teachers can update own profile" ON profiles;
CREATE POLICY "Teachers can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- students 테이블 정책
DROP POLICY IF EXISTS "Teachers can view their class students" ON students;
CREATE POLICY "Teachers can view their class students"
ON students FOR SELECT
TO authenticated
USING (
  class_id IN (
    SELECT id FROM classes
    WHERE main_teacher_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- attendance_logs 테이블 정책
DROP POLICY IF EXISTS "Teachers can manage their class attendance" ON attendance_logs;
CREATE POLICY "Teachers can manage their class attendance"
ON attendance_logs FOR ALL
TO authenticated
USING (
  class_id IN (
    SELECT id FROM classes
    WHERE main_teacher_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- visitation_logs 테이블 정책
DROP POLICY IF EXISTS "Teachers can view their class visitations" ON visitation_logs;
CREATE POLICY "Teachers can view their class visitations"
ON visitation_logs FOR SELECT
TO authenticated
USING (
  (student_id IN (
    SELECT id FROM students
    WHERE class_id IN (
      SELECT id FROM classes
      WHERE main_teacher_id = auth.uid()
    )
  ) AND is_confidential = false)
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Teachers can create visitations" ON visitation_logs;
CREATE POLICY "Teachers can create visitations"
ON visitation_logs FOR INSERT
TO authenticated
WITH CHECK (
  student_id IN (
    SELECT id FROM students
    WHERE class_id IN (
      SELECT id FROM classes
      WHERE main_teacher_id = auth.uid()
    )
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- classes 테이블 정책
DROP POLICY IF EXISTS "Teachers can view their own classes" ON classes;
CREATE POLICY "Teachers can view their own classes"
ON classes FOR SELECT
TO authenticated
USING (
  main_teacher_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
