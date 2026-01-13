# Vercel 환경 변수 설정 가이드

> 빌드 오류 "Missing Supabase environment variables" 해결

---

## 문제

빌드 로그에 다음 오류가 표시됩니다:
```
Error: Missing Supabase environment variables
```

**원인**: Vercel 프로젝트에 Supabase 환경 변수가 설정되지 않음

---

## 해결 방법

### 1단계: Supabase 환경 변수 확인

먼저 Supabase 대시보드에서 환경 변수를 확인합니다:

1. [Supabase 대시보드](https://app.supabase.com) 접속
2. 프로젝트 선택 (SundaySchool)
3. **Settings** → **API** 메뉴
4. 다음 값들을 복사:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** 키: `eyJhbGc...` (긴 JWT 토큰)
   - **service_role** 키: `eyJhbGc...` (선택사항)

**상세 가이드**: [Supabase 환경 변수 확인](./supabase-env-check.md)

---

### 2단계: Vercel에서 환경 변수 설정

1. **Vercel 대시보드** 접속: https://vercel.com/dashboard
2. **SundaySchool** 프로젝트 선택
3. **Settings** 탭 클릭
4. 좌측 메뉴에서 **Environment Variables** 클릭

---

### 3단계: 환경 변수 추가

다음 3개의 환경 변수를 하나씩 추가합니다:

#### 환경 변수 1: NEXT_PUBLIC_SUPABASE_URL

1. **Key** 입력: `NEXT_PUBLIC_SUPABASE_URL`
2. **Value** 입력: Supabase Project URL (예: `https://xxxxx.supabase.co`)
3. **Environment** 선택:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
   (모두 선택)
4. **Add** 버튼 클릭

#### 환경 변수 2: NEXT_PUBLIC_SUPABASE_ANON_KEY

1. **Key** 입력: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. **Value** 입력: Supabase anon public key (예: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
3. **Environment** 선택: 모두 선택 (Production, Preview, Development)
4. **Add** 버튼 클릭

#### 환경 변수 3: SUPABASE_SERVICE_ROLE_KEY (선택사항)

1. **Key** 입력: `SUPABASE_SERVICE_ROLE_KEY`
2. **Value** 입력: Supabase service_role key
3. **Environment** 선택: 모두 선택
4. **Add** 버튼 클릭

---

### 4단계: 환경 변수 확인

추가한 환경 변수 목록에서 다음을 확인:
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - 값이 올바른지 확인
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - 값이 올바른지 확인
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (선택) - 값이 올바른지 확인

---

### 5단계: 재배포

환경 변수를 추가한 후:

1. **Deployments** 탭으로 이동
2. 최신 배포 옆 **⋯** 메뉴 클릭
3. **Redeploy** 선택
4. **Use existing Build Cache** 체크 해제 (선택사항)
5. **Redeploy** 버튼 클릭

또는:

1. **Settings** → **Git**
2. **Redeploy** 버튼 클릭

---

## 확인 사항

재배포 후 빌드 로그에서 다음을 확인:

### 성공적인 빌드 로그:
```
✓ Compiled successfully
Collecting page data ...
Generating static pages (0/9) ...
Generating static pages (9/9)
Finalizing page optimization ...
```

### 실패한 빌드 로그:
```
Error: Missing Supabase environment variables
```

---

## 문제 해결

### 환경 변수가 저장되지 않을 때

- **Value** 필드에 따옴표(`"`)를 포함하지 마세요
- URL과 키를 정확히 복사했는지 확인
- **Save** 또는 **Add** 버튼을 클릭했는지 확인

### 재배포 후에도 오류가 발생할 때

1. **환경 변수 확인**:
   - Settings → Environment Variables
   - 모든 환경 변수가 올바르게 설정되었는지 확인

2. **빌드 캐시 삭제**:
   - Settings → Build & Development Settings
   - **Clear Build Cache** 클릭
   - 재배포

3. **로컬에서 테스트**:
   ```bash
   # .env.local 파일 확인
   cat .env.local
   
   # 로컬 빌드 테스트
   npm run build
   ```

---

## 다음 단계

빌드가 성공하면:
1. 배포 URL 확인
2. 사이트 접속 테스트
3. 로그인 및 기능 테스트

---

## 참고

- [간단 배포 가이드 - 환경 변수 설정](./deployment-guide-simple.md#3-환경-변수-설정-중요)
- [Supabase 환경 변수 확인 가이드](./supabase-env-check.md)
