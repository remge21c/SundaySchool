-- student_notes 테이블 생성
-- 학생별 메모를 저장하는 테이블

CREATE TABLE IF NOT EXISTS student_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  note_date DATE NOT NULL DEFAULT CURRENT_DATE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_student_notes_student_id ON student_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_teacher_id ON student_notes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_date ON student_notes(note_date DESC);
CREATE INDEX IF NOT EXISTS idx_student_notes_created_at ON student_notes(created_at DESC);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_student_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_student_notes_updated_at ON student_notes;
CREATE TRIGGER trigger_update_student_notes_updated_at
  BEFORE UPDATE ON student_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_student_notes_updated_at();

-- RLS 활성화
ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 교사는 자신이 담당하는 반의 학생 메모 조회 가능, 관리자는 모든 메모 조회 가능
DROP POLICY IF EXISTS "Teachers can view their class student notes" ON student_notes;
CREATE POLICY "Teachers can view their class student notes"
ON student_notes FOR SELECT
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

-- RLS 정책: 교사는 자신이 담당하는 반의 학생 메모 생성 가능, 관리자는 모든 메모 생성 가능
DROP POLICY IF EXISTS "Teachers can create notes for their class students" ON student_notes;
CREATE POLICY "Teachers can create notes for their class students"
ON student_notes FOR INSERT
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

-- RLS 정책: 교사는 자신이 작성한 메모만 수정 가능, 관리자는 모든 메모 수정 가능
DROP POLICY IF EXISTS "Teachers can update their own notes" ON student_notes;
CREATE POLICY "Teachers can update their own notes"
ON student_notes FOR UPDATE
TO authenticated
USING (
  teacher_id = auth.uid()
  OR public.user_role() = 'admin'
)
WITH CHECK (
  teacher_id = auth.uid()
  OR public.user_role() = 'admin'
);

-- RLS 정책: 교사는 자신이 작성한 메모만 삭제 가능, 관리자는 모든 메모 삭제 가능
DROP POLICY IF EXISTS "Teachers can delete their own notes" ON student_notes;
CREATE POLICY "Teachers can delete their own notes"
ON student_notes FOR DELETE
TO authenticated
USING (
  teacher_id = auth.uid()
  OR public.user_role() = 'admin'
);
