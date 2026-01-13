# GitHub 계정 변경 가이드

> remge21c 계정으로 GitHub 저장소 사용하기

---

## 현재 상황

- Git이 `remge21c` 계정으로 인증되어 있음
- 저장소는 `airemge-ux/SundaySchool`에 생성됨
- 인증 문제로 푸시 불가

---

## 해결 방법: remge21c 계정으로 새 저장소 생성

### 옵션 1: remge21c 계정으로 새 저장소 생성 (권장)

1. **GitHub에서 새 저장소 생성**
   - [GitHub 새 저장소 생성](https://github.com/new) 접속
   - `remge21c` 계정으로 로그인 (아직 로그인 안 했다면)
   - Repository name: `SundaySchool` (또는 원하는 이름)
   - Public 또는 Private 선택
   - "Initialize this repository with" 모든 옵션 체크 해제
   - **Create repository** 클릭

2. **Remote URL 변경**
   ```bash
   git remote set-url origin https://github.com/remge21c/SundaySchool.git
   ```

3. **푸시**
   ```bash
   git push -u origin main
   ```

### 옵션 2: airemge-ux 저장소 유지하고 인증 해결

- Windows 자격 증명 관리자에서 인증 정보 변경
- 또는 GitHub Desktop 사용
- 또는 Personal Access Token 사용

---

## 장점: remge21c 계정 사용

- ✅ 현재 Git 인증 상태와 일치
- ✅ 추가 인증 설정 불필요
- ✅ 즉시 푸시 가능
- ✅ Vercel도 같은 계정으로 연동 가능

---

## Vercel도 remge21c 계정 사용

- GitHub와 Vercel은 같은 계정(GitHub 계정)으로 연동
- `remge21c` GitHub 계정으로 Vercel 로그인
- GitHub 저장소 자동 인식 및 배포

---

## 다음 단계

1. `remge21c` 계정으로 GitHub 저장소 생성
2. Remote URL 변경
3. 코드 푸시
4. Vercel 배포 시에도 `remge21c` GitHub 계정 사용
