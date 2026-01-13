# GitHub 빠른 설정 가이드

> Vercel 배포를 위한 GitHub 저장소 설정 (간단 버전)

---

## 현재 상태

- ✅ Git 저장소 초기화 완료
- ✅ 파일들이 staged 상태
- ❌ 아직 커밋 없음
- ❌ GitHub 저장소 없음

---

## 빠른 설정 (3단계)

### 1단계: GitHub 저장소 생성

1. 브라우저에서 [GitHub 새 저장소 생성](https://github.com/new) 접속
2. 저장소 정보 입력:
   - **Repository name**: `sunday-school` (또는 원하는 이름)
   - **Public** 또는 **Private** 선택
   - **Initialize this repository with** 모든 옵션 체크 해제 (이미 로컬에 코드가 있음)
3. **Create repository** 클릭
4. 저장소 URL 복사 (예: `https://github.com/your-username/sunday-school.git`)

### 2단계: 초기 커밋 생성

터미널에서 실행:

```bash
git commit -m "feat: MVP 완료 및 배포 준비 문서 추가"
```

### 3단계: GitHub에 푸시

터미널에서 실행 (your-username/sunday-school을 실제 저장소 이름으로 변경):

```bash
# 브랜치를 main으로 변경
git branch -M main

# GitHub remote 추가
git remote add origin https://github.com/your-username/sunday-school.git

# 푸시
git push -u origin main
```

**인증:**
- 브라우저에서 GitHub 로그인 창이 나타날 수 있습니다
- 또는 Personal Access Token을 사용할 수 있습니다

---

## 상세 가이드

더 자세한 설명이 필요하면: [GitHub 설정 가이드](./github-setup-guide.md)

---

## 다음 단계

GitHub 푸시 완료 후:
- [간단 배포 가이드](./deployment-guide-simple.md) - Vercel 배포 진행
