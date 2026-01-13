# GitHub 인증 문제 해결

> GitHub 푸시 시 권한 오류 해결 방법

---

## 문제 상황

```
remote: Permission to airemge-ux/SundaySchool.git denied to remge21c.
fatal: unable to access 'https://github.com/airemge-ux/SundaySchool.git/': The requested URL returned error: 403
```

**원인**: 현재 Git이 `remge21c` 계정으로 인증되어 있지만, 저장소는 `airemge-ux` 계정에 있습니다.

---

## 해결 방법

### 방법 1: Personal Access Token 사용 (권장)

#### 1단계: Personal Access Token 생성

1. [GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. **Generate new token** → **Generate new token (classic)** 클릭
3. 설정:
   - **Note**: `SundaySchool Project` (설명)
   - **Expiration**: 원하는 만료 기간 선택
   - **Scopes**: `repo` 체크 (모든 저장소 권한)
4. **Generate token** 클릭
5. **토큰 복사** (한 번만 표시되므로 안전하게 보관!)

#### 2단계: 푸시 시 토큰 사용

터미널에서 푸시 명령어 실행:

```bash
git push -u origin main
```

인증 정보 입력 시:
- **Username**: `airemge-ux` (GitHub 사용자명)
- **Password**: `복사한-Personal-Access-Token` (비밀번호가 아닌 토큰!)

---

### 방법 2: Git Credential Manager 사용

Windows에서 Git Credential Manager를 사용하여 인증 정보 업데이트:

1. Windows 자격 증명 관리자 열기:
   - Windows 검색: "자격 증명 관리자"
   - 또는: `Win + R` → `control /name Microsoft.CredentialManager`

2. Windows 자격 증명 → 일반 자격 증명
3. `git:https://github.com` 관련 항목 찾기
4. 삭제 또는 편집하여 `airemge-ux` 계정 정보로 변경

5. 다시 푸시:
```bash
git push -u origin main
```

---

### 방법 3: GitHub Desktop 사용

1. [GitHub Desktop](https://desktop.github.com/) 다운로드 및 설치
2. GitHub Desktop에서:
   - File → Add Local Repository
   - 프로젝트 폴더 선택
   - Publish repository 클릭
   - `airemge-ux` 계정으로 로그인

---

### 방법 4: SSH 키 사용 (고급)

SSH 키를 사용하면 토큰 없이 인증할 수 있습니다:

1. SSH 키 생성 (이미 있다면 스킵):
```bash
ssh-keygen -t ed25519 -C "airemge@gmail.com"
```

2. SSH 키를 GitHub에 추가:
   - [GitHub → Settings → SSH and GPG keys](https://github.com/settings/keys)
   - **New SSH key** 클릭
   - 공개 키 복사: `cat ~/.ssh/id_ed25519.pub`
   - 키 추가

3. Remote URL을 SSH로 변경:
```bash
git remote set-url origin git@github.com:airemge-ux/SundaySchool.git
git push -u origin main
```

---

## 추천 방법

**파일럿 단계에서는 방법 1 (Personal Access Token)을 권장합니다:**
- 설정이 간단함
- 즉시 사용 가능
- 보안이 좋음 (토큰만 필요)

---

## 다음 단계

푸시가 성공한 후:
- GitHub 저장소에서 코드 확인
- [간단 배포 가이드](./deployment-guide-simple.md) - Vercel 배포 진행
