/**
 * 학년도 전환 관련 TypeScript 타입 정의
 */

// 반 배정 이력
export interface ClassAssignment {
    id: string;
    student_id: string;
    class_id: string;
    year: number;
    start_date: string;
    end_date: string | null;
    created_at: string;
}

// 학년 이력
export interface StudentGradeHistory {
    id: string;
    student_id: string;
    year: number;
    grade: number;
    school_name: string | null;
    created_at: string;
}

// 임시 반 배정
export interface TempClassAssignment {
    id: string;
    student_id: string;
    class_id: string;
    year: number;
    created_at: string;
}

// 전환 로그
export interface YearTransitionLog {
    id: string;
    from_year: number;
    to_year: number;
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';
    started_at: string | null;
    completed_at: string | null;
    executed_by: string | null;
    total_students: number;
    assigned_students: number;
    error_message: string | null;
    created_at: string;
}

// 전환 진행 상황
export interface TransitionProgress {
    classesCreated: boolean;
    totalStudents: number;
    assignedStudents: number;
    assignmentProgress: number; // 0-100
    confirmed: boolean;
    executed: boolean;
    currentLog: YearTransitionLog | null;
}

// 반별 학생 배정 현황
export interface ClassAssignmentSummary {
    classId: string;
    className: string;
    department: string;
    currentStudentCount: number;
    nextYearStudentCount: number;
}

// 학생 배정 정보 (UI용)
export interface StudentAssignmentInfo {
    id: string;
    name: string;
    currentGrade: number;
    nextGrade: number;
    currentClassName: string;
    currentClassId: string;
    nextClassName: string | null;
    nextClassId: string | null;
    isAssigned: boolean;
}

// 새 학년도 반 생성 입력
export interface CreateNextYearClassInput {
    name: string;
    department: string;
    main_teacher_id: string | null;
}

// 학생 반 배정 입력
export interface AssignStudentInput {
    studentId: string;
    classId: string;
    year: number;
}
