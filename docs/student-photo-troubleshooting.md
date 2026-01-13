# 학생 사진 업로드 문제 해결 가이드

> 사진 업로드 오류 해결 방법

---

## 일반적인 오류

### 1. 404 에러: "Bucket not found"

**증상**: `Bucket not found` 또는 `does not exist` 오류

**원인**: Supabase Storage 버킷이 생성되지 않음

**해결 방법**:
1. Supabase 대시보드 → **Storage** 메뉴
2. **New bucket** 클릭
3. Name: `student-photos`, Public bucket: ✅ 체크
4. **Create bucket** 클릭

---

### 2. 406 에러: "Not Acceptable"

**증상**: `students?id=eq.xxx&select=*` 406 에러

**원인**: 쿼리 형식 문제 또는 `photo_url` 필드가 없음

**해결 방법**:
1. Supabase SQL Editor에서 다음 실행:
```sql
ALTER TABLE students
ADD COLUMN IF NOT EXISTS photo_url TEXT;
```

---

### 3. 권한 오류: "new row violates policy"

**증상**: 업로드 권한 오류

**원인**: Storage 정책이 설정되지 않음

**해결 방법**:
1. Supabase 대시보드 → **Storage** → **Policies** → `student-photos` 버킷
2. 다음 정책 추가:

```sql
-- 업로드 정책
CREATE POLICY "Authenticated users can upload student photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'student-photos'
  AND (storage.foldername(name))[1] = 'students'
);

-- 읽기 정책 (공개)
CREATE POLICY "Public can view student photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'student-photos');

-- 삭제 정책
CREATE POLICY "Authenticated users can delete student photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'student-photos'
  AND (storage.foldername(name))[1] = 'students'
);
```

---

### 4. "column photo_url does not exist"

**증상**: `photo_url` 필드 관련 오류

**원인**: `students` 테이블에 `photo_url` 컬럼이 없음

**해결 방법**:
Supabase SQL Editor에서 실행:
```sql
ALTER TABLE students
ADD COLUMN IF NOT EXISTS photo_url TEXT;
```

---

## 전체 설정 체크리스트

- [ ] `students` 테이블에 `photo_url` 필드 추가
- [ ] `student-photos` Storage 버킷 생성 (Public)
- [ ] Storage 정책 설정 (업로드, 읽기, 삭제)
- [ ] 웹 애플리케이션 새로고침

---

## 설정 확인 방법

### 1. 데이터베이스 필드 확인
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'students' AND column_name = 'photo_url';
```

### 2. Storage 버킷 확인
Supabase 대시보드 → Storage → 버킷 목록에서 `student-photos` 확인

### 3. Storage 정책 확인
Supabase 대시보드 → Storage → Policies → `student-photos` 버킷 정책 확인

---

## 참고

- **파일 크기 제한**: 5MB
- **지원 형식**: 이미지 파일 (jpg, png, gif, webp 등)
- **저장 경로**: `students/{studentId}-{timestamp}.{ext}`
