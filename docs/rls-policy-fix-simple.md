# RLS 정책 수정 (간단 버전)

> 500 에러 해결: Supabase SQL Editor에서 직접 실행

---

## 문제

- `classes` 테이블 조회 시 500 에러
- "RLS 정책 문제로 인해 장기 결석 알림을 조회할 수 없습니다"

---

## 해결 방법 (5분)

### 1단계: Supabase 대시보드 접속

1. https://app.supabase.com 접속
2. **SundaySchool** 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭

### 2단계: SQL 실행

다음 SQL을 복사하여 SQL Editor에 붙여넣고 **Run** 버튼 클릭:

```sql
-- 역할 확인 함수 생성 (public 스키마에 생성)
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- classes 테이블 정책 수정
DROP POLICY IF EXISTS "Teachers can view their classes" ON classes;
DROP POLICY IF EXISTS "Teachers can view their own classes" ON classes;
DROP POLICY IF EXISTS "Admins can view all classes" ON classes;

-- 교사는 자신이 담당하는 반 조회 가능, 관리자는 모든 반 조회 가능
CREATE POLICY "Teachers can view their classes"
ON classes FOR SELECT
TO authenticated
USING (
  main_teacher_id = auth.uid()
  OR public.user_role() = 'admin'
);
```

### 3단계: 확인

1. **Success** 메시지 확인
2. 웹 애플리케이션 새로고침
3. 출석 체크 페이지에서 반 목록 확인

---

## 문제가 계속되면

1. **에러 메시지 확인**: SQL Editor 하단의 에러 메시지 확인
2. **정책 확인**: Authentication → Policies → classes 테이블 정책 확인
3. **프로필 역할 확인**: Table Editor → profiles → 사용자의 `role`이 `admin`인지 확인
