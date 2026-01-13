-- 학생 사진 필드 추가
-- students 테이블에 photo_url 컬럼 추가

ALTER TABLE students
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 인덱스 추가 (선택사항, 사진이 있는 학생만 조회할 때 유용)
CREATE INDEX IF NOT EXISTS idx_students_photo_url ON students(photo_url) WHERE photo_url IS NOT NULL;
