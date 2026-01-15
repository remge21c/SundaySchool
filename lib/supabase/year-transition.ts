/**
 * 학년도 전환 관련 API 함수
 * 
 * 주의: 이 파일은 새로 추가된 테이블들(class_assignments, temp_class_assignments 등)을
 * 사용하므로 034_create_year_transition_tables.sql 마이그레이션이 먼저 적용되어야 합니다.
 */

import { supabase } from './client';
import type {
    YearTransitionLog,
    TransitionProgress,
    StudentAssignmentInfo,
    ClassAssignmentSummary,
} from '@/types/year-transition';
import type { Class } from '@/types/class';

const CURRENT_YEAR = new Date().getFullYear();

// 타입 안전성을 위한 헬퍼 인터페이스
interface ClassRow {
    id: string;
    name: string;
    department: string;
    year: number;
    main_teacher_id: string | null;
    is_active: boolean;
    created_at: string;
}

interface TempAssignmentRow {
    id: string;
    student_id: string;
    class_id: string;
    year: number;
    created_at: string;
}

interface TransitionLogRow {
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

interface StudentRow {
    id: string;
    name: string;
    grade: number;
    school_name: string | null;
    class_id: string;
}

interface StudentWithClass extends StudentRow {
    classes: { id: string; name: string; department: string; year: number } | null;
}

// ============================================
// 1. 전환 진행 상황 조회
// ============================================
export async function getTransitionProgress(targetYear: number): Promise<TransitionProgress> {
    // 1. 대상 연도 반이 생성되었는지 확인
    const { data: nextYearClasses } = await supabase
        .from('classes')
        .select('id')
        .eq('year', targetYear);

    const classesCreated = (nextYearClasses?.length ?? 0) > 0;

    // 2. 전체 활성 학생 수
    const { count: totalStudents } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

    // 3. 임시 배정된 학생 수 (새 테이블이 없으면 0 반환)
    let assignedStudents = 0;
    try {
        const { count } = await (supabase as any)
            .from('temp_class_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('year', targetYear);
        assignedStudents = count ?? 0;
    } catch {
        // 테이블이 없는 경우 무시
    }

    // 4. 최근 전환 로그
    let currentLog: YearTransitionLog | null = null;
    try {
        const { data: logs } = await (supabase as any)
            .from('year_transition_logs')
            .select('*')
            .eq('to_year', targetYear)
            .order('created_at', { ascending: false })
            .limit(1);

        if (logs && logs.length > 0) {
            currentLog = logs[0] as YearTransitionLog;
        }
    } catch {
        // 테이블이 없는 경우 무시
    }

    const total = totalStudents ?? 0;
    const assigned = assignedStudents;
    const progress = total > 0 ? Math.round((assigned / total) * 100) : 0;

    return {
        classesCreated,
        totalStudents: total,
        assignedStudents: assigned,
        assignmentProgress: progress,
        confirmed: currentLog?.status === 'pending' || currentLog?.status === 'completed',
        executed: currentLog?.status === 'completed',
        currentLog,
    };
}

// ============================================
// 2. 새 학년도 반 생성
// ============================================
export async function createNextYearClasses(
    sourceYear: number = CURRENT_YEAR,
    targetYear: number = CURRENT_YEAR + 1
): Promise<{ success: boolean; createdCount: number; error?: string }> {
    try {
        // 1. 현재 연도 활성 반 조회
        const { data: currentClasses, error: fetchError } = await supabase
            .from('classes')
            .select('*')
            .eq('year', sourceYear)
            .eq('is_active', true);

        if (fetchError) throw fetchError;

        if (!currentClasses || currentClasses.length === 0) {
            return { success: false, createdCount: 0, error: '복사할 반이 없습니다.' };
        }

        // 2. 이미 대상 연도에 반이 있는지 확인
        const { data: existingClasses } = await supabase
            .from('classes')
            .select('id')
            .eq('year', targetYear);

        if (existingClasses && existingClasses.length > 0) {
            return { success: false, createdCount: 0, error: `${targetYear}년도 반이 이미 존재합니다.` };
        }

        // 3. 새 연도 반 생성
        const newClasses = (currentClasses as ClassRow[]).map((cls) => ({
            name: cls.name,
            department: cls.department,
            year: targetYear,
            main_teacher_id: cls.main_teacher_id,
            is_active: false, // 아직 활성화하지 않음
        }));

        const { error: insertError } = await (supabase as any)
            .from('classes')
            .insert(newClasses);

        if (insertError) throw insertError;

        return { success: true, createdCount: newClasses.length };
    } catch (error) {
        console.error('새 학년도 반 생성 실패:', error);
        return { success: false, createdCount: 0, error: String(error) };
    }
}

// ============================================
// 3. 대상 연도 반 목록 조회
// ============================================
export async function getClassesByYear(year: number): Promise<Class[]> {
    const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('year', year)
        .order('department')
        .order('name');

    if (error) {
        console.error('반 목록 조회 실패:', error);
        return [];
    }

    return ((data ?? []) as ClassRow[]).map((row) => ({
        id: row.id,
        name: row.name,
        department: row.department,
        year: row.year,
        main_teacher_id: row.main_teacher_id ?? '',
        created_at: row.created_at,
    }));
}

// ============================================
// 4. 반별 배정 현황 조회
// ============================================
export async function getClassAssignmentSummary(
    currentYear: number,
    targetYear: number
): Promise<ClassAssignmentSummary[]> {
    // 대상 연도 반
    const { data: nextYearClasses } = await supabase
        .from('classes')
        .select('id, name, department')
        .eq('year', targetYear);

    // 임시 배정 조회 (테이블이 없으면 빈 배열)
    let tempAssignments: TempAssignmentRow[] = [];
    try {
        const { data } = await (supabase as any)
            .from('temp_class_assignments')
            .select('class_id')
            .eq('year', targetYear);
        tempAssignments = data ?? [];
    } catch {
        // 테이블이 없는 경우 무시
    }

    // 임시 배정 수 집계
    const assignmentCounts: Record<string, number> = {};
    tempAssignments.forEach((ta) => {
        assignmentCounts[ta.class_id] = (assignmentCounts[ta.class_id] ?? 0) + 1;
    });

    return ((nextYearClasses ?? []) as ClassRow[]).map((cls) => ({
        classId: cls.id,
        className: cls.name,
        department: cls.department,
        currentStudentCount: 0,
        nextYearStudentCount: assignmentCounts[cls.id] ?? 0,
    }));
}

// ============================================
// 5. 미배정 학생 목록 조회
// ============================================
export async function getUnassignedStudents(
    targetYear: number
): Promise<StudentAssignmentInfo[]> {
    // 현재 활성 학생
    const { data: students } = await supabase
        .from('students')
        .select(`
      id,
      name,
      grade,
      class_id,
      classes(id, name, department, year)
    `)
        .eq('is_active', true);

    // 이미 배정된 학생 (테이블이 없으면 빈 배열)
    let tempAssignments: TempAssignmentRow[] = [];
    try {
        const { data } = await (supabase as any)
            .from('temp_class_assignments')
            .select('student_id, class_id')
            .eq('year', targetYear);
        tempAssignments = data ?? [];
    } catch {
        // 테이블이 없는 경우 무시
    }

    // 대상 연도 반
    const { data: targetClasses } = await supabase
        .from('classes')
        .select('id, name')
        .eq('year', targetYear);

    const assignmentMap: Record<string, string> = {};
    tempAssignments.forEach((ta) => {
        assignmentMap[ta.student_id] = ta.class_id;
    });

    const classNameMap: Record<string, string> = {};
    ((targetClasses ?? []) as ClassRow[]).forEach((c) => {
        classNameMap[c.id] = c.name;
    });

    return ((students ?? []) as StudentWithClass[]).map((student) => {
        const currentClass = student.classes;
        const nextClassId = assignmentMap[student.id] ?? null;

        return {
            id: student.id,
            name: student.name,
            currentGrade: student.grade,
            nextGrade: student.grade < 6 ? student.grade + 1 : 1,
            currentClassName: currentClass?.name ?? '',
            currentClassId: student.class_id,
            nextClassName: nextClassId ? classNameMap[nextClassId] ?? null : null,
            nextClassId,
            isAssigned: !!nextClassId,
        };
    });
}

// ============================================
// 6. 학생 임시 배정
// ============================================
export async function assignStudentTemp(
    studentId: string,
    classId: string,
    year: number
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await (supabase as any)
            .from('temp_class_assignments')
            .upsert({
                student_id: studentId,
                class_id: classId,
                year,
            }, { onConflict: 'student_id,year' });

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('학생 임시 배정 실패:', error);
        return { success: false, error: String(error) };
    }
}

// ============================================
// 7. 학생 임시 배정 취소
// ============================================
export async function removeStudentTempAssignment(
    studentId: string,
    year: number
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await (supabase as any)
            .from('temp_class_assignments')
            .delete()
            .eq('student_id', studentId)
            .eq('year', year);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('학생 임시 배정 취소 실패:', error);
        return { success: false, error: String(error) };
    }
}

// ============================================
// 8. 전체 학생 자동 배정 (같은 이름의 반으로)
// ============================================
export async function autoAssignStudents(
    sourceYear: number,
    targetYear: number
): Promise<{ success: boolean; assignedCount: number; error?: string }> {
    try {
        // 현재 활성 학생과 반 정보
        const { data: students } = await supabase
            .from('students')
            .select(`
        id,
        class_id,
        classes(name, department)
      `)
            .eq('is_active', true);

        // 대상 연도 반
        const { data: targetClasses } = await supabase
            .from('classes')
            .select('id, name, department')
            .eq('year', targetYear);

        if (!students || !targetClasses) {
            return { success: false, assignedCount: 0, error: '데이터 조회 실패' };
        }

        // 반 이름+부서로 매핑
        const classMap: Record<string, string> = {};
        (targetClasses as ClassRow[]).forEach((c) => {
            classMap[`${c.department}-${c.name}`] = c.id;
        });

        // 자동 배정
        const assignments: { student_id: string; class_id: string; year: number }[] = [];
        let assignedCount = 0;

        for (const student of students as any[]) {
            const currentClass = student.classes as { name: string; department: string } | null;
            if (!currentClass) continue;

            const key = `${currentClass.department}-${currentClass.name}`;
            const targetClassId = classMap[key];

            if (targetClassId) {
                assignments.push({
                    student_id: student.id,
                    class_id: targetClassId,
                    year: targetYear,
                });
                assignedCount++;
            }
        }

        if (assignments.length > 0) {
            const { error } = await (supabase as any)
                .from('temp_class_assignments')
                .upsert(assignments, { onConflict: 'student_id,year' });

            if (error) throw error;
        }

        return { success: true, assignedCount };
    } catch (error) {
        console.error('자동 배정 실패:', error);
        return { success: false, assignedCount: 0, error: String(error) };
    }
}

// ============================================
// 9. 전환 확정 (pending 상태로 로그 생성)
// ============================================
export async function confirmTransition(
    fromYear: number,
    toYear: number,
    userId: string
): Promise<{ success: boolean; logId?: string; error?: string }> {
    try {
        // 진행 상황 확인
        const progress = await getTransitionProgress(toYear);

        if (!progress.classesCreated) {
            return { success: false, error: '새 학년도 반이 생성되지 않았습니다.' };
        }

        if (progress.assignmentProgress < 100) {
            return {
                success: false,
                error: `아직 ${progress.totalStudents - progress.assignedStudents}명의 학생이 미배정 상태입니다.`
            };
        }

        // 전환 로그 생성
        const { data, error } = await (supabase as any)
            .from('year_transition_logs')
            .insert({
                from_year: fromYear,
                to_year: toYear,
                status: 'pending',
                executed_by: userId,
                total_students: progress.totalStudents,
                assigned_students: progress.assignedStudents,
            })
            .select()
            .single();

        if (error) throw error;

        return { success: true, logId: data.id };
    } catch (error) {
        console.error('전환 확정 실패:', error);
        return { success: false, error: String(error) };
    }
}

// ============================================
// 10. 전환 실행 (실제 데이터 전환)
// ============================================
export async function executeTransition(
    logId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // 로그 조회
        const { data: log, error: logError } = await (supabase as any)
            .from('year_transition_logs')
            .select('*')
            .eq('id', logId)
            .single();

        if (logError || !log) {
            return { success: false, error: '전환 로그를 찾을 수 없습니다.' };
        }

        const typedLog = log as TransitionLogRow;
        const { from_year, to_year } = typedLog;

        // 상태 업데이트: in_progress
        await (supabase as any)
            .from('year_transition_logs')
            .update({
                status: 'in_progress',
                started_at: new Date().toISOString(),
            })
            .eq('id', logId);

        try {
            // 1. 이전 연도 반 비활성화
            await (supabase as any)
                .from('classes')
                .update({ is_active: false })
                .eq('year', from_year);

            // 2. 새 연도 반 활성화
            await (supabase as any)
                .from('classes')
                .update({ is_active: true })
                .eq('year', to_year);

            // 3. 이전 class_assignments에 end_date 설정
            await (supabase as any)
                .from('class_assignments')
                .update({ end_date: `${from_year}-12-31` })
                .eq('year', from_year)
                .is('end_date', null);

            // 4. 임시 배정 → 실제 배정으로 전환
            const { data: tempAssignments } = await (supabase as any)
                .from('temp_class_assignments')
                .select('*')
                .eq('year', to_year);

            if (tempAssignments && tempAssignments.length > 0) {
                const newAssignments = (tempAssignments as TempAssignmentRow[]).map((ta) => ({
                    student_id: ta.student_id,
                    class_id: ta.class_id,
                    year: to_year,
                    start_date: `${to_year}-01-01`,
                    end_date: null,
                }));

                await (supabase as any)
                    .from('class_assignments')
                    .upsert(newAssignments, { onConflict: 'student_id,year' });

                // 학생의 class_id도 업데이트
                for (const ta of tempAssignments as TempAssignmentRow[]) {
                    await supabase
                        .from('students')
                        .update({ class_id: ta.class_id, updated_at: new Date().toISOString() })
                        .eq('id', ta.student_id);
                }
            }

            // 5. 학년 자동 증가 및 이력 기록
            const { data: students } = await supabase
                .from('students')
                .select('id, grade, school_name')
                .eq('is_active', true);

            if (students) {
                // 학년 이력 기록
                const gradeHistories = (students as StudentRow[]).map((s) => ({
                    student_id: s.id,
                    year: to_year,
                    grade: s.grade < 6 ? s.grade + 1 : 1,
                    school_name: s.school_name,
                }));

                await (supabase as any)
                    .from('student_grade_history')
                    .upsert(gradeHistories, { onConflict: 'student_id,year' });

                // 학생 학년 증가
                for (const s of students as StudentRow[]) {
                    const newGrade = s.grade < 6 ? s.grade + 1 : 1;
                    await supabase
                        .from('students')
                        .update({ grade: newGrade, updated_at: new Date().toISOString() })
                        .eq('id', s.id);
                }
            }

            // 6. 임시 배정 테이블 정리
            await (supabase as any)
                .from('temp_class_assignments')
                .delete()
                .eq('year', to_year);

            // 상태 업데이트: completed
            await (supabase as any)
                .from('year_transition_logs')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                })
                .eq('id', logId);

            return { success: true };
        } catch (error) {
            // 실패 시 상태 업데이트
            await (supabase as any)
                .from('year_transition_logs')
                .update({
                    status: 'failed',
                    error_message: String(error),
                })
                .eq('id', logId);

            throw error;
        }
    } catch (error) {
        console.error('전환 실행 실패:', error);
        return { success: false, error: String(error) };
    }
}

// ============================================
// 11. 전환 롤백
// ============================================
export async function rollbackTransition(
    logId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const { data: log } = await (supabase as any)
            .from('year_transition_logs')
            .select('*')
            .eq('id', logId)
            .single();

        if (!log) {
            return { success: false, error: '전환 로그를 찾을 수 없습니다.' };
        }

        const typedLog = log as TransitionLogRow;

        // pending 상태만 롤백 가능
        if (typedLog.status !== 'pending') {
            return { success: false, error: '이미 실행된 전환은 롤백할 수 없습니다.' };
        }

        // 로그 상태 업데이트
        await (supabase as any)
            .from('year_transition_logs')
            .update({ status: 'rolled_back' })
            .eq('id', logId);

        return { success: true };
    } catch (error) {
        console.error('롤백 실패:', error);
        return { success: false, error: String(error) };
    }
}

// ============================================
// 12. 대상 연도 반 삭제 (전환 취소)
// ============================================
export async function deleteNextYearClasses(
    year: number
): Promise<{ success: boolean; error?: string }> {
    try {
        // 임시 배정 먼저 삭제
        await (supabase as any)
            .from('temp_class_assignments')
            .delete()
            .eq('year', year);

        // 반 삭제
        const { error } = await (supabase as any)
            .from('classes')
            .delete()
            .eq('year', year)
            .eq('is_active', false); // 비활성 반만 삭제 가능

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('반 삭제 실패:', error);
        return { success: false, error: String(error) };
    }
}
