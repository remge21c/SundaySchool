# RLS 정책 수정 (students 테이블)

> 500 에러 해결: students 테이블 RLS 정책 수정

---

## 문제

프로덕션 환경에서 다음 오류 발생:
- `students` 테이블 조회 시 500 에러
- "Internal Server Error" on `/rest/v1/students`

**원인**: `students` 테이블의 RLS 정책이 `profiles` 테이블을 직접 조회하여 무한 재귀 발생

---

## 해결 방법 (5분)

### 1단계: Supabase 대시보드 접속

1. https://app.supabase.com 접속
2. **SundaySchool** 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭

### 2단계: SQL 실행

다음 SQL을 복사하여 SQL Editor에 붙여넣고 **Run** 버튼 클릭:

```sql
-- students 테이블 정책 수정 (무한 재귀 방지)
DROP POLICY IF EXISTS "Teachers can view their class students" ON students;

-- 교사는 자신이 담당하는 반의 학생 조회 가능, 관리자는 모든 학생 조회 가능
CREATE POLICY "Teachers can view their class students"
ON students FOR SELECT
TO authenticated
USING (
  class_id IN (
    SELECT id FROM classes
    WHERE main_teacher_id = auth.uid()
  )
  OR public.user_role() = 'admin'
);
```

**참고**: `public.user_role()` 함수가 이미 생성되어 있어야 합니다. 
만약 없다면 `supabase/migrations/002_fix_rls_policies.sql` 파일의 전체 내용을 실행하세요.

### 3단계: 확인

1. **Success** 메시지 확인
2. 웹 애플리케이션 새로고침
3. 출석 체크 페이지에서 학생 목록 확인

---

## 문제가 계속되면

1. **함수 확인**: `public.user_role()` 함수가 존재하는지 확인
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'user_role';
   ```

2. **정책 확인**: Authentication → Policies → students 테이블 정책 확인

3. **에러 로그 확인**: Supabase 대시보드 → Logs → 최근 에러 로그 확인
