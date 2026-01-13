# 관리자 계정 생성 가이드

## 방법 1: Supabase 대시보드에서 생성 (권장)

### 1단계: Supabase 대시보드 접속
1. [Supabase 대시보드](https://app.supabase.com) 접속
2. 프로젝트 선택

### 2단계: 사용자 생성
1. 좌측 메뉴: **Authentication** → **Users**
2. **Add user** 버튼 클릭
3. **Create new user** 선택
4. 다음 정보 입력:
   - **Email**: `admin@example.com` (원하는 이메일 주소)
   - **Password**: `admin123456` (강력한 비밀번호로 변경 권장)
   - **Auto Confirm User**: ✅ 체크 (이메일 인증 생략)
5. **Create user** 클릭

### 3단계: 프로필 생성 (profiles 테이블)
1. 좌측 메뉴: **Table Editor** → **profiles**
2. **Insert** → **Insert row** 클릭
3. 다음 정보 입력:
   - **id**: 위에서 생성한 사용자의 UUID 복사 (Authentication → Users에서 확인)
   - **email**: `admin@example.com`
   - **role**: `admin` (드롭다운에서 선택)
   - **full_name**: `관리자` (선택)
4. **Save** 클릭

### 4단계: 로그인 테스트
1. 웹 애플리케이션에서 `/login` 페이지로 이동
2. 생성한 이메일과 비밀번호로 로그인
3. 정상적으로 로그인되면 성공!

---

## 방법 2: SQL로 직접 생성 (고급)

Supabase 대시보드의 **SQL Editor**에서 다음 SQL을 실행:

```sql
-- 1. 사용자 생성 (Supabase Auth)
-- 이 작업은 Supabase 대시보드의 Authentication → Users에서 GUI로 하는 것이 더 안전합니다.

-- 2. 프로필 생성 (사용자 생성 후 UUID를 복사하여 사용)
INSERT INTO profiles (id, email, role, full_name)
VALUES (
  'YOUR_USER_UUID_HERE',  -- Authentication → Users에서 UUID 복사
  'admin@example.com',
  'admin',
  '관리자'
);
```

---

## 방법 3: 초기 사용자 생성 스크립트 (개발용)

프로젝트 루트에서 실행:

```bash
npm run create-admin
```

> **참고**: 현재 이 스크립트는 구현되지 않았습니다. 필요하시면 추가해드릴 수 있습니다.

---

## 기본 관리자 계정 (개발용)

⚠️ **주의**: 다음 계정은 개발/테스트용입니다. 프로덕션 환경에서는 반드시 변경하세요!

- **이메일**: `admin@example.com`
- **비밀번호**: `admin123456` (변경 권장)

---

## 문제 해결

### 로그인이 안 되는 경우
1. Supabase 프로젝트가 올바르게 설정되었는지 확인
2. `.env.local` 파일의 환경 변수가 올바른지 확인
3. `npm run check:supabase` 실행하여 연결 테스트

### 프로필이 없는 경우
- 사용자는 생성되었지만 `profiles` 테이블에 레코드가 없으면 로그인할 수 없습니다.
- 위의 3단계를 완료했는지 확인하세요.

### 권한 문제
- `profiles` 테이블의 `role` 필드가 `admin`으로 설정되었는지 확인하세요.
