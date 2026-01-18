-- 출석 달란트 중복 지급 버그 수정
-- 문제: DATE(created_at) = NEW.date 비교에서 타임존 차이로 인해 중복 체크가 실패함
-- 해결: attendance_date 컬럼을 추가하여 출석 날짜 기준으로 중복 체크

-- 1. talent_transactions 테이블에 attendance_date 컬럼 추가
-- 이 컬럼은 출석 관련 트랜잭션의 경우 해당 출석 날짜를 저장
ALTER TABLE talent_transactions 
ADD COLUMN IF NOT EXISTS attendance_date DATE;

-- 2. 인덱스 추가 (중복 체크 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_talent_attendance_date 
ON talent_transactions(student_id, category, attendance_date);

-- 3. 트리거 함수 재생성 (attendance_date 기반 중복 체크)
CREATE OR REPLACE FUNCTION award_talent_on_attendance()
RETURNS TRIGGER AS $$
DECLARE
  talent_amount INTEGER;
  attendance_category TEXT := '출석';
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
      -- 중복 지급 방지: 해당 출석 날짜에 이미 '출석' 카테고리 거래가 있는지 확인
      -- attendance_date 컬럼을 사용하여 타임존 문제 해결
      IF NOT EXISTS (
        SELECT 1 FROM talent_transactions
        WHERE student_id = NEW.student_id
          AND category = attendance_category
          AND attendance_date = NEW.date
      ) THEN
        -- talent_transactions 테이블에 INSERT (attendance_date 포함)
        INSERT INTO talent_transactions (student_id, amount, category, attendance_date)
        VALUES (NEW.student_id, talent_amount, attendance_category, NEW.date);
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 기존 출석 관련 트랜잭션에 attendance_date 업데이트 (데이터 정합성)
-- created_at의 한국 시간대를 기준으로 날짜 설정
UPDATE talent_transactions
SET attendance_date = DATE(created_at AT TIME ZONE 'Asia/Seoul')
WHERE category = '출석' AND attendance_date IS NULL;

