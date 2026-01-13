-- 부서 순서 조정 기능 추가
-- departments 테이블에 order 컬럼 추가

-- 1. order 컬럼 추가
ALTER TABLE departments 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 2. 기존 데이터에 순서 부여 (이름 순서대로)
UPDATE departments
SET sort_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) as row_num
  FROM departments
) AS subquery
WHERE departments.id = subquery.id;

-- 3. 인덱스 생성 (정렬 성능 향상)
CREATE INDEX IF NOT EXISTS idx_departments_sort_order ON departments(sort_order);

-- 4. NOT NULL 제약조건 추가 (기본값이 있으므로 안전)
ALTER TABLE departments 
ALTER COLUMN sort_order SET NOT NULL;
