# 로그인 테스트 문제 해결

> 프로덕션 환경 로그인 실패 문제

---

## 문제 상황

- **이메일**: `airemge@gmail.com`
- **비밀번호**: `ddhqtus1`
- **결과**: 로그인 실패 (페이지 변경 없음)
- **네트워크 요청**: Supabase 인증 API 호출 없음

---

## 가능한 원인

1. **계정이 Supabase에 존재하지 않음**
2. **프로필(profiles 테이블)이 없음**
3. **비밀번호가 잘못됨**
4. **이메일 인증이 완료되지 않음**

---

## 해결 방법

### 1단계: Supabase에서 계정 확인

1. [Supabase 대시보드](https://app.supabase.com) 접속
2. 프로젝트 선택 (SundaySchool)
3. **Authentication** → **Users** 확인
4. `airemge@gmail.com` 계정이 있는지 확인

**계정이 없다면:**
- **Add user** → **Create new user**
- 이메일: `airemge@gmail.com`
- 비밀번호: `ddhqtus1`
- **Auto Confirm User** 체크 (이메일 인증 생략)
- **Create user** 클릭

### 2단계: 프로필 생성 (중요!)

계정이 있어도 프로필이 없으면 로그인할 수 없습니다.

1. **Table Editor** → **profiles** 테이블
2. **Insert row** 클릭
3. 다음 정보 입력:
   - **id**: 사용자 UUID (Authentication → Users에서 복사)
   - **email**: `airemge@gmail.com`
   - **role**: `admin` (드롭다운에서 선택)
   - **full_name**: 원하는 이름 (선택)
4. **Save** 클릭

### 3단계: 로그인 재시도

프로필을 생성한 후:
1. 로그인 페이지에서 다시 로그인 시도
2. 이메일: `airemge@gmail.com`
3. 비밀번호: `ddhqtus1`

---

## 빠른 확인 체크리스트

- [ ] Supabase → Authentication → Users에 `airemge@gmail.com` 계정 존재
- [ ] Supabase → Table Editor → profiles에 해당 사용자 프로필 존재
- [ ] 프로필의 `role`이 `admin` 또는 `teacher`로 설정됨
- [ ] 비밀번호가 올바른지 확인

---

## 문제가 계속되면

1. **브라우저 개발자 도구 확인**:
   - F12 → Console 탭
   - 에러 메시지 확인

2. **네트워크 탭 확인**:
   - F12 → Network 탭
   - 로그인 버튼 클릭 후 Supabase API 요청 확인
   - 요청이 없다면: JavaScript 오류 가능
   - 요청이 있다면: 응답 상태 코드 확인

3. **Supabase 로그 확인**:
   - Supabase 대시보드 → Logs
   - 인증 관련 로그 확인

---

## 다음 단계

계정과 프로필을 생성한 후:
1. 로그인 재시도
2. 대시보드 접속 확인
3. 기능 테스트 진행
