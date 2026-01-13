# Supabase 마이그레이션 확인 가이드

> 008, 009 마이그레이션 적용 확인

**확인 일시**: 2026-01-13

---

## 확인 항목

### 1. departments 테이블 확인 (008 마이그레이션)

#### 1.1 테이블 존재 확인
- [ ] Supabase 대시보드 → Table Editor
- [ ] 좌측 메뉴에서 `departments` 테이블 확인
- [ ] 테이블이 존재하는지 확인

#### 1.2 테이블 구조 확인
- [ ] `departments` 테이블 클릭
- [ ] 다음 컬럼들이 있는지 확인:
  - [ ] `id` (UUID, Primary Key)
  - [ ] `name` (TEXT, UNIQUE, NOT NULL)
  - [ ] `description` (TEXT, nullable)
  - [ ] `is_active` (BOOLEAN, DEFAULT true)
  - [ ] `created_at` (TIMESTAMP)
  - [ ] `updated_at` (TIMESTAMP)
  - [ ] `sort_order` (INTEGER, NOT NULL) ← 009 마이그레이션에서 추가

#### 1.3 초기 데이터 확인
- [ ] 다음 부서들이 있는지 확인:
  - [ ] 유년부
  - [ ] 초등부
  - [ ] 중등부
  - [ ] 고등부
- [ ] 각 부서의 `sort_order` 값 확인 (0, 1, 2, 3 또는 1, 2, 3, 4)

---

### 2. sort_order 컬럼 확인 (009 마이그레이션)

#### 2.1 컬럼 존재 확인
- [ ] `departments` 테이블에 `sort_order` 컬럼이 있는지 확인
- [ ] 컬럼 타입이 `INTEGER`인지 확인
- [ ] `NOT NULL` 제약조건이 있는지 확인

#### 2.2 인덱스 확인
- [ ] Supabase 대시보드 → Database → Indexes
- [ ] `idx_departments_sort_order` 인덱스가 있는지 확인

#### 2.3 데이터 확인
- [ ] 각 부서의 `sort_order` 값이 순서대로 부여되었는지 확인
- [ ] 중복된 값이 없는지 확인

---

### 3. RLS 정책 확인 (008 마이그레이션)

#### 3.1 RLS 활성화 확인
- [ ] Supabase 대시보드 → Authentication → Policies
- [ ] `departments` 테이블의 RLS가 활성화되어 있는지 확인

#### 3.2 정책 확인
- [ ] 다음 정책들이 있는지 확인:
  - [ ] "모든 사용자는 활성화된 부서 조회 가능" (SELECT)
  - [ ] "관리자는 부서 생성 가능" (INSERT)
  - [ ] "관리자는 부서 수정 가능" (UPDATE)
  - [ ] "관리자는 부서 삭제 가능" (DELETE)

---

## SQL로 직접 확인

Supabase 대시보드 → SQL Editor에서 다음 쿼리를 실행하여 확인할 수 있습니다:

### 1. 테이블 구조 확인
```sql
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'departments'
ORDER BY ordinal_position;
```

### 2. 초기 데이터 확인
```sql
SELECT 
  id,
  name,
  description,
  is_active,
  sort_order,
  created_at
FROM departments
ORDER BY sort_order;
```

### 3. 인덱스 확인
```sql
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'departments';
```

### 4. RLS 정책 확인
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'departments';
```

---

## 예상 결과

### departments 테이블 구조
```
id              | uuid           | PRIMARY KEY
name            | text           | UNIQUE, NOT NULL
description     | text           | nullable
is_active       | boolean        | DEFAULT true
sort_order      | integer        | NOT NULL
created_at      | timestamptz    | DEFAULT NOW()
updated_at      | timestamptz    | DEFAULT NOW()
```

### 초기 데이터 (예시)
```
name    | description | is_active | sort_order
--------|-------------|-----------|------------
유년부  | 유년부 설명 | true      | 0
초등부  | 초등부 설명 | true      | 1
중등부  | 중등부 설명 | true      | 2
고등부  | 고등부 설명 | true      | 3
```

---

## 문제 해결

### departments 테이블이 없는 경우
1. `008_create_departments_table.sql` 마이그레이션을 다시 실행
2. 에러 메시지 확인
3. 필요시 수동으로 테이블 생성

### sort_order 컬럼이 없는 경우
1. `009_add_department_order.sql` 마이그레이션을 다시 실행
2. 에러 메시지 확인
3. 필요시 수동으로 컬럼 추가

### 초기 데이터가 없는 경우
1. SQL Editor에서 다음 쿼리 실행:
```sql
INSERT INTO departments (name, description, is_active, sort_order)
VALUES
  ('유년부', '유년부 설명', true, 0),
  ('초등부', '초등부 설명', true, 1),
  ('중등부', '중등부 설명', true, 2),
  ('고등부', '고등부 설명', true, 3)
ON CONFLICT (name) DO NOTHING;
```

---

## 확인 완료 체크리스트

- [ ] departments 테이블 존재
- [ ] 테이블 구조 정상 (모든 컬럼 존재)
- [ ] sort_order 컬럼 존재 및 NOT NULL
- [ ] 초기 데이터 4개 존재
- [ ] sort_order 값이 순서대로 부여됨
- [ ] 인덱스 생성됨
- [ ] RLS 정책 4개 존재
- [ ] SQL 쿼리로 확인 완료

---

## 다음 단계

마이그레이션 확인이 완료되면:
1. 관리자 페이지에서 부서 관리 기능 테스트
2. 부서 순서 조정 기능 테스트
3. 반 생성 시 부서 목록이 정상적으로 표시되는지 확인
