# GitHub 푸시 수동 가이드

> 인증 문제 해결 후 GitHub에 푸시하는 방법

---

## 문제

Git이 `remge21c` 계정으로 인증되어 있어 `airemge-ux` 저장소에 접근할 수 없습니다.

---

## 해결 방법

### 방법 1: Windows 자격 증명 관리자 사용 (권장)

1. **Windows 자격 증명 관리자 열기:**
   - `Win + R` 키 누르기
   - `control /name Microsoft.CredentialManager` 입력
   - Enter 키

2. **Windows 자격 증명 탭 선택**

3. **GitHub 자격 증명 찾기:**
   - `git:https://github.com` 또는 `github.com` 관련 항목 찾기
   - `remge21c` 관련 항목 찾기

4. **기존 자격 증명 삭제:**
   - 항목 클릭
   - **제거** 또는 **편집** 클릭
   - 삭제 확인

5. **터미널에서 다시 푸시:**
   ```bash
   git push -u origin main
   ```

6. **인증 정보 입력:**
   - **Username**: `airemge-ux`
   - **Password**: Personal Access Token (비밀번호 아님!)

---

### 방법 2: Git Credential Manager로 자격 증명 삭제

터미널에서:

```powershell
# Git Credential Manager로 자격 증명 삭제
git credential-manager-core erase
host=github.com
protocol=https

# (Ctrl+Z 또는 빈 줄 입력 후 Enter)

# 또는 전체 삭제 (더 강력)
git credential reject https://github.com
```

그 다음 다시 푸시:

```bash
git push -u origin main
```

---

### 방법 3: Personal Access Token 직접 사용

Remote URL에 토큰을 포함:

```bash
# Personal Access Token 생성 (https://github.com/settings/tokens)
# 토큰 복사 (예: ghp_xxxxxxxxxxxxx)

# Remote URL에 토큰 포함 (임시)
git remote set-url origin https://airemge-ux:YOUR_TOKEN@github.com/airemge-ux/SundaySchool.git

# 푸시
git push -u origin main

# 보안을 위해 원래대로 변경 (선택)
git remote set-url origin https://github.com/airemge-ux/SundaySchool.git
```

⚠️ **주의**: 토큰을 코드에 커밋하지 마세요!

---

### 방법 4: GitHub Desktop 사용 (가장 간단)

1. [GitHub Desktop](https://desktop.github.com/) 다운로드 및 설치
2. GitHub Desktop에서:
   - File → Add Local Repository
   - 프로젝트 폴더 선택: `D:\DATA\AI_PROGRAMING\SundaySchool`
   - Repository name: `SundaySchool`
   - `airemge-ux` 계정으로 로그인
   - **Publish repository** 클릭

---

## 추천 순서

1. **방법 4 (GitHub Desktop)** - 가장 간단하고 안전
2. **방법 1 (자격 증명 관리자)** - Git 명령어 사용 선호 시
3. **방법 2 (Credential Manager)** - 명령어로 해결하고 싶을 때
4. **방법 3 (토큰 직접 포함)** - 임시 해결책

---

## Personal Access Token 생성 (필요 시)

1. [GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. **Generate new token (classic)**
3. **Scopes**: `repo` 체크
4. **Generate token** 클릭
5. 토큰 복사 (한 번만 표시!)

---

## 다음 단계

푸시가 성공한 후:
- GitHub 저장소에서 코드 확인: https://github.com/airemge-ux/SundaySchool
- [간단 배포 가이드](./deployment-guide-simple.md) - Vercel 배포 진행
