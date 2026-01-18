-- 이번 주(최근 7일) 출석 체크와 달란트 점수 동기화 스크립트
-- 출석부(attendance_logs)와 달란트 내역(talent_transactions)을 비교하여 불일치 해결

-- 1. 매칭 대상 기간 설정 (최근 7일, 이번 주 주일 포함)
-- 필요 시 아래 날짜 범위를 수정하세요.
DO $$
DECLARE
    target_start_date DATE := CURRENT_DATE - INTERVAL '7 days';
    target_end_date DATE := CURRENT_DATE + INTERVAL '1 day'; -- 내일까지 (오늘 포함)
    talent_amount INTEGER;
    attendance_category TEXT := '출석';
BEGIN
    RAISE NOTICE '동기화 기간: % ~ %', target_start_date, target_end_date;

    -- 1. 출석 점수 규칙 가져오기
    SELECT amount INTO talent_amount
    FROM talent_rules
    WHERE category = attendance_category
    AND is_active = true
    LIMIT 1;

    IF talent_amount IS NULL THEN
        RAISE EXCEPTION '출석 달란트 규칙을 찾을 수 없습니다.';
    END IF;

    -- 2. 불필요한 달란트 삭제 (출석부에 '결석' 등으로 되어있는데 달란트가 있는 경우)
    DELETE FROM talent_transactions tt
    WHERE category = attendance_category
    AND attendance_date >= target_start_date
    AND attendance_date <= target_end_date
    AND NOT EXISTS (
        SELECT 1 
        FROM attendance_logs al 
        WHERE al.student_id = tt.student_id 
        AND al.date = tt.attendance_date 
        AND al.status = 'present'
    );
    
    RAISE NOTICE '불일치 달란트 삭제 완료';

    -- 3. 누락된 달란트 지급 (출석부에 '출석'인데 달란트가 없는 경우)
    INSERT INTO talent_transactions (student_id, amount, category, attendance_date)
    SELECT 
        al.student_id, 
        talent_amount, 
        attendance_category, 
        al.date
    FROM attendance_logs al
    WHERE al.status = 'present'
    AND al.date >= target_start_date
    AND al.date <= target_end_date
    AND NOT EXISTS (
        SELECT 1 
        FROM talent_transactions tt 
        WHERE tt.student_id = al.student_id 
        AND tt.category = attendance_category 
        AND tt.attendance_date = al.date
    );

    RAISE NOTICE '누락된 달란트 지급 완료';
END $$;
