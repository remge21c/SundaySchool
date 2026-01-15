-- 학년도 전환 관련 테이블 및 함수 삭제 SQL
-- 034_create_year_transition_tables.sql 에서 생성된 테이블과 함수를 제거합니다.

-- 1. 함수 삭제
DROP FUNCTION IF EXISTS increment_student_grades();

-- 2. 테이블 삭제 (역순으로 삭제)
DROP TABLE IF EXISTS year_transition_log CASCADE;
DROP TABLE IF EXISTS temp_class_assignments CASCADE;
DROP TABLE IF EXISTS student_grade_history CASCADE;
DROP TABLE IF EXISTS class_assignments CASCADE;

-- 3. classes 테이블의 is_active 컬럼은 유용할 수 있으므로 유지하거나, 필요시 제거
-- ALTER TABLE classes DROP COLUMN IF EXISTS is_active;
