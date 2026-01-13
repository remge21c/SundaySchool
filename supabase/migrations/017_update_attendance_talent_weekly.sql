-- 출석 달란트 지급 기준을 주간(일요일~토요일) 기준으로 변경
-- 이번주 일요일부터 토요일까지의 기간 내에서 출석이 체크되면 점수를 획득

-- 트리거 함수 재생성
CREATE OR REPLACE FUNCTION award_talent_on_attendance()
RETURNS TRIGGER AS $$
DECLARE
  talent_amount INTEGER;
  attendance_category TEXT := '출석';
  week_start_date DATE; -- 해당 주의 일요일
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
      -- 출석일이 속한 주의 일요일 계산 (DOW: 0=일요일, 6=토요일)
      week_start_date := NEW.date - (EXTRACT(DOW FROM NEW.date)::int || ' days')::interval;
      
      -- 중복 지급 방지: 해당 주(일요일~토요일)에 이미 '출석' 카테고리 거래가 있는지 확인
      IF NOT EXISTS (
        SELECT 1 FROM talent_transactions
        WHERE student_id = NEW.student_id
          AND category = attendance_category
          AND DATE(created_at) >= week_start_date
          AND DATE(created_at) < week_start_date + INTERVAL '7 days'
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
