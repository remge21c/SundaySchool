# 배포 체크리스트

> 프로덕션 배포 전 확인 사항

---

## 배포 전 확인 사항

### 코드 준비

- [x] 모든 MVP 기능 구현 완료
- [x] 타입 에러 없음 (`npm run type-check` 통과)
- [x] 빌드 성공 (`npm run build` 성공)
- [x] 테스트 통과 (`npm run test` 통과, 선택사항)
- [x] 환경 변수 템플릿 생성 (`.env.example`)

### 문서 준비

- [x] 배포 가이드 작성
- [x] 데이터 마이그레이션 가이드 작성
- [x] 관리자 매뉴얼 작성
- [x] 교사용 사용 가이드 작성

### Supabase 준비 (현재 프로젝트 사용)

- [x] Supabase 프로젝트 생성 (이미 완료 - 개발 중 사용 중)
- [x] 데이터베이스 스키마 적용 (이미 완료)
- [x] RLS 정책 확인 (이미 완료)
- [ ] 환경 변수 확인 (Vercel 배포용)
  - [ ] Supabase 대시보드 → Settings → API에서 확인
  - [ ] Project URL
  - [ ] anon public key
  - [ ] service_role key (선택)

### GitHub 준비 (Vercel 배포 시)

- [ ] 코드가 GitHub 저장소에 푸시됨
- [ ] `.env.local` 파일은 `.gitignore`에 포함되어 커밋되지 않음
- [ ] `.env.example` 파일이 커밋됨

### Vercel 배포

- [ ] Vercel 계정 생성 및 GitHub 연동
- [ ] 새 프로젝트 생성
- [ ] GitHub 저장소 연결
- [ ] 환경 변수 설정:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (선택)
- [ ] 배포 실행
- [ ] 배포 성공 확인

### 배포 후 확인

- [ ] 홈 페이지 접속 가능
- [ ] 로그인 페이지 접속 가능
- [ ] 관리자 계정 생성
- [ ] 로그인 기능 작동
- [ ] 대시보드 접속 가능
- [ ] 출석 체크 페이지 접속 가능
- [ ] 데이터베이스 연결 확인

### 데이터 준비

- [ ] 관리자 계정 생성
- [ ] 교사 계정 생성 (파일럿 사용자)
- [ ] 반 데이터 입력
- [ ] 학생 데이터 입력 (파일럿 부서만)

### 파일럿 준비

- [ ] 파일럿 사용자에게 계정 정보 전달
- [ ] 사용 가이드 전달
- [ ] 피드백 수집 방법 준비

---

## 배포 순서

1. **프로덕션 Supabase 프로젝트 생성**
   - [배포 가이드 - 프로덕션 Supabase 설정](./deployment-guide.md#프로덕션-supabase-설정) 참조

2. **GitHub에 코드 푸시** (아직 안 했다면)
   ```bash
   git add .
   git commit -m "docs: 배포 및 파일럿 준비 문서 추가"
   git push origin main
   ```

3. **Vercel 배포**
   - [배포 가이드 - Vercel 배포](./deployment-guide.md#vercel-배포) 참조

4. **배포 후 확인**
   - [배포 가이드 - 배포 후 확인 사항](./deployment-guide.md#배포-후-확인-사항) 참조

5. **데이터 입력**
   - [데이터 마이그레이션 가이드](./data-migration-guide.md) 참조

6. **파일럿 시작**
   - 교사 계정 생성
   - 사용 가이드 전달
   - 피드백 수집 시작

---

## 문제 발생 시

배포 중 문제가 발생하면:
1. [배포 가이드 - 문제 해결](./deployment-guide.md#문제-해결) 참조
2. 에러 메시지 확인 (Vercel 빌드 로그, 브라우저 콘솔)
3. 환경 변수 확인
4. Supabase 프로젝트 상태 확인
