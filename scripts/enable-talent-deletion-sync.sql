-- 달란트 삭제 시 출석 체크도 함께 취소(미체크)하는 동기화 스크립트
-- 이 스크립트를 실행하면: 달란트 내역 삭제 -> 해당 날짜 출석 기록 삭제됨

-- 1. 안전장치: attendance_date 컬럼 확인 및 추가
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'talent_transactions' AND column_name = 'attendance_date') THEN
        ALTER TABLE talent_transactions ADD COLUMN attendance_date DATE;
    END IF;
END $$;

-- 2. 기존 데이터의 attendance_date 채우기 (안전을 위한 중복 실행)
UPDATE talent_transactions
SET attendance_date = DATE(created_at AT TIME ZONE 'Asia/Seoul')
WHERE category = '출석' AND attendance_date IS NULL;

-- 3. 트리거 함수 정의
-- 달란트 내역이 삭제될 때 실행되는 함수
CREATE OR REPLACE FUNCTION sync_attendance_on_talent_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- 삭제된 거래가 '출석' 카테고리인 경우에만 동작
  IF OLD.category = '출석' THEN
    -- 연관된 출석 기록 삭제
    -- attendance_logs 테이블에서 해당 학생, 해당 날짜의 'present' 기록을 찾아 삭제
    DELETE FROM attendance_logs
    WHERE student_id = OLD.student_id
      AND date = COALESCE(OLD.attendance_date, DATE(OLD.created_at AT TIME ZONE 'Asia/Seoul'))
      AND status = 'present'; 
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 트리거 생성
-- 기존 트리거가 있다면 삭제하고 새로 생성
DROP TRIGGER IF EXISTS on_talent_delete ON talent_transactions;

CREATE TRIGGER on_talent_delete
AFTER DELETE ON talent_transactions
FOR EACH ROW
EXECUTE FUNCTION sync_attendance_on_talent_delete();
