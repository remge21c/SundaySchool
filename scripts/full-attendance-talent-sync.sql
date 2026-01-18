-- 출석 상태와 달란트 점수 완전 양방향 연동 스크립트
-- 이 스크립트 실행 후:
--   1. 출석 체크(present) → 달란트 자동 지급
--   2. 출석 취소(absent/late로 변경 또는 삭제) → 달란트 자동 회수
--   3. 달란트 삭제 → 출석 기록도 삭제

-- ============================================================
-- Part 1: attendance_date 컬럼 준비
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'talent_transactions' AND column_name = 'attendance_date') THEN
        ALTER TABLE talent_transactions ADD COLUMN attendance_date DATE;
    END IF;
END $$;

-- 기존 데이터 attendance_date 채우기
UPDATE talent_transactions
SET attendance_date = DATE(created_at AT TIME ZONE 'Asia/Seoul')
WHERE category = '출석' AND attendance_date IS NULL;

-- ============================================================
-- Part 2: 중복 방지 및 데이터 정합성을 위한 유니크 인덱스
-- ============================================================
DROP INDEX IF EXISTS idx_talent_attendance_date;
CREATE UNIQUE INDEX IF NOT EXISTS idx_talent_attendance_date_unique 
ON talent_transactions(student_id, category, attendance_date) 
WHERE category = '출석';

-- ============================================================
-- Part 3: 출석 체크 → 달란트 지급/회수 트리거
-- ============================================================
CREATE OR REPLACE FUNCTION award_talent_on_attendance()
RETURNS TRIGGER AS $$
DECLARE
  talent_amount INTEGER;
  attendance_category TEXT := '출석';
BEGIN
  -- INSERT: 출석(present)으로 새 기록 생성 시 달란트 지급
  IF (TG_OP = 'INSERT' AND NEW.status = 'present') THEN
    SELECT amount INTO talent_amount
    FROM talent_rules
    WHERE category = attendance_category AND is_active = true
    LIMIT 1;

    IF talent_amount IS NOT NULL AND talent_amount > 0 THEN
      INSERT INTO talent_transactions (student_id, amount, category, attendance_date)
      VALUES (NEW.student_id, talent_amount, attendance_category, NEW.date)
      ON CONFLICT (student_id, category, attendance_date) WHERE category = '출석'
      DO NOTHING;
    END IF;
  
  -- UPDATE: 상태 변경 처리
  ELSIF (TG_OP = 'UPDATE') THEN
    -- 출석으로 변경된 경우 → 달란트 지급
    IF (OLD.status != 'present' AND NEW.status = 'present') THEN
      SELECT amount INTO talent_amount
      FROM talent_rules
      WHERE category = attendance_category AND is_active = true
      LIMIT 1;

      IF talent_amount IS NOT NULL AND talent_amount > 0 THEN
        INSERT INTO talent_transactions (student_id, amount, category, attendance_date)
        VALUES (NEW.student_id, talent_amount, attendance_category, NEW.date)
        ON CONFLICT (student_id, category, attendance_date) WHERE category = '출석'
        DO NOTHING;
      END IF;
    
    -- 출석에서 다른 상태로 변경된 경우 → 달란트 회수
    ELSIF (OLD.status = 'present' AND NEW.status != 'present') THEN
      DELETE FROM talent_transactions
      WHERE student_id = NEW.student_id
        AND category = attendance_category
        AND attendance_date = NEW.date;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 트리거 삭제 후 재생성
DROP TRIGGER IF EXISTS on_attendance_change ON attendance_logs;
CREATE TRIGGER on_attendance_change
AFTER INSERT OR UPDATE ON attendance_logs
FOR EACH ROW
EXECUTE FUNCTION award_talent_on_attendance();

-- ============================================================
-- Part 4: 출석 기록 삭제 → 달란트 회수 트리거
-- ============================================================
CREATE OR REPLACE FUNCTION revoke_talent_on_attendance_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- 삭제된 기록이 출석(present)였다면 달란트도 삭제
  IF OLD.status = 'present' THEN
    DELETE FROM talent_transactions
    WHERE student_id = OLD.student_id
      AND category = '출석'
      AND attendance_date = OLD.date;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_attendance_delete ON attendance_logs;
CREATE TRIGGER on_attendance_delete
AFTER DELETE ON attendance_logs
FOR EACH ROW
EXECUTE FUNCTION revoke_talent_on_attendance_delete();

-- ============================================================
-- Part 5: 달란트 삭제 → 출석 기록 삭제 트리거
-- ============================================================
CREATE OR REPLACE FUNCTION sync_attendance_on_talent_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.category = '출석' THEN
    DELETE FROM attendance_logs
    WHERE student_id = OLD.student_id
      AND date = COALESCE(OLD.attendance_date, DATE(OLD.created_at AT TIME ZONE 'Asia/Seoul'))
      AND status = 'present';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_talent_delete ON talent_transactions;
CREATE TRIGGER on_talent_delete
AFTER DELETE ON talent_transactions
FOR EACH ROW
EXECUTE FUNCTION sync_attendance_on_talent_delete();

-- ============================================================
-- Part 6: 이번 주 기존 데이터 동기화 (초기 정합성 맞추기)
-- ============================================================
DO $$
DECLARE
    target_start_date DATE := CURRENT_DATE - INTERVAL '7 days';
    target_end_date DATE := CURRENT_DATE + INTERVAL '1 day';
    talent_amount INTEGER;
    attendance_category TEXT := '출석';
BEGIN
    -- 출석 점수 규칙 가져오기
    SELECT amount INTO talent_amount
    FROM talent_rules
    WHERE category = attendance_category AND is_active = true
    LIMIT 1;

    IF talent_amount IS NULL THEN
        RAISE NOTICE '출석 달란트 규칙을 찾을 수 없습니다. 기본값 10으로 설정합니다.';
        talent_amount := 10;
    END IF;

    -- 1. 출석 아닌데 달란트 있는 경우 삭제
    DELETE FROM talent_transactions tt
    WHERE category = attendance_category
      AND attendance_date >= target_start_date
      AND attendance_date <= target_end_date
      AND NOT EXISTS (
        SELECT 1 FROM attendance_logs al 
        WHERE al.student_id = tt.student_id 
          AND al.date = tt.attendance_date 
          AND al.status = 'present'
      );
    
    RAISE NOTICE '불일치 달란트 삭제 완료';

    -- 2. 출석인데 달란트 없는 경우 지급
    INSERT INTO talent_transactions (student_id, amount, category, attendance_date)
    SELECT al.student_id, talent_amount, attendance_category, al.date
    FROM attendance_logs al
    WHERE al.status = 'present'
      AND al.date >= target_start_date
      AND al.date <= target_end_date
      AND NOT EXISTS (
        SELECT 1 FROM talent_transactions tt 
        WHERE tt.student_id = al.student_id 
          AND tt.category = attendance_category 
          AND tt.attendance_date = al.date
      );

    RAISE NOTICE '누락된 달란트 지급 완료';
END $$;

-- 완료!
-- 이제 출석 <-> 달란트가 완전히 연동됩니다.
