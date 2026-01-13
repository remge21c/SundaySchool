# Vercel 재배포 가이드

> 이전 커밋이 빌드되는 문제 해결

---

## 문제

Vercel이 이전 커밋(`b265c92`)을 빌드하고 있어 최신 수정사항(`fb76e67`)이 반영되지 않습니다.

---

## 해결 방법

### 방법 1: 수동 재배포 (권장)

1. **Vercel 대시보드**에서 프로젝트 선택
2. **Deployments** 탭으로 이동
3. 실패한 배포 옆 **⋯** (점 3개) 메뉴 클릭
4. **Redeploy** 선택
5. **Use existing Build Cache** 체크 해제 (중요!)
6. **Redeploy** 버튼 클릭

### 방법 2: 최신 커밋으로 재배포

1. **Deployments** 탭에서
2. 상단의 **"..."** 메뉴 클릭
3. **Redeploy** 선택
4. **Use existing Build Cache** 체크 해제
5. **Redeploy** 클릭

### 방법 3: 빌드 캐시 삭제 후 재배포

1. **Settings** → **Build & Development Settings**
2. **Clear Build Cache** 버튼 클릭
3. **Deployments** 탭으로 돌아가기
4. 최신 배포 **Redeploy**

### 방법 4: GitHub에서 재트리거

1. GitHub 저장소로 이동
2. **Actions** 탭 (또는 Vercel이 자동 배포를 감지하도록)
3. 또는 빈 커밋 푸시:
   ```bash
   git commit --allow-empty -m "trigger: Vercel 재배포"
   git push origin main
   ```

---

## 확인 사항

재배포 후 다음을 확인하세요:

1. **커밋 해시**: `fb76e67` (최신)
2. **빌드 로그**: 
   - `npm install --legacy-peer-deps` 명령어가 실행되는지 확인
   - `@testing-library/react@16.0.0`이 설치되는지 확인
3. **빌드 상태**: `Ready` 또는 `Building`

---

## 예상 빌드 로그 (성공 시)

```
Installing dependencies...
npm install --legacy-peer-deps
...
added 634 packages
Building...
```

---

## 문제가 계속되면

1. **Vercel 프로젝트 설정 확인**:
   - Settings → Git
   - 연결된 저장소가 올바른지 확인
   - 브랜치가 `main`인지 확인

2. **로컬에서 테스트**:
   ```bash
   npm install --legacy-peer-deps
   npm run build
   ```
   - 로컬에서 성공하면 Vercel에서도 성공해야 합니다

3. **Vercel 지원팀 문의**:
   - 빌드 로그 전체 복사
   - 프로젝트 설정 스크린샷
   - 문제 설명

---

## 다음 단계

빌드가 성공하면:
1. 배포 URL 확인
2. 사이트 접속 테스트
3. 로그인 및 기능 테스트
