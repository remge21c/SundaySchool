# Supabase 환경 변수 확인 가이드

> Vercel 배포 전 현재 사용 중인 Supabase 프로젝트의 환경 변수를 확인하는 방법

---

## 확인할 환경 변수

Vercel 배포 시 다음 3개의 환경 변수가 필요합니다:

1. **NEXT_PUBLIC_SUPABASE_URL** - Supabase 프로젝트 URL
2. **NEXT_PUBLIC_SUPABASE_ANON_KEY** - 공개 키 (anon key)
3. **SUPABASE_SERVICE_ROLE_KEY** - 서비스 역할 키 (선택사항)

---

## 확인 방법

### 1. Supabase 대시보드 접속

1. 웹 브라우저에서 [Supabase 대시보드](https://app.supabase.com) 접속
2. 로그인 (이미 로그인되어 있다면 자동으로 대시보드로 이동)

### 2. 프로젝트 선택

- 개발 중 사용 중인 Supabase 프로젝트를 선택합니다
- 프로젝트 목록에서 프로젝트 이름을 클릭

### 3. API 설정 페이지로 이동

1. 좌측 사이드바에서 **Settings** (⚙️ 아이콘) 클릭
2. **API** 메뉴 클릭

### 4. 환경 변수 확인 및 복사

API 설정 페이지에서 다음 정보를 확인할 수 있습니다:

#### Project URL

- 위치: **Project URL** 섹션
- 형식: `https://xxxxxxxxxxxxx.supabase.co`
- 복사: 복사 버튼을 클릭하거나 텍스트를 직접 복사

#### API Keys

**anon public** 키:
- 위치: **Project API keys** 섹션 → **anon public** 행
- 설명: "This key is safe to use in a browser if you have enabled Row Level Security for your tables and configured policies."
- 형식: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (긴 JWT 토큰)
- 복사: 눈 아이콘을 클릭하여 표시한 후, 복사 버튼 클릭

**service_role** 키 (선택사항):
- 위치: **Project API keys** 섹션 → **service_role** 행
- 설명: "This key has the ability to bypass Row Level Security. Never share it publicly."
- ⚠️ **주의**: 이 키는 서버 사이드에서만 사용하고, 클라이언트 코드에 포함하지 마세요!
- 복사: 눈 아이콘을 클릭하여 표시한 후, 복사 버튼 클릭

---

## 메모 방법

환경 변수를 안전하게 메모해두세요:

### 방법 1: 텍스트 파일 (로컬에만 저장)

임시로 텍스트 파일을 만들어 메모:

```
Supabase 환경 변수 (Vercel 배포용):
- URL: https://xxxxxxxxxxxxx.supabase.co
- ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **보안 주의**: 이 파일은 Vercel 배포 후 삭제하세요!

### 방법 2: 비밀번호 관리자 사용

1Password, LastPass 등 비밀번호 관리자에 저장

### 방법 3: 직접 Vercel에 입력

복사한 값을 바로 Vercel 대시보드에 입력 (가장 권장)

---

## 확인 체크리스트

- [ ] Supabase 대시보드 접속
- [ ] 올바른 프로젝트 선택
- [ ] Settings → API 페이지 이동
- [ ] Project URL 복사 및 메모
- [ ] anon public key 복사 및 메모
- [ ] service_role key 복사 및 메모 (선택사항)

---

## 다음 단계

환경 변수를 확인했으면:

1. **[배포 체크리스트](./deployment-checklist.md)** - 다음 단계 확인
2. **[간단 배포 가이드](./deployment-guide-simple.md)** - Vercel 배포 진행
3. GitHub 저장소 준비 (코드 푸시)

---

## 문제 해결

### 프로젝트를 찾을 수 없을 때

- Supabase 대시보드에서 모든 프로젝트 목록 확인
- 프로젝트 이름을 기억하지 못하면: Settings → General에서 프로젝트 이름 확인

### 키가 보이지 않을 때

- **service_role** 키: "Reveal" 또는 눈 아이콘을 클릭하여 표시
- 키가 비활성화되어 있으면: Supabase 무료 플랜에서도 사용 가능

### 키를 잘못 복사했을 때

- 문제 없습니다. Vercel에서 언제든지 수정 가능합니다
- 프로젝트 설정 → Environment Variables에서 수정

---

## 참고

- Supabase 문서: [API Keys](https://supabase.com/docs/guides/api/api-keys)
- [배포 가이드 - 환경 변수 설정](./deployment-guide.md#4-환경-변수-설정)
