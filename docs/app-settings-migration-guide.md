# app_settings 테이블 생성 가이드

> 교적부 이름 설정 기능을 사용하기 위한 마이그레이션 적용 가이드

**작성일**: 2026-01-13

---

## 1. 문제 원인

`app_settings` 테이블에 대한 요청이 404 에러를 반환하는 것은 Supabase에서 해당 테이블이 아직 생성되지 않았기 때문입니다.

현재 시스템은 관리자 페이지에서 교적부 이름을 설정하고, 상단 Navbar에 동적으로 표시하는 기능을 제공합니다. 이 기능을 사용하려면 `app_settings` 테이블이 필요합니다.

---

## 2. 해결 방법 (Supabase 대시보드에서 직접 실행)

가장 확실한 방법은 Supabase 대시보드의 SQL Editor에서 직접 마이그레이션을 적용하는 것입니다.

### 2.1 SQL Editor 접속

1. [Supabase 대시보드](https://app.supabase.com)에 접속합니다.
2. 해당 프로젝트를 선택합니다.
3. 좌측 메뉴에서 **SQL Editor**를 클릭합니다.
4. **New query** 버튼을 클릭하여 새 쿼리 창을 엽니다.

### 2.2 마이그레이션 실행

다음 SQL 코드를 복사하여 SQL Editor에 붙여넣고 실행합니다.

```sql
-- app_settings 테이블 생성
-- 애플리케이션 설정을 저장하는 테이블 (단일 행)

CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_name TEXT NOT NULL DEFAULT '주일학교 교적부',
  description TEXT,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = '00000000-0000-0000-0000-000000000000'::uuid)
);

-- 단일 행 삽입 (초기값)
INSERT INTO app_settings (id, app_name, description)
VALUES ('00000000-0000-0000-0000-000000000000'::uuid, '주일학교 교적부', '행정은 간소하게, 사역은 깊이 있게')
ON CONFLICT (id) DO NOTHING;

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_app_settings_updated_at ON app_settings;
CREATE TRIGGER trigger_update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_app_settings_updated_at();

-- RLS 활성화
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모든 인증된 사용자는 조회 가능
DROP POLICY IF EXISTS "Authenticated users can view app settings" ON app_settings;
CREATE POLICY "Authenticated users can view app settings"
ON app_settings FOR SELECT
TO authenticated
USING (true);

-- RLS 정책: 관리자만 수정 가능
DROP POLICY IF EXISTS "Admins can update app settings" ON app_settings;
CREATE POLICY "Admins can update app settings"
ON app_settings FOR UPDATE
TO authenticated
USING (public.user_role() = 'admin')
WITH CHECK (public.user_role() = 'admin');
```

### 2.3 실행 확인

SQL 실행 후, 다음 쿼리를 실행하여 테이블이 성공적으로 생성되었는지 확인합니다.

```sql
-- 테이블 확인
SELECT * FROM app_settings;
```

**예상 결과**:
- 1개 행이 반환되어야 합니다.
- `id`가 `00000000-0000-0000-0000-000000000000`이고
- `app_name`이 `주일학교 교적부`이며
- `description`이 `행정은 간소하게, 사역은 깊이 있게`입니다.

### 2.4 정책 확인

RLS 정책이 올바르게 생성되었는지 확인합니다.

```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'app_settings';
```

**예상 결과**:
- 2개의 정책이 표시되어야 합니다:
  1. `Authenticated users can view app settings` (SELECT)
  2. `Admins can update app settings` (UPDATE)

---

## 3. 기능 확인

마이그레이션 실행 후:

1. **웹 애플리케이션 새로고침**
   - 브라우저 캐시를 지우거나 시크릿 모드에서 접속

2. **관리자 페이지 접속**
   - URL: `https://sunday-school-eta.vercel.app/admin`
   - 관리자 계정으로 로그인

3. **교적부 이름 설정 확인**
   - 관리자 페이지 상단에 "교적부 이름 설정" 카드가 표시되어야 합니다.
   - 이름을 입력하고 저장하면 상단 Navbar에 즉시 반영됩니다.

4. **Navbar 확인**
   - 상단 Navbar의 제목이 설정한 이름으로 변경됩니다.
   - 기본값은 "주일학교 교적부"입니다.

---

## 4. 문제 해결 팁

### 테이블이 이미 존재하는 경우

테이블이 이미 존재하지만 데이터가 없는 경우:
```sql
-- 기존 데이터 확인
SELECT * FROM app_settings;

-- 데이터가 없으면 초기값 삽입
INSERT INTO app_settings (id, app_name, description)
VALUES ('00000000-0000-0000-0000-000000000000'::uuid, '주일학교 교적부', '행정은 간소하게, 사역은 깊이 있게')
ON CONFLICT (id) DO NOTHING;
```

### RLS 정책 오류

RLS 정책이 올바르게 작동하지 않는 경우:
- `public.user_role()` 함수가 존재하는지 확인합니다.
- 이 함수는 `supabase/migrations/007_fix_profiles_rls_policy.sql`에 정의되어 있습니다.

### 캐시 문제

브라우저에서 여전히 404 에러가 발생하는 경우:
- 브라우저 캐시를 지우거나 시크릿 모드에서 다시 시도
- 개발자 도구 (F12) → Network 탭에서 요청 확인

---

## 5. 참고

- **마이그레이션 파일**: `supabase/migrations/013_create_app_settings_table.sql`
- **관련 API**: `lib/supabase/settings.ts`
- **관련 컴포넌트**: 
  - `components/admin/AppNameSettings.tsx`
  - `components/layout/Navbar.tsx`

이 단계를 완료하면 교적부 이름 설정 기능이 정상적으로 작동할 것입니다.
