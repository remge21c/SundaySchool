# Vercel 빌드 오류 해결 가이드

> React 19와 @testing-library/react 의존성 충돌 해결

---

## 문제

Vercel 빌드 시 다음 오류 발생:
```
npm error ERESOLVE could not resolve
npm error peer react@"^18.0.0" from @testing-library/react@14.3.1
```

**원인**: React 19를 사용하지만 `@testing-library/react@14.x`는 React 18만 지원

---

## 해결 방법

### 이미 적용된 수정 사항

1. ✅ `package.json`: `@testing-library/react`를 `^16.0.0`으로 업데이트
2. ✅ `.npmrc`: `legacy-peer-deps=true` 추가
3. ✅ `vercel.json`: `--legacy-peer-deps` 플래그 명시

### Vercel에서 확인할 사항

#### 1. 최신 커밋 빌드 확인

Vercel 대시보드에서:
- **Deployments** 탭 확인
- 최신 배포가 `fb76e67` 커밋을 빌드하는지 확인
- 이전 커밋(`b265c92`)을 빌드하고 있다면:
  - **Redeploy** 클릭
  - 또는 **Settings** → **Git** → **Redeploy** 클릭

#### 2. 빌드 캐시 삭제

1. Vercel 대시보드 → 프로젝트 선택
2. **Settings** → **Build & Development Settings**
3. **Clear Build Cache** 클릭
4. **Redeploy** 클릭

#### 3. 수동 재배포

1. Vercel 대시보드 → **Deployments**
2. 최신 배포 옆 **⋯** 메뉴 클릭
3. **Redeploy** 선택
4. **Use existing Build Cache** 체크 해제 (캐시 없이 빌드)

---

## 현재 설정 확인

### package.json
```json
{
  "devDependencies": {
    "@testing-library/react": "^16.0.0"
  }
}
```

### .npmrc
```
legacy-peer-deps=true
```

### vercel.json
```json
{
  "buildCommand": "npm install --legacy-peer-deps && npm run build",
  "installCommand": "npm install --legacy-peer-deps"
}
```

---

## 빌드 로그 확인

성공적인 빌드 로그에는 다음이 표시됩니다:
```
Installing dependencies...
npm install --legacy-peer-deps
...
added 634 packages
```

실패한 빌드 로그에는:
```
npm error ERESOLVE could not resolve
```

---

## 추가 해결 방법

### 방법 1: @testing-library/react 제거 (테스트 비활성화)

프로덕션 빌드에 테스트 라이브러리가 필요하지 않다면:

```json
{
  "devDependencies": {
    // "@testing-library/react": "^16.0.0" // 주석 처리
  }
}
```

### 방법 2: package.json에 overrides 추가

```json
{
  "overrides": {
    "@testing-library/react": "^16.0.0"
  }
}
```

---

## 확인 체크리스트

- [ ] `vercel.json` 파일이 GitHub에 푸시됨
- [ ] `.npmrc` 파일이 GitHub에 푸시됨
- [ ] `package.json`의 `@testing-library/react`가 `^16.0.0`으로 업데이트됨
- [ ] Vercel 대시보드에서 최신 커밋(`fb76e67`) 빌드 확인
- [ ] 빌드 캐시 삭제 후 재배포

---

## 다음 단계

빌드가 성공하면:
1. 배포 URL 확인
2. 사이트 접속 테스트
3. 로그인 및 기능 테스트

빌드가 계속 실패하면:
1. Vercel 빌드 로그 전체 확인
2. 로컬에서 `npm install --legacy-peer-deps && npm run build` 테스트
3. Vercel 지원팀에 문의
