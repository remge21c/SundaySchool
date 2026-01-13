# Supabase RLS (Row Level Security) 정책 문서

> 데이터베이스 레벨에서 보안을 강제하는 RLS 정책 설명서

---

## 개요

이 프로젝트는 Supabase의 Row Level Security (RLS)를 사용하여 데이터베이스 레벨에서 접근 제어를 구현합니다. 모든 테이블에 RLS가 활성화되어 있으며, 사용자 역할(admin, teacher, parent)에 따라 데이터 접근 권한이 다릅니다.

---

## 역할 정의

| 역할 | 설명 | 권한 |
|------|------|------|
| `admin` | 관리자 | 모든 데이터 조회/수정 가능 |
| `teacher` | 교사 | 담당 반의 데이터만 조회/수정 가능 |
| `parent` | 학부모 | 자녀의 데이터만 조회 가능 (v3에서 구현) |

---

## 테이블별 RLS 정책

### 1. profiles (사용자/교사 프로필)

#### 정책 1: Teachers can view own profile
- **대상**: `SELECT`
- **조건**: `auth.uid() = id`
- **설명**: 교사는 자신의 프로필만 조회 가능

#### 정책 2: Teachers can update own profile
- **대상**: `UPDATE`
- **조건**: `auth.uid() = id`
- **설명**: 교사는 자신의 프로필만 수정 가능

#### 정책 3: Admins can view all profiles
- **대상**: `SELECT`
- **조건**: 관리자 역할 확인
- **설명**: 관리자는 모든 프로필 조회 가능

---

### 2. students (학생 정보)

#### 정책: Teachers can view their class students
- **대상**: `SELECT`
- **조건**: 
  - 담당 반의 학생이거나
  - 관리자 역할
- **설명**: 교사는 자신이 담당하는 반의 학생만 조회 가능

**SQL 조건:**
```sql
class_id IN (
  SELECT id FROM classes
  WHERE main_teacher_id = auth.uid()
)
OR EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid() AND role = 'admin'
)
```

---

### 3. attendance_logs (출석 기록)

#### 정책: Teachers can manage their class attendance
- **대상**: `ALL` (SELECT, INSERT, UPDATE, DELETE)
- **조건**: 
  - 담당 반의 출석 기록이거나
  - 관리자 역할
- **설명**: 교사는 자신이 담당하는 반의 출석 기록만 조회/생성/수정 가능

**SQL 조건:**
```sql
class_id IN (
  SELECT id FROM classes
  WHERE main_teacher_id = auth.uid()
)
OR EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid() AND role = 'admin'
)
```

---

### 4. visitation_logs (심방 기록)

#### 정책 1: Teachers can view their class visitations
- **대상**: `SELECT`
- **조건**: 
  - 담당 반의 심방 기록이면서 `is_confidential = false`이거나
  - 관리자 역할
- **설명**: 교사는 담당 반의 비밀 보장되지 않은 심방 기록만 조회 가능

**SQL 조건:**
```sql
(student_id IN (
  SELECT id FROM students
  WHERE class_id IN (
    SELECT id FROM classes
    WHERE main_teacher_id = auth.uid()
  )
) AND is_confidential = false)
OR EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid() AND role = 'admin'
)
```

#### 정책 2: Teachers can create visitations
- **대상**: `INSERT`
- **조건**: 
  - 담당 반의 학생이거나
  - 관리자 역할
- **설명**: 교사는 담당 반의 학생에 대한 심방 기록 생성 가능

**SQL 조건:**
```sql
student_id IN (
  SELECT id FROM students
  WHERE class_id IN (
    SELECT id FROM classes
    WHERE main_teacher_id = auth.uid()
  )
)
OR EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid() AND role = 'admin'
)
```

---

### 5. classes (반 정보)

**현재 상태**: RLS 활성화되었으나 정책이 없음 (추가 필요)

**권장 정책:**
- 교사는 자신이 담당하는 반만 조회 가능
- 관리자는 모든 반 조회 가능

---

### 6. talent_transactions (달란트 장부)

**현재 상태**: RLS 활성화되었으나 정책이 없음 (v2에서 구현 예정)

**권장 정책:**
- 학생은 자신의 달란트 거래만 조회 가능
- 교사는 담당 반 학생의 달란트 거래 조회 가능
- 관리자는 모든 거래 조회 가능

---

## 보안 모범 사례

### 1. 최소 권한 원칙
- 각 역할은 필요한 최소한의 데이터만 접근 가능
- 교사는 담당 반의 데이터만 접근

### 2. 비밀 보장
- `visitation_logs.is_confidential = true`인 경우, 담당 교사만 조회 가능
- 관리자는 모든 심방 기록 조회 가능

### 3. 관리자 권한
- 관리자는 모든 테이블의 모든 데이터에 접근 가능
- 관리자 역할 확인은 `profiles.role = 'admin'`으로 수행

---

## RLS 정책 테스트

### 테스트 시나리오

1. **교사 A가 자신의 프로필 조회**
   ```sql
   SELECT * FROM profiles WHERE id = auth.uid();
   -- ✅ 성공 (자신의 프로필)
   ```

2. **교사 A가 다른 교사의 프로필 조회**
   ```sql
   SELECT * FROM profiles WHERE id = 'other-teacher-id';
   -- ❌ 실패 (RLS 정책 위반)
   ```

3. **교사 A가 담당 반의 학생 조회**
   ```sql
   SELECT * FROM students 
   WHERE class_id IN (
     SELECT id FROM classes WHERE main_teacher_id = auth.uid()
   );
   -- ✅ 성공 (담당 반의 학생)
   ```

4. **교사 A가 다른 반의 학생 조회**
   ```sql
   SELECT * FROM students 
   WHERE class_id NOT IN (
     SELECT id FROM classes WHERE main_teacher_id = auth.uid()
   );
   -- ❌ 실패 (RLS 정책 위반)
   ```

---

## 마이그레이션 적용 방법

### Supabase 대시보드에서

1. **SQL Editor** 열기
2. `supabase/migrations/001_initial_schema.sql` 파일 내용 복사
3. **Run** 클릭하여 실행

### Supabase CLI 사용

```bash
# Supabase CLI 설치
npm install -g supabase

# 프로젝트 연결
supabase link --project-ref your-project-ref

# 마이그레이션 적용
supabase db push
```

---

## 추가 정책 필요 사항

다음 정책들은 향후 마이그레이션에서 추가 예정:

1. **classes 테이블 RLS 정책**
2. **talent_transactions 테이블 RLS 정책**
3. **parent 역할 정책** (v3)
4. **profiles INSERT 정책** (회원가입 시)

---

## 참고 자료

- [Supabase RLS 문서](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Design 문서](../planning/04-database-design.md)
