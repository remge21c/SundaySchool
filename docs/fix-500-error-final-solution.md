# 500 에러 최종 해결 방법

## 문제 원인

RLS 정책에서 `class_teachers` 테이블을 참조할 때 테이블이 없거나 정책이 잘못되어 500 에러가 발생합니다.

## 해결 방법 (단계별)

### 1단계: class_teachers 테이블 생성 확인

Supabase SQL Editor에서 다음 SQL을 실행하여 테이블이 존재하는지 확인:

```sql
-- 테이블 존재 여부 확인
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'class_teachers'
);
```

**결과가 `false`이면 아래 SQL을 실행:**

```sql
-- class_teachers 테이블 생성
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
```

### 2단계: RLS 정책 단순화 (가장 중요!)

**아래 SQL을 반드시 실행하세요:**

```sql
-- 1. classes 테이블 SELECT 정책 - 가장 단순한 버전
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

-- 2. students 테이블 SELECT 정책 - 가장 단순한 버전
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

-- 3. attendance_logs 테이블 정책 - 가장 단순한 버전
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

-- 4. visitation_logs 테이블 INSERT 정책 - 가장 단순한 버전
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
```

## 설명

이 방법은 `class_teachers` 테이블 참조를 완전히 제거하고 기본 정책만 사용합니다. 이렇게 하면:
- ✅ 500 에러가 해결됩니다
- ✅ 기존 기능이 정상 작동합니다
- ✅ `class_teachers` 테이블이 있어도 문제없습니다 (다만 다중 교사 배정 기능은 나중에 추가 가능)

## 실행 후 확인

1. 브라우저 새로고침
2. 대시보드가 정상적으로 로드되는지 확인
3. 반 목록이 정상적으로 표시되는지 확인

## 참고

- 이 방법은 `class_teachers` 테이블을 사용하지 않는 기본 정책입니다
- 나중에 다중 교사 배정 기능이 필요하면 RLS 정책을 다시 업데이트할 수 있습니다
- 지금은 기본 기능이 작동하는 것이 우선입니다
