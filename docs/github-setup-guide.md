# GitHub 저장소 설정 가이드

> Vercel 배포를 위한 GitHub 저장소 생성 및 코드 푸시 방법

---

## 현재 상태

- ✅ Git 저장소 초기화 완료
- ❌ 아직 커밋 없음
- ❌ GitHub remote 연결 안 됨

---

## 단계별 가이드

### 1단계: GitHub 저장소 생성

1. [GitHub](https://github.com) 접속 및 로그인
2. 우측 상단 **+** 아이콘 클릭 → **New repository** 선택
3. 저장소 정보 입력:
   - **Repository name**: `sunday-school` (또는 원하는 이름)
   - **Description**: "차세대 주일학교 교적부 웹 애플리케이션" (선택사항)
   - **Visibility**: 
     - **Public** (오픈소스로 공개, 권장)
     - **Private** (비공개, 필요 시)
   - **Initialize this repository with**: 모두 체크 해제 (이미 로컬에 코드가 있음)
4. **Create repository** 클릭

### 2단계: GitHub 저장소 URL 확인

저장소 생성 후 나타나는 페이지에서 다음 URL을 확인합니다:

- **HTTPS**: `https://github.com/your-username/sunday-school.git`
- **SSH**: `git@github.com:your-username/sunday-school.git`

HTTPS를 사용하는 것을 권장합니다 (인증이 더 간단함).

### 3단계: 로컬에서 GitHub 연결 및 푸시

터미널에서 다음 명령어를 실행합니다:

```bash
# 1. 초기 커밋 생성
git commit -m "feat: MVP 완료 - 출석 체크, 학생 프로필, 심방 기록, 장기 결석 알림 기능 구현"

# 2. 브랜치를 main으로 변경 (GitHub 기본 브랜치)
git branch -M main

# 3. GitHub remote 추가 (your-username/sunday-school을 실제 저장소 이름으로 변경)
git remote add origin https://github.com/your-username/sunday-school.git

# 4. GitHub에 푸시
git push -u origin main
```

**GitHub 인증:**
- 첫 푸시 시 GitHub 로그인 창이 나타날 수 있습니다
- Personal Access Token (PAT)을 사용할 수도 있습니다
- 또는 GitHub Desktop 앱을 사용할 수 있습니다

---

## GitHub 인증 방법

### 방법 1: GitHub CLI 사용 (권장)

```bash
# GitHub CLI 설치 (아직 안 했다면)
# Windows: winget install GitHub.cli
# 또는 https://cli.github.com/ 에서 다운로드

# GitHub 로그인
gh auth login

# 저장소 생성 및 푸시
gh repo create sunday-school --public --source=. --remote=origin --push
```

### 방법 2: Personal Access Token 사용

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. **Generate new token** 클릭
3. 권한 선택:
   - `repo` (전체 저장소 권한)
4. 토큰 생성 및 복사
5. 푸시 시 비밀번호 대신 토큰 사용:

```bash
git push -u origin main
# Username: your-github-username
# Password: (복사한 토큰 붙여넣기)
```

### 방법 3: GitHub Desktop 사용

1. [GitHub Desktop](https://desktop.github.com/) 다운로드 및 설치
2. GitHub Desktop에서:
   - File → Add Local Repository
   - 프로젝트 폴더 선택
   - Publish repository 클릭

---

## 문제 해결

### "remote origin already exists" 에러

이미 remote가 설정되어 있는 경우:

```bash
# 기존 remote 확인
git remote -v

# 기존 remote 제거 (필요 시)
git remote remove origin

# 새 remote 추가
git remote add origin https://github.com/your-username/sunday-school.git
```

### "Permission denied" 에러

인증 문제인 경우:
- GitHub CLI로 다시 로그인: `gh auth login`
- 또는 Personal Access Token 사용

### "Large files" 경고

큰 파일이 있는 경우:
- `.gitignore` 파일 확인
- `node_modules`, `.next` 등이 제외되어 있는지 확인

---

## 다음 단계

GitHub에 코드를 푸시한 후:

1. **[간단 배포 가이드](./deployment-guide-simple.md)** - Vercel 배포 진행
2. GitHub 저장소에서 코드 확인
3. Vercel에서 GitHub 저장소 연결

---

## 참고

- GitHub 문서: [Creating a new repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository)
- Git 기본 사용법: [Git 공식 문서](https://git-scm.com/doc)
