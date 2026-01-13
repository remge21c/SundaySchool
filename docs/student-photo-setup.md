# 학생 사진 첨부 기능 설정 가이드

> Supabase Storage를 사용한 학생 사진 업로드 기능 설정

---

## 1. 데이터베이스 스키마 업데이트

### students 테이블에 photo_url 필드 추가

**Supabase SQL Editor에서 실행:**

```sql
-- 학생 사진 필드 추가
ALTER TABLE students
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 인덱스 추가 (선택사항)
CREATE INDEX IF NOT EXISTS idx_students_photo_url ON students(photo_url) WHERE photo_url IS NOT NULL;
```

또는 `supabase/migrations/003_add_student_photo.sql` 파일의 전체 내용을 실행하세요.

---

## 2. Supabase Storage 버킷 생성

### 2.1 Storage 버킷 생성

1. Supabase 대시보드 → **Storage** 메뉴 클릭
2. **New bucket** 버튼 클릭
3. 다음 정보 입력:
   - **Name**: `student-photos`
   - **Public bucket**: ✅ 체크 (공개 버킷으로 설정)
4. **Create bucket** 클릭

### 2.2 Storage 정책 설정

**Storage → Policies → student-photos 버킷**

다음 SQL을 **순서대로** 실행하세요 (기존 정책이 있으면 삭제 후 재생성):

```sql
-- 기존 정책 삭제 (있는 경우)
DROP POLICY IF EXISTS "Authenticated users can upload student photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view student photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete student photos" ON storage.objects;

-- 정책 1: 인증된 사용자는 업로드 가능
CREATE POLICY "Authenticated users can upload student photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'student-photos'
  AND (storage.foldername(name))[1] = 'students'
);

-- 정책 2: 모든 사용자는 읽기 가능 (공개 버킷)
CREATE POLICY "Public can view student photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'student-photos');

-- 정책 3: 인증된 사용자는 삭제 가능
CREATE POLICY "Authenticated users can delete student photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'student-photos'
  AND (storage.foldername(name))[1] = 'students'
);
```

---

## 3. 확인

설정 완료 후:

1. 웹 애플리케이션 새로고침
2. 학생 프로필 페이지 접속
3. 사진 업로드 버튼 확인
4. 사진 업로드 테스트

---

## 문제 해결

### Storage 버킷이 보이지 않는 경우

- Supabase 대시보드 → Storage 메뉴 확인
- 버킷이 없으면 위의 2.1 단계를 다시 진행

### 업로드 권한 오류

- Storage 정책이 올바르게 설정되었는지 확인
- 인증된 사용자로 로그인했는지 확인

### 이미지가 표시되지 않는 경우

- 버킷이 Public으로 설정되었는지 확인
- photo_url이 올바른 URL 형식인지 확인

---

## 참고

- **파일 크기 제한**: 5MB
- **지원 형식**: 이미지 파일 (jpg, png, gif, webp 등)
- **저장 경로**: `students/{studentId}-{timestamp}.{ext}`
