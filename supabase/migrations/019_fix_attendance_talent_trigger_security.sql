-- 출석 달란트 트리거 함수에 SECURITY DEFINER 추가
-- RLS 정책을 우회하여 트리거에서 talent_transactions에 INSERT 가능하도록 수정

-- 트리거 함수 재생성 (SECURITY DEFINER 추가)
CREATE OR REPLACE FUNCTION award_talent_on_attendance()
RETURNS TRIGGER AS $$
DECLARE
  talent_amount INTEGER;
  attendance_category TEXT := '출석';
  week_start_date DATE; -- 해당 주의 일요일
BEGIN
  -- INSERT 또는 UPDATE에서 status가 'present'로 변경된 경우에만 처리
  -- UPDATE인 경우: 이전 상태가 'present'가 아니었고, 새로운 상태가 'present'인 경우
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
      -- 출석일이 속한 주의 일요일 계산 (DOW: 0=일요일, 6=토요일)
      -- PostgreSQL의 EXTRACT(DOW FROM date)는 일요일=0, 월요일=1, ..., 토요일=6
      week_start_date := NEW.date - (EXTRACT(DOW FROM NEW.date)::int * INTERVAL '1 day');
      
      -- 중복 지급 방지: 해당 주(일요일~토요일)에 이미 '출석' 카테고리 거래가 있는지 확인
      IF NOT EXISTS (
        SELECT 1 FROM talent_transactions
        WHERE student_id = NEW.student_id
          AND category = attendance_category
          AND DATE(created_at) >= week_start_date
          AND DATE(created_at) <= (week_start_date + INTERVAL '6 days')
      ) THEN
        -- talent_transactions 테이블에 INSERT
        INSERT INTO talent_transactions (student_id, amount, category)
        VALUES (NEW.student_id, talent_amount, attendance_category);
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
