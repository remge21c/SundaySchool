-- 부서별로 한 반만 남기고 나머지 삭제
-- 테스트를 쉽게 하기 위한 데이터 정리 스크립트
-- 각 부서별로 가장 먼저 생성된 반(created_at이 가장 오래된 것)만 남김

-- 주의: 이 스크립트는 데이터를 영구적으로 삭제합니다. 실행 전 백업을 권장합니다.
-- CASCADE로 인해 해당 반의 students, attendance_logs도 함께 삭제됩니다.

-- ============================================
-- 1단계: 실행 전 현재 상태 확인
-- ============================================
-- 아래 쿼리를 먼저 실행하여 현재 부서별 반 개수를 확인하세요:
/*
SELECT 
  department,
  COUNT(*) as class_count,
  STRING_AGG(name, ', ' ORDER BY created_at) as class_names
FROM classes
GROUP BY department
ORDER BY department;
*/

-- ============================================
-- 2단계: 삭제 실행
-- ============================================
-- 부서별로 가장 먼저 생성된 반(created_at이 가장 오래된 것)만 남기고 나머지 삭제
DELETE FROM classes
WHERE id NOT IN (
  -- 각 부서별로 가장 먼저 생성된 반의 ID만 선택
  SELECT DISTINCT ON (department) id
  FROM classes
  ORDER BY department, created_at ASC
);

-- ============================================
-- 3단계: 실행 후 결과 확인
-- ============================================
-- 아래 쿼리를 실행하여 각 부서별로 한 반만 남았는지 확인하세요:
/*
SELECT 
  department,
  COUNT(*) as class_count,
  STRING_AGG(name, ', ' ORDER BY created_at) as class_names
FROM classes
GROUP BY department
ORDER BY department;
*/
