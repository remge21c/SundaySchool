-- 출석 시 달란트 자동 지급 트리거
-- attendance_logs 테이블에 출석 기록(status = 'present')이 추가될 때 자동으로 달란트 포인트 지급

-- 트리거 함수 생성
CREATE OR REPLACE FUNCTION award_talent_on_attendance()
RETURNS TRIGGER AS $$
DECLARE
  talent_amount INTEGER;
  attendance_category TEXT := '출석';
BEGIN
  -- 출석(status = 'present')인 경우에만 처리
  IF NEW.status = 'present' THEN
    -- talent_rules에서 '출석' 카테고리의 포인트 조회
    SELECT amount INTO talent_amount
    FROM talent_rules
    WHERE category = attendance_category
      AND is_active = true
    LIMIT 1;

    -- 규칙이 있고 포인트가 0보다 큰 경우에만 거래 생성
    IF talent_amount IS NOT NULL AND talent_amount > 0 THEN
      -- 중복 지급 방지: 같은 날짜에 이미 거래가 있는지 확인
      IF NOT EXISTS (
        SELECT 1 FROM talent_transactions
        WHERE student_id = NEW.student_id
          AND category = attendance_category
          AND DATE(created_at) = NEW.date
      ) THEN
        -- talent_transactions 테이블에 INSERT
        INSERT INTO talent_transactions (student_id, amount, category)
        VALUES (NEW.student_id, talent_amount, attendance_category);
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_award_talent_on_attendance ON attendance_logs;
CREATE TRIGGER trigger_award_talent_on_attendance
  AFTER INSERT ON attendance_logs
  FOR EACH ROW
  EXECUTE FUNCTION award_talent_on_attendance();
