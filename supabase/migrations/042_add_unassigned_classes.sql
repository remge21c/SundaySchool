-- 각 부서에 "미배정" 반 생성 (없는 경우에만)
-- grade_level = 0으로 설정하여 미배정 학생 식별

DO $$
DECLARE
    dept_name TEXT;
    current_yr INT := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
    -- 모든 고유 부서명에 대해 미배정 반 생성
    FOR dept_name IN 
        SELECT DISTINCT department FROM classes WHERE department IS NOT NULL
    LOOP
        -- 해당 부서에 미배정 반이 없으면 생성
        IF NOT EXISTS (
            SELECT 1 FROM classes 
            WHERE department = dept_name 
            AND name = '미배정' 
            AND year = current_yr
        ) THEN
            INSERT INTO classes (name, department, grade_level, year, is_active)
            VALUES ('미배정', dept_name, 0, current_yr, true);
        END IF;
    END LOOP;
END $$;

-- 향후 새 부서 생성 시 미배정 반 자동 생성을 위한 트리거 (선택사항)
-- 현재는 수동으로 관리
