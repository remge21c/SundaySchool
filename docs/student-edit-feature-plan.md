# 학생 정보 수정 기능 계획

> 학생 프로필 기본 정보 수정 기능 구현 계획

**작성 일시**: 2026-01-13  
**상태**: 계획 단계

---

## 현재 상태

### 완료된 작업

- ✅ 학생 프로필 기본 정보 섹션에 "정보 수정" 버튼 추가
- ✅ 버튼 클릭 시 준비 중 메시지 표시
- ✅ 향후 수정 기능 연결을 위한 구조 준비

### 위치

- **컴포넌트**: `components/student/StudentProfile.tsx`
- **함수**: `handleEditClick()` (라인 30-35)

---

## 구현 계획

### 1. 학생 정보 수정 모달/폼 컴포넌트

**파일**: `components/student/StudentEditForm.tsx` (신규 생성)

**기능**:
- 학생 기본 정보 수정 폼
- 필드:
  - 이름
  - 학년
  - 생년월일
  - 성별
  - 학교명
  - 보호자 연락처
  - 주소
  - 알레르기 정보

**UI**:
- Dialog 컴포넌트 사용 (Shadcn/UI)
- 폼 유효성 검사 (Zod)
- 저장/취소 버튼

---

### 2. API 함수

**파일**: `lib/supabase/students.ts` (기존 파일 수정)

**함수**: `updateStudent()` (이미 존재하지만 확장 필요)

**확장 사항**:
- 모든 필드 업데이트 지원
- 유효성 검사 강화

---

### 3. 연결 방법

**파일**: `components/student/StudentProfile.tsx`

**수정 사항**:

```typescript
// 현재 (라인 30-35)
const handleEditClick = () => {
  alert('학생 정보 수정 기능은 곧 제공될 예정입니다.');
};

// 수정 후
const [isEditModalOpen, setIsEditModalOpen] = useState(false);

const handleEditClick = () => {
  setIsEditModalOpen(true);
};

// StudentEditForm 컴포넌트 추가
{isEditModalOpen && (
  <StudentEditForm
    student={student}
    open={isEditModalOpen}
    onClose={() => setIsEditModalOpen(false)}
    onSuccess={() => {
      setIsEditModalOpen(false);
      // 쿼리 무효화하여 최신 데이터 가져오기
      queryClient.invalidateQueries({ queryKey: ['student-profile', studentId] });
    }}
  />
)}
```

---

## 구현 단계

### Phase 1: 기본 수정 폼 구현

1. `components/student/StudentEditForm.tsx` 생성
2. 기본 필드 입력 폼 구현
3. Dialog로 모달 형태로 표시
4. `StudentProfile.tsx`에 연결

### Phase 2: API 연동

1. `updateStudent` 함수 확장
2. 폼 제출 시 API 호출
3. 성공/실패 처리
4. 쿼리 무효화하여 최신 데이터 표시

### Phase 3: 유효성 검사 및 에러 처리

1. Zod 스키마 정의
2. 폼 유효성 검사
3. 에러 메시지 표시
4. 로딩 상태 처리

---

## 참고

- **기존 코드**: `components/student/StudentProfile.tsx` (라인 30-35)
- **관련 컴포넌트**: `components/student/StudentPhotoUpload.tsx` (사진 업로드 참고)
- **관련 API**: `lib/supabase/students.ts` (updateStudent 함수)

---

## 다음 단계

1. `StudentEditForm` 컴포넌트 생성
2. `StudentProfile.tsx`의 `handleEditClick` 함수 수정
3. 모달 연결 및 테스트
