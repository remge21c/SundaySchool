# 배포 성공 확인 체크리스트

> Vercel 배포 완료 후 확인 사항

---

## 빌드 성공 확인

### 빌드 로그에서 확인할 사항

✅ **성공적인 빌드 로그:**
```
✓ Compiled successfully
Collecting page data ...
Generating static pages (0/9) ...
Generating static pages (9/9)
Finalizing page optimization ...
```

✅ **경고 메시지 (정상):**
- `npm warn deprecated` - 기능에 영향 없음
- `Unexpected any` - 타입 경고 (기능 정상 작동)

❌ **오류 메시지 (문제):**
- `Error: Missing Supabase environment variables` - 환경 변수 미설정
- `Error occurred prerendering page` - 빌드 실패
- `Command "npm install" exited with 1` - 의존성 설치 실패

---

## 배포 완료 확인

### Vercel 대시보드에서 확인

1. **배포 상태**: `Ready` (초록색)
2. **커밋 해시**: 최신 커밋 확인
3. **배포 URL**: 생성된 URL 확인
   - 예: `https://sunday-school-xxxxx.vercel.app`
   - 또는: `https://sunday-school-git-main-remges-projects.vercel.app`

---

## 사이트 접속 테스트

### 1. 홈 페이지 확인

1. 배포 URL로 접속
2. 페이지가 정상적으로 로드되는지 확인
3. 에러 메시지가 없는지 확인

### 2. 로그인 페이지 확인

1. `/login` 경로로 접속
2. 로그인 폼이 표시되는지 확인
3. 브라우저 콘솔(F12)에서 에러가 없는지 확인

### 3. 로그인 테스트

1. 관리자 계정으로 로그인 시도
2. 로그인이 성공하는지 확인
3. 대시보드로 리다이렉트되는지 확인

---

## 기능 테스트

### 기본 기능 확인

- [ ] 로그인 기능 작동
- [ ] 대시보드 접속 가능
- [ ] 출석 체크 페이지 접속 가능
- [ ] 학생 프로필 페이지 접속 가능 (학생 데이터가 있다면)
- [ ] 장기 결석 알림 표시 (데이터가 있다면)

### 브라우저 콘솔 확인

1. 브라우저 개발자 도구 열기 (F12)
2. **Console** 탭 확인
3. 에러 메시지가 없는지 확인

**일반적인 에러:**
- `Failed to fetch` - Supabase 연결 문제
- `Missing Supabase environment variables` - 환경 변수 미설정
- `404 Not Found` - 라우팅 문제

---

## 문제 해결

### 사이트가 로드되지 않을 때

1. **배포 상태 확인**:
   - Vercel 대시보드에서 배포가 `Ready` 상태인지 확인
   - 빌드가 실패했다면 빌드 로그 확인

2. **브라우저 캐시 삭제**:
   - `Ctrl + Shift + R` (강력 새로고침)
   - 또는 시크릿 모드에서 접속

3. **URL 확인**:
   - 올바른 배포 URL을 사용하고 있는지 확인

### 로그인이 안 될 때

1. **Supabase 연결 확인**:
   - 브라우저 콘솔에서 에러 확인
   - 환경 변수가 올바르게 설정되었는지 확인

2. **계정 확인**:
   - Supabase 대시보드 → Authentication → Users
   - 관리자 계정이 존재하는지 확인

3. **프로필 확인**:
   - Supabase 대시보드 → Table Editor → profiles
   - 사용자 프로필이 있는지 확인

---

## 다음 단계

배포가 성공하고 사이트가 정상 작동하면:

1. **[데이터 마이그레이션 가이드](./data-migration-guide.md)** - 실제 데이터 입력
2. **[관리자 매뉴얼](./admin-manual.md)** - 시스템 운영
3. **[교사용 사용 가이드](./user-guide.md)** - 파일럿 사용자에게 전달

---

## 축하합니다! 🎉

배포가 성공했다면 MVP가 프로덕션 환경에서 실행 중입니다!

다음 단계로 파일럿 테스트를 진행할 수 있습니다.
