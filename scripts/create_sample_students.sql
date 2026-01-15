-- ============================================================
-- 학생 샘플 데이터 생성 SQL (수정됨)
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- 1. 먼저 헬퍼 함수를 생성합니다 (DO 블록 밖에서)
CREATE OR REPLACE FUNCTION get_or_create_class(p_dept TEXT, p_name TEXT, p_year INT, p_teacher_id UUID) 
RETURNS UUID AS $$
DECLARE
    ret_id UUID;
BEGIN
    SELECT id INTO ret_id FROM classes WHERE department = p_dept AND name = p_name AND year = p_year;
    
    IF ret_id IS NULL THEN
        INSERT INTO classes (department, name, year, main_teacher_id)
        VALUES (p_dept, p_name, p_year, p_teacher_id)
        RETURNING id INTO ret_id;
        RAISE NOTICE 'Created missing class: % %', p_dept, p_name;
    END IF;
    
    RETURN ret_id;
END;
$$ LANGUAGE plpgsql;

-- 2. 데이터 생성 실행
DO $$
DECLARE
    v_teacher_id UUID;
    v_class_id UUID;
    v_student_id UUID;
    v_student_name TEXT;
    v_birthday DATE;
    v_gender TEXT;
    v_school_name TEXT;
    v_grade INT;
    v_parent_contact TEXT;
    v_address TEXT;
    v_current_year INT := 2026;
    v_name_idx INT := 0;
    
    -- 이름 배열
    v_last_names TEXT[] := ARRAY['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '전'];
    v_male_names TEXT[] := ARRAY['민준', '서준', '도윤', '예준', '시우', '주원', '하준', '지호', '준우', '준서', '건우', '현우', '지훈', '우진', '민재', '은성', '동현', '승민', '태민', '찬영', '시윤', '진우', '현준', '연우', '민규'];
    v_female_names TEXT[] := ARRAY['서연', '서윤', '지우', '서현', '민서', '하은', '하윤', '수빈', '지아', '지유', '예은', '수아', '소율', '다은', '채원', '지원', '은서', '유진', '소희', '미래', '예린', '지민', '채은', '서영', '민지'];
    
    v_addresses TEXT[] := ARRAY['서울시 강남구', '서울시 서초구', '서울시 송파구', '서울시 강동구', '서울시 동작구', '서울시 관악구', '서울시 광진구', '서울시 성동구', '서울시 마포구', '서울시 용산구'];

BEGIN
    -- 교사 ID 가져오기
    SELECT id INTO v_teacher_id FROM profiles WHERE role IN ('admin', 'teacher') LIMIT 1;
    IF v_teacher_id IS NULL THEN
        RAISE EXCEPTION 'No teacher found. Please create a teacher first.';
    END IF;

    RAISE NOTICE 'Starting generation for Year %...', v_current_year;

    -- ============================================================
    -- 태영아부: 10명, 1반~4반
    -- ============================================================
    FOR i IN 1..10 LOOP
        v_name_idx := v_name_idx + 1;
        
        IF i <= 3 THEN v_class_id := get_or_create_class('태영아부', '1반', v_current_year, v_teacher_id);
        ELSIF i <= 6 THEN v_class_id := get_or_create_class('태영아부', '2반', v_current_year, v_teacher_id);
        ELSIF i <= 8 THEN v_class_id := get_or_create_class('태영아부', '3반', v_current_year, v_teacher_id);
        ELSE v_class_id := get_or_create_class('태영아부', '4반', v_current_year, v_teacher_id);
        END IF;

        v_gender := CASE WHEN i % 2 = 0 THEN 'male' ELSE 'female' END;
        v_student_name := v_last_names[(v_name_idx % 20) + 1] || CASE WHEN v_gender='male' THEN v_male_names[(v_name_idx % 25) + 1] ELSE v_female_names[(v_name_idx % 25) + 1] END;
        v_birthday := make_date(v_current_year - (i % 3), (v_name_idx % 12) + 1, (v_name_idx % 28) + 1);
        v_grade := 0;
        v_parent_contact := '010-' || lpad((1000 + v_name_idx * 17)::text, 4, '0') || '-' || lpad((1000 + v_name_idx * 31)::text, 4, '0');
        v_address := v_addresses[(v_name_idx % 10) + 1];

        INSERT INTO students (name, birthday, gender, grade, parent_contact, address, class_id, is_active)
        VALUES (v_student_name, v_birthday, v_gender, v_grade, v_parent_contact, v_address, v_class_id, true)
        RETURNING id INTO v_student_id;
        
        IF i = 1 THEN INSERT INTO visitation_logs (student_id, teacher_id, visit_date, type, content) VALUES (v_student_id, v_teacher_id, CURRENT_DATE - 10, 'call', '잘 지내고 있습니다.'); END IF;
    END LOOP;

    -- ============================================================
    -- 유년부: 12명, 1반~5반
    -- ============================================================
    FOR i IN 1..12 LOOP
        v_name_idx := v_name_idx + 1;
        
        IF i <= 3 THEN v_class_id := get_or_create_class('유년부', '1반', v_current_year, v_teacher_id);
        ELSIF i <= 6 THEN v_class_id := get_or_create_class('유년부', '2반', v_current_year, v_teacher_id);
        ELSIF i <= 8 THEN v_class_id := get_or_create_class('유년부', '3반', v_current_year, v_teacher_id);
        ELSIF i <= 10 THEN v_class_id := get_or_create_class('유년부', '4반', v_current_year, v_teacher_id);
        ELSE v_class_id := get_or_create_class('유년부', '5반', v_current_year, v_teacher_id);
        END IF;

        v_gender := CASE WHEN i % 2 != 0 THEN 'male' ELSE 'female' END;
        v_student_name := v_last_names[(v_name_idx % 20) + 1] || CASE WHEN v_gender='male' THEN v_male_names[(v_name_idx % 25) + 1] ELSE v_female_names[(v_name_idx % 25) + 1] END;
        v_birthday := make_date(v_current_year - (3 + (i % 5)), (v_name_idx % 12) + 1, (v_name_idx % 28) + 1);
        v_grade := 0;
        v_parent_contact := '010-' || lpad((2000 + v_name_idx * 13)::text, 4, '0') || '-' || lpad((2000 + v_name_idx * 27)::text, 4, '0');
        v_address := v_addresses[(v_name_idx % 10) + 1];

        INSERT INTO students (name, birthday, gender, grade, parent_contact, address, class_id, is_active)
        VALUES (v_student_name, v_birthday, v_gender, v_grade, v_parent_contact, v_address, v_class_id, true)
        RETURNING id INTO v_student_id;
        
        IF i = 1 THEN INSERT INTO student_notes (student_id, teacher_id, note_date, content) VALUES (v_student_id, v_teacher_id, CURRENT_DATE - 2, '적응 중'); END IF;
    END LOOP;

    -- ============================================================
    -- 초등부: 15명, 1반~6반
    -- ============================================================
    FOR i IN 1..15 LOOP
        v_name_idx := v_name_idx + 1;
        
        IF i <= 3 THEN v_class_id := get_or_create_class('초등부', '1반', v_current_year, v_teacher_id); v_grade := 1;
        ELSIF i <= 6 THEN v_class_id := get_or_create_class('초등부', '2반', v_current_year, v_teacher_id); v_grade := 2;
        ELSIF i <= 9 THEN v_class_id := get_or_create_class('초등부', '3반', v_current_year, v_teacher_id); v_grade := 3;
        ELSIF i <= 11 THEN v_class_id := get_or_create_class('초등부', '4반', v_current_year, v_teacher_id); v_grade := 4;
        ELSIF i <= 13 THEN v_class_id := get_or_create_class('초등부', '5반', v_current_year, v_teacher_id); v_grade := 5;
        ELSE v_class_id := get_or_create_class('초등부', '6반', v_current_year, v_teacher_id); v_grade := 6;
        END IF;

        v_gender := CASE WHEN i % 3 = 0 THEN 'male' ELSE 'female' END;
        v_student_name := v_last_names[(v_name_idx % 20) + 1] || CASE WHEN v_gender='male' THEN v_male_names[(v_name_idx % 25) + 1] ELSE v_female_names[(v_name_idx % 25) + 1] END;
        v_birthday := make_date(v_current_year - (7 + v_grade), (v_name_idx % 12) + 1, (v_name_idx % 28) + 1);
        v_school_name := CASE WHEN i % 2 = 0 THEN '서울초등학교' ELSE '한빛초등학교' END;
        v_parent_contact := '010-' || lpad((3000 + v_name_idx * 11)::text, 4, '0') || '-' || lpad((3000 + v_name_idx * 22)::text, 4, '0');
        v_address := v_addresses[(v_name_idx % 10) + 1];

        INSERT INTO students (name, birthday, gender, school_name, grade, parent_contact, address, class_id, is_active)
        VALUES (v_student_name, v_birthday, v_gender, v_school_name, v_grade, v_parent_contact, v_address, v_class_id, true)
        RETURNING id INTO v_student_id;
        
        IF i = 15 THEN 
            INSERT INTO visitation_logs (student_id, teacher_id, visit_date, type, content) VALUES (v_student_id, v_teacher_id, CURRENT_DATE - 5, 'visit', '졸업 관련 상담');
        END IF;
    END LOOP;

    -- ============================================================
    -- 중고등부: 12명, 1반~6반
    -- ============================================================
    FOR i IN 1..12 LOOP
        v_name_idx := v_name_idx + 1;
        
        IF i <= 2 THEN 
             v_class_id := get_or_create_class('중고등부', '1반', v_current_year, v_teacher_id); 
             v_grade := 1; v_school_name := '서울중학교';
        ELSIF i <= 4 THEN 
             v_class_id := get_or_create_class('중고등부', '2반', v_current_year, v_teacher_id); 
             v_grade := 2; v_school_name := '한빛중학교';
        ELSIF i <= 6 THEN 
             v_class_id := get_or_create_class('중고등부', '3반', v_current_year, v_teacher_id); 
             v_grade := 3; v_school_name := '서울중학교';
        ELSIF i <= 8 THEN 
             v_class_id := get_or_create_class('중고등부', '4반', v_current_year, v_teacher_id); 
             v_grade := 1; v_school_name := '서울고등학교';
        ELSIF i <= 10 THEN 
             v_class_id := get_or_create_class('중고등부', '5반', v_current_year, v_teacher_id); 
             v_grade := 2; v_school_name := '한빛고등학교';
        ELSE 
             v_class_id := get_or_create_class('중고등부', '6반', v_current_year, v_teacher_id); 
             v_grade := 3; v_school_name := '서울고등학교';
        END IF;

        v_gender := CASE WHEN i % 2 = 0 THEN 'male' ELSE 'female' END;
        v_student_name := v_last_names[(v_name_idx % 20) + 1] || CASE WHEN v_gender='male' THEN v_male_names[(v_name_idx % 25) + 1] ELSE v_female_names[(v_name_idx % 25) + 1] END;
        v_birthday := make_date(v_current_year - (14 + ((i-1)/2)), (v_name_idx % 12) + 1, (v_name_idx % 28) + 1);
        v_parent_contact := '010-' || lpad((4000 + v_name_idx * 11)::text, 4, '0') || '-' || lpad((4000 + v_name_idx * 22)::text, 4, '0');
        v_address := v_addresses[(v_name_idx % 10) + 1];

        INSERT INTO students (name, birthday, gender, school_name, grade, parent_contact, address, class_id, is_active)
        VALUES (v_student_name, v_birthday, v_gender, v_school_name, v_grade, v_parent_contact, v_address, v_class_id, true)
        RETURNING id INTO v_student_id;
        
        IF i = 11 THEN 
            INSERT INTO visitation_logs (student_id, teacher_id, visit_date, type, content) VALUES (v_student_id, v_teacher_id, CURRENT_DATE - 3, 'kakao', '입시 기도 요청');
        END IF;
    END LOOP;

    -- ============================================================
    -- 대학부: 10명, 1반~3반
    -- ============================================================
    FOR i IN 1..10 LOOP
        v_name_idx := v_name_idx + 1;
        
        IF i <= 4 THEN v_class_id := get_or_create_class('대학부', '1반', v_current_year, v_teacher_id);
        ELSIF i <= 8 THEN v_class_id := get_or_create_class('대학부', '2반', v_current_year, v_teacher_id);
        ELSE v_class_id := get_or_create_class('대학부', '3반', v_current_year, v_teacher_id);
        END IF;

        v_gender := CASE WHEN i % 2 = 0 THEN 'male' ELSE 'female' END;
        v_student_name := v_last_names[(v_name_idx % 20) + 1] || CASE WHEN v_gender='male' THEN v_male_names[(v_name_idx % 25) + 1] ELSE v_female_names[(v_name_idx % 25) + 1] END;
        v_birthday := make_date(v_current_year - (19 + (i % 5)), (v_name_idx % 12) + 1, (v_name_idx % 28) + 1);
        v_grade := (i % 4) + 1;
        v_school_name := CASE WHEN i % 2 = 0 THEN '서울대학교' ELSE '연세대학교' END;
        v_parent_contact := '010-' || lpad((5000 + v_name_idx * 11)::text, 4, '0') || '-' || lpad((5000 + v_name_idx * 22)::text, 4, '0');
        v_address := v_addresses[(v_name_idx % 10) + 1];

        INSERT INTO students (name, birthday, gender, school_name, grade, parent_contact, address, class_id, is_active)
        VALUES (v_student_name, v_birthday, v_gender, v_school_name, v_grade, v_parent_contact, v_address, v_class_id, true);
    END LOOP;

    -- ============================================================
    -- 청년부: 20명, 1반~3반
    -- ============================================================
    FOR i IN 1..20 LOOP
        v_name_idx := v_name_idx + 1;
        
        IF i <= 7 THEN v_class_id := get_or_create_class('청년부', '1반', v_current_year, v_teacher_id);
        ELSIF i <= 14 THEN v_class_id := get_or_create_class('청년부', '2반', v_current_year, v_teacher_id);
        ELSE v_class_id := get_or_create_class('청년부', '3반', v_current_year, v_teacher_id);
        END IF;

        v_gender := CASE WHEN i % 3 = 0 THEN 'male' ELSE 'female' END;
        v_student_name := v_last_names[(v_name_idx % 20) + 1] || CASE WHEN v_gender='male' THEN v_male_names[(v_name_idx % 25) + 1] ELSE v_female_names[(v_name_idx % 25) + 1] END;
        v_birthday := make_date(v_current_year - (24 + (i % 6)), (v_name_idx % 12) + 1, (v_name_idx % 28) + 1);
        v_grade := 0;
        v_parent_contact := '010-' || lpad((6000 + v_name_idx * 11)::text, 4, '0') || '-' || lpad((6000 + v_name_idx * 22)::text, 4, '0');
        v_address := v_addresses[(v_name_idx % 10) + 1];

        INSERT INTO students (name, birthday, gender, grade, parent_contact, address, class_id, is_active)
        VALUES (v_student_name, v_birthday, v_gender, v_grade, v_parent_contact, v_address, v_class_id, true)
        RETURNING id INTO v_student_id;
        
        IF i = 20 THEN 
            INSERT INTO student_notes (student_id, teacher_id, note_date, content) VALUES (v_student_id, v_teacher_id, CURRENT_DATE, '장기 결석 예정');
        END IF;
    END LOOP;

    RAISE NOTICE 'Generation Completed. Total students: % (Expected 79)', v_name_idx;

END $$;
