# RLS 정책 수정 가이드

> 500 에러 해결: classes 테이블 RLS 정책 추가

---

## 문제

프로덕션 환경에서 다음 오류 발생:
- `classes` 테이블 조회 시 500 에러
- "RLS 정책 문제로 인해 장기 결석 알림을 조회할 수 없습니다"

**원인**: `classes` 테이블에 RLS가 활성화되어 있지만 정책이 없어 모든 조회가 차단됨

---

## 해결 방법

### Supabase SQL Editor에서 실행

1. [Supabase 대시보드](https://app.supabase.com) 접속
2. 프로젝트 선택 (SundaySchool)
3. **SQL Editor** 메뉴 클릭
4. 다음 SQL 실행:

```sql
-- classes 테이블 정책 추가
DROP POLICY IF EXISTS "Teachers can view their classes" ON classes;
CREATE POLICY "Teachers can view their classes"
ON classes FOR SELECT
TO authenticated
USING (
  main_teacher_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 관리자는 모든 반 조회 가능
DROP POLICY IF EXISTS "Admins can view all classes" ON classes;
CREATE POLICY "Admins can view all classes"
ON classes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

5. **Run** 버튼 클릭
6. 성공 메시지 확인

---

## 마이그레이션 파일

`supabase/migrations/002_fix_rls_policies.sql` 파일에 수정된 정책이 있습니다.

---

## 확인

SQL 실행 후:
1. 웹 애플리케이션 새로고침
2. 출석 체크 페이지에서 반 목록 확인
3. 대시보드에서 장기 결석 알림 확인

---

## 문제가 계속되면

1. **RLS 정책 확인**:
   - Supabase 대시보드 → Authentication → Policies
   - `classes` 테이블에 정책이 있는지 확인

2. **에러 로그 확인**:
   - Supabase 대시보드 → Logs
   - 최근 에러 로그 확인

3. **프로필 역할 확인**:
   - Table Editor → profiles
   - 사용자의 `role`이 `admin`인지 확인
