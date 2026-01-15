/**
 * 학년도 전환 API 함수
 * Supabase를 사용한 학년도 전환 관련 작업
 */

import { supabase } from './client';

// 전환 상태 타입
export interface TransitionStatus {
    currentYear: number;
    nextYear: number;
    classesCreated: boolean;
    assignmentProgress: number; // 0-100
    confirmed: boolean;
    executed: boolean;
    totalStudents: number;
    assignedStudents: number;
    nextYearClassCount: number;
}

// 학생 타입 (간략화)
export interface StudentWithClass {
    id: string;
    name: string;
    grade: number;
    class_id: string;
    className?: string; // 현재 반 이름
    department?: string; // 현재 부서
}

export interface BatchAssignment {
    studentIds: string[];
    classId: string;
    year: number;
    assignedBy?: string;
}

export interface Class {
    id: string;
    name: string;
    department?: string;
    teacher_name?: string;
}

/**
 * 연도 전환 진행 상태 조회
 */
export async function getYearTransitionStatus(): Promise<TransitionStatus> {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    // 다음 연도 반 개수 조회
    const { data: nextYearClasses, error: classError } = await (supabase
        .from('classes')
        .select('id')
        .eq('year', nextYear) as any);

    if (classError && !classError.message?.includes('does not exist')) {
        console.error('Error fetching next year classes:', classError);
    }

    // 전체 활성 학생 수 조회
    const { data: students, error: studentError } = await (supabase
        .from('students')
        .select('id')
        .eq('is_active', true) as any);

    if (studentError) {
        console.error('Error fetching students:', studentError);
    }

    // 다음 연도 임시 배정된 학생 수 조회
    const { data: tempAssignments, error: tempError } = await (supabase
        .from('temp_class_assignments')
        .select('student_id')
        .eq('year', nextYear) as any);

    // 테이블이 없는 경우 무시
    const tempCount = tempError ? 0 : (tempAssignments?.length ?? 0);

    // 전환 로그 조회
    const { data: transitionLog, error: logError } = await (supabase
        .from('year_transition_log')
        .select('*')
        .eq('from_year', currentYear)
        .eq('to_year', nextYear)
        .maybeSingle() as any);

    // 테이블이 없는 경우 무시
    const log = logError ? null : transitionLog;

    const totalStudents = students?.length ?? 0;
    const assignedStudents = tempCount;
    const nextYearClassCount = nextYearClasses?.length ?? 0;

    return {
        currentYear,
        nextYear,
        classesCreated: nextYearClassCount > 0,
        assignmentProgress: totalStudents > 0
            ? Math.round((assignedStudents / totalStudents) * 100)
            : 0,
        confirmed: totalStudents > 0 && assignedStudents === totalStudents,
        executed: log?.status === 'completed',
        totalStudents,
        assignedStudents,
        nextYearClassCount,
    };
}

/**
 * 새 학년도 반 생성 (현재 연도 반 복사)
 */
export async function createNextYearClasses(): Promise<{
    success: boolean;
    createdCount: number;
    error?: string;
}> {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    try {
        // 현재 연도 활성 반 조회
        const { data: currentClasses, error: fetchError } = await (supabase
            .from('classes')
            .select('*')
            .eq('year', currentYear)
            .eq('is_active', true) as any);

        if (fetchError) {
            throw fetchError;
        }

        if (!currentClasses || currentClasses.length === 0) {
            return { success: false, createdCount: 0, error: '현재 연도에 활성 반이 없습니다.' };
        }

        // 이미 다음 연도 반이 있는지 확인
        const { data: existingClasses, error: existingError } = await (supabase
            .from('classes')
            .select('id')
            .eq('year', nextYear) as any);

        if (existingError) {
            throw existingError;
        }

        if (existingClasses && existingClasses.length > 0) {
            return {
                success: false,
                createdCount: 0,
                error: `${nextYear}년 반이 이미 ${existingClasses.length}개 존재합니다.`
            };
        }

        // 새 연도 반 생성 (같은 이름, 같은 교사)
        const newClasses = currentClasses.map((cls: any) => ({
            name: cls.name,
            department: cls.department,
            year: nextYear,
            main_teacher_id: cls.main_teacher_id,
            is_active: false, // 아직 활성화하지 않음
        }));

        const { data: insertedClasses, error: insertError } = await (supabase
            .from('classes')
            .insert(newClasses)
            .select() as any);

        if (insertError) {
            throw insertError;
        }

        // 전환 로그 생성
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('year_transition_log') as any).upsert({
            from_year: currentYear,
            to_year: nextYear,
            status: 'pending',
            classes_created: insertedClasses?.length ?? 0,
        });

        return {
            success: true,
            createdCount: insertedClasses?.length ?? 0
        };
    } catch (error: any) {
        console.error('Error creating next year classes:', error);
        return {
            success: false,
            createdCount: 0,
            error: error.message || '반 생성 중 오류가 발생했습니다.'
        };
    }
}

/**
 * 학생 임시 배정
 */
export async function assignStudentToClass(
    studentId: string,
    classId: string,
    year: number,
    assignedBy?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from('temp_class_assignments') as any).upsert({
            student_id: studentId,
            class_id: classId,
            year,
            assigned_by: assignedBy,
        });

        if (error) {
            throw error;
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error assigning student:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 미배정 학생 조회
 */
export async function getUnassignedStudents(year: number): Promise<StudentWithClass[]> {
    try {
        // 모든 활성 학생 조회
        const { data: students, error: studentError } = await (supabase
            .from('students')
            .select(`
        id,
        name,
        grade,
        class_id,
        classes (name, department)
      `)
            .eq('is_active', true) as any);

        if (studentError) {
            throw studentError;
        }

        // 이미 배정된 학생 ID 조회
        const { data: assigned, error: assignedError } = await (supabase
            .from('temp_class_assignments')
            .select('student_id')
            .eq('year', year) as any);

        // 테이블이 없는 경우 무시
        const assignedIds = assignedError ? [] : (assigned?.map((a: any) => a.student_id) ?? []);

        // 미배정 학생 필터링
        const unassigned = (students ?? [])
            .filter((s: any) => !assignedIds.includes(s.id))
            .map((s: any) => ({
                id: s.id,
                name: s.name,
                grade: s.grade,
                class_id: s.class_id,
                className: s.classes?.name ?? '미정',
                department: s.classes?.department ?? '미정',
            }));

        return unassigned;
    } catch (error) {
        console.error('Error fetching unassigned students:', error);
        return [];
    }
}

/**
 * 다음 연도 반 목록 조회
 */
export async function getNextYearClasses(year?: number) {
    const nextYear = year || new Date().getFullYear() + 1;

    try {
        const { data, error } = await (supabase
            .from('classes')
            .select('*')
            .eq('year', nextYear)
            .order('department')
            .order('name') as any);

        if (error) {
            throw error;
        }

        return data ?? [];
    } catch (error) {
        console.error('Error fetching next year classes:', error);
        return [];
    }
}

/**
 * 연도 전환 실행
 * (1월 1일에 실행하거나 관리자가 수동 실행)
 */
export async function executeYearTransition(executedBy?: string): Promise<{
    success: boolean;
    error?: string;
    stats?: {
        classesActivated: number;
        studentsAssigned: number;
        gradesIncremented: number;
    };
}> {
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;

    try {
        // 1. 작년 반 비활성화
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: deactivateError } = await (supabase.from('classes') as any)
            .update({ is_active: false })
            .eq('year', lastYear);

        if (deactivateError) {
            console.warn('Error deactivating last year classes:', deactivateError);
        }

        // 2. 올해 반 활성화
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: activatedClasses, error: activateError } = await (supabase.from('classes') as any)
            .update({ is_active: true })
            .eq('year', currentYear)
            .select();

        if (activateError) {
            throw activateError;
        }

        // 3. 임시 배정 → 실제 배정 전환
        const { data: tempAssignments, error: tempError } = await (supabase
            .from('temp_class_assignments')
            .select('*')
            .eq('year', currentYear) as any);

        let studentsAssigned = 0;
        if (!tempError && tempAssignments && tempAssignments.length > 0) {
            const classAssignments = tempAssignments.map((ta: any) => ({
                student_id: ta.student_id,
                class_id: ta.class_id,
                year: currentYear,
                start_date: `${currentYear}-01-01`,
                end_date: null,
            }));

            const { error: insertError } = await (supabase
                .from('class_assignments')
                .insert(classAssignments) as any);

            if (insertError) {
                console.warn('Error inserting class assignments:', insertError);
            } else {
                studentsAssigned = classAssignments.length;
            }

            // 학생 테이블의 class_id 업데이트
            for (const ta of tempAssignments) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (supabase.from('students') as any)
                    .update({ class_id: ta.class_id })
                    .eq('id', ta.student_id);
            }

            // 임시 배정 삭제
            await (supabase
                .from('temp_class_assignments')
                .delete()
                .eq('year', currentYear) as any);
        }

        // 4. 학생 학년 +1
        const { error: gradeError } = await (supabase
            .rpc('increment_student_grades') as any);

        if (gradeError) {
            console.warn('Error incrementing grades:', gradeError);
        }

        // 5. 학년 이력 기록
        const { data: allStudents } = await (supabase
            .from('students')
            .select('id, grade, school_name')
            .eq('is_active', true) as any);

        if (allStudents && allStudents.length > 0) {
            const gradeHistory = allStudents.map((s: any) => ({
                student_id: s.id,
                year: currentYear,
                grade: s.grade,
                school_name: s.school_name,
            }));

            await (supabase
                .from('student_grade_history')
                .upsert(gradeHistory) as any);
        }

        // 6. 전환 로그 업데이트
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('year_transition_log') as any).upsert({
            from_year: lastYear,
            to_year: currentYear,
            status: 'completed',
            classes_created: activatedClasses?.length ?? 0,
            students_assigned: studentsAssigned,
            executed_at: new Date().toISOString(),
        });

        return {
            success: true,
            stats: {
                classesActivated: activatedClasses?.length ?? 0,
                studentsAssigned,
                gradesIncremented: allStudents?.length ?? 0,
            },
        };
    } catch (error: any) {
        console.error('Error executing year transition:', error);
        return {
            success: false,
            error: error.message || '전환 실행 중 오류가 발생했습니다.',
        };
    }
}

/**
 * 학생 일괄 배정
 */
export async function assignStudentsBatch(
    assignment: BatchAssignment
): Promise<{ success: boolean; error?: string; count?: number }> {
    try {
        const assignments = assignment.studentIds.map(studentId => ({
            student_id: studentId,
            class_id: assignment.classId,
            year: assignment.year,
            assigned_by: assignment.assignedBy,
        }));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from('temp_class_assignments') as any).upsert(assignments);

        if (error) {
            throw error;
        }

        return { success: true, count: assignments.length };
    } catch (error: any) {
        console.error('Error batch assigning students:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 다음 연도 반 생성 초기화 (다시 생성하기 위함)
 */
export async function resetNextYearClasses(): Promise<{ success: boolean; error?: string }> {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    try {
        // 1. 임시 배정 데이터 삭제
        const { error: assignError } = await (supabase
            .from('temp_class_assignments')
            .delete()
            .eq('year', nextYear) as any);

        if (assignError) throw assignError;

        // 2. 비활성 상태인 다음 연도 반 삭제
        // 안전을 위해 is_active가 false인 것만 삭제
        const { error: classError } = await (supabase
            .from('classes')
            .delete()
            .eq('year', nextYear)
            .eq('is_active', false) as any);

        if (classError) throw classError;

        // 3. 로그 상태 업데이트 (선택사항, 필요시)
        await (supabase.from('year_transition_log') as any)
            .delete()
            .eq('from_year', currentYear)
            .eq('to_year', nextYear);

        return { success: true };
    } catch (error: any) {
        console.error('Error resetting next year classes:', error);
        return { success: false, error: error.message || '초기화 중 오류가 발생했습니다.' };
    }
}
