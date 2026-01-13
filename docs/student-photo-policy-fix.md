# Storage 정책 중복 오류 해결

> "policy already exists" 오류 해결 방법

---

## 문제

Storage 정책을 추가하려고 할 때 다음 오류 발생:
```
ERROR: 42710: policy "Authenticated users can upload student photos" for table "objects" already exists
```

---

## 해결 방법

기존 정책을 삭제한 후 다시 생성하세요.

### Supabase SQL Editor에서 실행:

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

## 확인

1. **Success** 메시지 확인
2. Storage → Policies → `student-photos` 버킷에서 정책 확인
3. 웹 애플리케이션에서 사진 업로드 테스트

---

## 참고

- `DROP POLICY IF EXISTS`는 정책이 없어도 오류를 발생시키지 않습니다
- 정책이 이미 올바르게 설정되어 있다면 삭제/재생성 없이 그대로 사용해도 됩니다
