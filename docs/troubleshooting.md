# 문제 해결 가이드

## 인증 에러 해결

### Supabase 인증 400 에러

**증상**: 브라우저 콘솔에 `auth/v1/token?grant_type=password: 400` 에러 발생

**원인**:
1. 사용자가 Supabase에 존재하지 않음
2. 잘못된 이메일/비밀번호
3. 이메일 인증이 완료되지 않음
4. Supabase 프로젝트 설정 문제

**해결 방법**:

#### 1. 사용자 생성 확인
1. [Supabase 대시보드](https://app.supabase.com) 접속
2. **Authentication** → **Users** 확인
3. 사용자가 없으면 생성:
   - **Add user** 클릭
   - 이메일/비밀번호 입력
   - **Auto Confirm User** 체크 (이메일 인증 생략)

#### 2. 프로필 생성 확인
1. **Table Editor** → **profiles** 확인
2. 사용자 UUID와 일치하는 프로필이 있는지 확인
3. 없으면 생성:
   - **Insert row** 클릭
   - `id`: 사용자 UUID (Authentication → Users에서 복사)
   - `email`: 동일한 이메일
   - `role`: `admin` 또는 `teacher`

#### 3. 환경 변수 확인
`.env.local` 파일 확인:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

#### 4. Supabase 연결 테스트
```bash
npm run check:supabase
```

#### 5. 이메일 인증 설정 확인
Supabase 대시보드에서:
- **Authentication** → **Settings** → **Email Auth**
- **Enable email confirmations** 설정 확인
- 개발 환경에서는 비활성화하거나 **Auto Confirm User** 사용 권장

---

## Favicon 404 에러

**증상**: 브라우저 콘솔에 `favicon.ico: 404` 에러 발생

**원인**: Next.js 앱에 favicon 파일이 없음

**해결 방법**:
1. `app` 디렉토리에 `favicon.ico` 파일 추가
2. 또는 `app/layout.tsx`에서 metadata에 icons 설정 (이미 적용됨)

**참고**: 이 에러는 기능에 영향을 주지 않으며, 브라우저가 자동으로 favicon을 요청할 때 발생하는 경고입니다.

---

## 일반적인 문제

### 로그인이 안 되는 경우
1. 사용자가 Supabase에 생성되었는지 확인
2. `profiles` 테이블에 레코드가 있는지 확인
3. 환경 변수가 올바른지 확인
4. 브라우저 콘솔에서 정확한 에러 메시지 확인

### 권한 문제
- `profiles` 테이블의 `role` 필드가 올바르게 설정되었는지 확인
- RLS 정책이 올바르게 설정되었는지 확인 (`supabase/migrations/001_initial_schema.sql`)
