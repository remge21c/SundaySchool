-- 회원가입 시 자동으로 profiles 테이블에 레코드 생성하는 트리거
-- auth.users에 새 사용자가 생성되면 profiles 테이블에 자동으로 레코드 생성

-- 함수: 새 사용자 프로필 자동 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    'teacher', -- 기본 역할은 teacher
    NULL -- full_name은 회원가입 시 입력받음
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거: auth.users에 새 사용자 생성 시 실행
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
