-- 출석 달란트 중복 문제 완전 해결 통합 스크립트

-- 1. 기존 중복 데이터 정리 (가장 먼저 생성된 기록만 유지)
WITH duplicates AS (
  SELECT 
    tt.id,
    tt.student_id,
    tt.created_at,
    tt.category,
    ROW_NUMBER() OVER (
      PARTITION BY tt.student_id, tt.category, DATE(tt.created_at AT TIME ZONE 'Asia/Seoul')
      ORDER BY tt.created_at ASC
    ) as row_num
  FROM talent_transactions tt
  WHERE tt.category = '출석'
)
DELETE FROM talent_transactions
WHERE id IN (
  SELECT id FROM duplicates WHERE row_num > 1
);

-- 2. talent_transactions 테이블에 attendance_date 컬럼 추가 (없으면)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'talent_transactions' AND column_name = 'attendance_date') THEN
        ALTER TABLE talent_transactions ADD COLUMN attendance_date DATE;
    END IF;
END $$;

-- 3. 기존 데이터의 attendance_date 채우기 (한국 시간 기준)
UPDATE talent_transactions
SET attendance_date = DATE(created_at AT TIME ZONE 'Asia/Seoul')
WHERE category = '출석' AND attendance_date IS NULL;

-- 4. 향후 중복 방지를 위한 유니크 인덱스 생성
-- (student_id, category, attendance_date) 조합이 유일하도록 설정
DROP INDEX IF EXISTS idx_talent_attendance_date; -- 기존 일반 인덱스가 있다면 삭제
CREATE UNIQUE INDEX IF NOT EXISTS idx_talent_attendance_date_unique 
ON talent_transactions(student_id, category, attendance_date) 
WHERE category = '출석';

-- 5. 트리거 함수 개선 (attendance_date 사용 및 CONFLICT 처리)
CREATE OR REPLACE FUNCTION award_talent_on_attendance()
RETURNS TRIGGER AS $$
DECLARE
  talent_amount INTEGER;
  attendance_category TEXT := '출석';
BEGIN
  -- INSERT 또는 UPDATE에서 status가 'present'로 변경된 경우에만 처리
  IF (TG_OP = 'INSERT' AND NEW.status = 'present') OR 
     (TG_OP = 'UPDATE' AND OLD.status != 'present' AND NEW.status = 'present') THEN
    
    -- talent_rules에서 '출석' 카테고리의 포인트 조회
    SELECT amount INTO talent_amount
    FROM talent_rules
    WHERE category = attendance_category
      AND is_active = true
      LIMIT 1;

    -- 규칙이 있고 포인트가 0보다 큰 경우에만 거래 생성
    IF talent_amount IS NOT NULL AND talent_amount > 0 THEN
      -- attendance_date를 명시하여 삽입, 중복 시 아무것도 하지 않음 (ON CONFLICT DO NOTHING)
      INSERT INTO talent_transactions (student_id, amount, category, attendance_date)
      VALUES (NEW.student_id, talent_amount, attendance_category, NEW.date)
      ON CONFLICT (student_id, category, attendance_date) 
      WHERE category = '출석'
      DO NOTHING; 
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 완료 메시지
-- 실행 후 "Query returned successfully"가 나오면 적용 완료입니다.
