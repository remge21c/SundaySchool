/**
 * 교사 관리 페이지
 * 관리자 또는 부서 전체 권한자가 교사 목록을 확인하고 직책 및 권한을 관리하는 페이지
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase/client';
import { Users, Edit2, X, Plus, Building2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// 직책 타입
type TeacherPosition = 'pastor' | 'director' | 'secretary' | 'treasurer' | 'teacher';
type PermissionScope = 'department' | 'class';
type ClassRole = 'main' | 'assistant';

// 부서별 설정 타입
interface DepartmentSetting {
    position: TeacherPosition;
    permission_scope: PermissionScope;
}

// 반별 역할 타입
interface ClassAssignment {
    classId: string;
    role: ClassRole;
}

// 직책 한글 매핑
const POSITION_LABELS: Record<TeacherPosition, string> = {
    pastor: '담당목회자',
    director: '부장',
    secretary: '총무',
    treasurer: '회계',
    teacher: '교사',
};

// 권한 범위 한글 매핑
const SCOPE_LABELS: Record<PermissionScope, string> = {
    department: '부서 전체',
    class: '담당 반',
};

// 반 역할 한글 매핑
const ROLE_LABELS: Record<ClassRole, string> = {
    main: '담임',
    assistant: '보조',
};

// 직책별 배지 색상
const POSITION_COLORS: Record<TeacherPosition, string> = {
    pastor: 'bg-purple-100 text-purple-700',
    director: 'bg-blue-100 text-blue-700',
    secretary: 'bg-green-100 text-green-700',
    treasurer: 'bg-amber-100 text-amber-700',
    teacher: 'bg-gray-100 text-gray-700',
};

interface Teacher {
    id: string;
    email: string;
    full_name: string | null;
    phone_number: string | null;
    position: TeacherPosition;
    permission_scope: PermissionScope;
    department_permissions: Record<string, DepartmentSetting>;
    department_id: string | null;
    department_name: string | null;
    department_names: string[];
    created_at: string;
    assigned_classes: { id: string; name: string; department: string; isMain: boolean }[];
    status?: 'pending' | 'approved' | 'rejected';
}

interface Department {
    id: string;
    name: string;
    sort_order: number;
}

interface ClassInfo {
    id: string;
    name: string;
    department: string;
    main_teacher_id: string | null;
}

interface EditData {
    classAssignments: ClassAssignment[];
    departmentSettings: Record<string, DepartmentSetting>;
}

interface CurrentUserProfile {
    id: string;
    role: string;
    department_permissions: Record<string, DepartmentSetting>;
}

export default function TeachersPage() {
    const { user } = useAuth();
    const [currentUserProfile, setCurrentUserProfile] = useState<CurrentUserProfile | null>(null);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [allClasses, setAllClasses] = useState<ClassInfo[]>([]);
    const [loading, setLoading] = useState(true);

    // 부서 필터 상태
    const [selectedDeptFilter, setSelectedDeptFilter] = useState<string | null>(null);

    // Dialog 상태
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
    const [editData, setEditData] = useState<EditData | null>(null);
    const [editingDeptFilter, setEditingDeptFilter] = useState<string | null>(null); // 수정 중인 부서
    const [saving, setSaving] = useState(false);

    // 반 추가용 상태
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [selectedClassId, setSelectedClassId] = useState<string>('');

    // 현재 사용자가 관리자인지 확인
    const isAdmin = currentUserProfile?.role === 'admin';

    // 현재 사용자의 부서 전체 권한 범위 (수정 가능한 부서)
    const myDepartmentScope = useMemo(() => {
        if (!currentUserProfile || isAdmin) return [];
        const depts: string[] = [];
        Object.entries(currentUserProfile.department_permissions || {}).forEach(([dept, setting]) => {
            if (typeof setting === 'object' && setting.permission_scope === 'department') {
                depts.push(dept);
            }
        });
        return depts;
    }, [currentUserProfile, isAdmin]);

    // 사이드바에 표시할 부서 목록 (관리자: 전체, 비관리자: 부서 전체 권한이 있는 부서만)
    const visibleDepartments = useMemo(() => {
        if (isAdmin) {
            return departments;
        }
        return departments.filter(d => myDepartmentScope.includes(d.name));
    }, [departments, isAdmin, myDepartmentScope]);

    // 선택된 부서에 해당하는 반 목록 (이름순 정렬)
    const filteredClasses = useMemo(() => {
        if (!selectedDepartment) return [];
        return allClasses
            .filter(c => c.department === selectedDepartment)
            .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    }, [selectedDepartment, allClasses]);

    // 기존 데이터 형식을 새 형식으로 변환하는 헬퍼
    const migrateDepartmentPermissions = (
        oldPerms: Record<string, any>,
        defaultPosition: TeacherPosition,
        defaultScope: PermissionScope
    ): Record<string, DepartmentSetting> => {
        const result: Record<string, DepartmentSetting> = {};
        Object.entries(oldPerms || {}).forEach(([dept, value]) => {
            if (typeof value === 'string') {
                result[dept] = {
                    position: defaultPosition,
                    permission_scope: value as PermissionScope,
                };
            } else if (typeof value === 'object' && value !== null) {
                result[dept] = {
                    position: value.position || defaultPosition,
                    permission_scope: value.permission_scope || defaultScope,
                };
            }
        });
        return result;
    };

    // 현재 사용자 프로필 조회
    useEffect(() => {
        const fetchCurrentUserProfile = async () => {
            if (!user?.id) return;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data } = await (supabase.from('profiles') as any)
                .select('id, role, department_permissions')
                .eq('id', user.id)
                .single();

            if (data) {
                setCurrentUserProfile({
                    id: data.id,
                    role: data.role,
                    department_permissions: data.department_permissions || {},
                });
            }
        };

        fetchCurrentUserProfile();
    }, [user?.id]);

    // 교사 목록 조회
    const fetchTeachers = async () => {
        setLoading(true);

        // 1. 부서 목록 조회
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: deptData, error: deptError } = await (supabase.from('departments') as any)
            .select('id, name, sort_order')
            .order('sort_order', { ascending: true });

        if (deptError) {
            console.warn('부서 목록 조회 오류:', deptError);
        }
        const depts = deptData || [];
        setDepartments(depts);

        const deptMap: Record<string, string> = {};
        depts.forEach((d: any) => { deptMap[d.id] = d.name; });

        // 2. 반 목록 조회
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: classData } = await (supabase.from('classes') as any)
            .select('id, name, department, main_teacher_id');
        setAllClasses((classData || []).map((c: any) => ({
            id: c.id,
            name: c.name,
            department: c.department,
            main_teacher_id: c.main_teacher_id
        })));

        const classMap: Record<string, ClassInfo> = {};
        (classData || []).forEach((c: any) => {
            classMap[c.id] = { id: c.id, name: c.name, department: c.department, main_teacher_id: c.main_teacher_id };
        });

        // 3. 교사별 담당 반 매핑
        const teacherClassMap: Record<string, { id: string; name: string; department: string; isMain: boolean }[]> = {};
        const addedClassIds: Record<string, Set<string>> = {};

        (classData || []).forEach((c: any) => {
            if (c.main_teacher_id) {
                if (!teacherClassMap[c.main_teacher_id]) {
                    teacherClassMap[c.main_teacher_id] = [];
                    addedClassIds[c.main_teacher_id] = new Set();
                }
                if (!addedClassIds[c.main_teacher_id].has(c.id)) {
                    teacherClassMap[c.main_teacher_id].push({
                        id: c.id,
                        name: c.name,
                        department: c.department,
                        isMain: true,
                    });
                    addedClassIds[c.main_teacher_id].add(c.id);
                }
            }
        });

        // 4. class_teachers에서 보조 교사 조회
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: classAssignments } = await (supabase
            .from('class_teachers') as any)
            .select('teacher_id, class_id');

        (classAssignments || []).forEach((ca: any) => {
            if (ca.class_id && classMap[ca.class_id]) {
                if (!teacherClassMap[ca.teacher_id]) {
                    teacherClassMap[ca.teacher_id] = [];
                    addedClassIds[ca.teacher_id] = new Set();
                }
                if (!addedClassIds[ca.teacher_id]) {
                    addedClassIds[ca.teacher_id] = new Set();
                }
                if (!addedClassIds[ca.teacher_id].has(ca.class_id)) {
                    const classInfo = classMap[ca.class_id];
                    teacherClassMap[ca.teacher_id].push({
                        id: classInfo.id,
                        name: classInfo.name,
                        department: classInfo.department,
                        isMain: false,
                    });
                    addedClassIds[ca.teacher_id].add(ca.class_id);
                }
            }
        });

        // 5. 교사 프로필 조회
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profilesData, error: profilesError } = await (supabase
            .from('profiles') as any)
            .select('*')
            .in('role', ['teacher', 'admin'])
            .order('created_at', { ascending: false });

        if (profilesError) {
            console.error('교사 목록 조회 오류:', profilesError);
            setLoading(false);
            return;
        }

        // 6. 교사 데이터 조합
        setTeachers((profilesData || []).map((t: any) => {
            const rawClasses = teacherClassMap[t.id] || [];

            const seenKeys = new Set<string>();
            const assignedClasses = rawClasses.filter(c => {
                const key = `${c.department}-${c.name}`;
                if (seenKeys.has(key)) return false;
                seenKeys.add(key);
                return true;
            });

            const uniqueDepartments = [...new Set(assignedClasses.map(c => c.department).filter(Boolean))];
            const derivedDepartment = uniqueDepartments.length > 0 ? uniqueDepartments[0] : null;

            const defaultPosition = t.position || 'teacher';
            const defaultScope = t.permission_scope || 'class';
            const deptPerms = migrateDepartmentPermissions(
                t.department_permissions || {},
                defaultPosition,
                defaultScope
            );

            return {
                ...t,
                position: defaultPosition,
                permission_scope: defaultScope,
                department_permissions: deptPerms,
                department_name: derivedDepartment || (t.department_id ? deptMap[t.department_id] : null),
                department_names: uniqueDepartments,
                assigned_classes: assignedClasses,
            };
        }));

        setLoading(false);
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    // 교사가 내 권한 범위에 해당하는지 확인
    const canEditTeacher = (teacher: Teacher): boolean => {
        if (isAdmin) return true;
        if (myDepartmentScope.length === 0) return false;
        return teacher.department_names.some(dept => myDepartmentScope.includes(dept));
    };

    // 필터된 교사 목록 (부서 전체 권한 기준 + 부서 필터)
    const visibleTeachers = useMemo(() => {
        let result = teachers;

        // 1. 부서 전체 권한이 있는 부서의 교사만 표시
        if (!isAdmin && myDepartmentScope.length > 0) {
            result = result.filter(t =>
                t.department_names.some(dept => myDepartmentScope.includes(dept))
            );
        } else if (!isAdmin) {
            result = [];
        }

        // 2. 부서 필터 (사이드바에서 선택한 부서)
        if (selectedDeptFilter) {
            result = result.filter(t => t.department_names.includes(selectedDeptFilter));
        }

        return result;
    }, [teachers, isAdmin, myDepartmentScope, selectedDeptFilter]);

    // 편집 시작 (선택된 부서 필터 전달)
    const startEdit = (teacher: Teacher, deptFilter: string | null) => {
        const currentDepts = [...new Set(teacher.assigned_classes.map(c => c.department))];
        const initialSettings: Record<string, DepartmentSetting> = {};
        currentDepts.forEach(dept => {
            initialSettings[dept] = teacher.department_permissions[dept] || {
                position: teacher.position || 'teacher',
                permission_scope: teacher.permission_scope || 'class',
            };
        });

        const initialAssignments: ClassAssignment[] = teacher.assigned_classes.map(c => ({
            classId: c.id,
            role: c.isMain ? 'main' : 'assistant',
        }));

        setEditingTeacher(teacher);
        setEditingDeptFilter(deptFilter); // 수정 중인 부서 설정
        setEditData({
            classAssignments: initialAssignments,
            departmentSettings: initialSettings,
        });
        setSelectedDepartment(deptFilter || '');
        setSelectedClassId('');
    };

    // 편집 취소
    const cancelEdit = () => {
        setEditingTeacher(null);
        setEditData(null);
        setEditingDeptFilter(null);
        setSelectedDepartment('');
        setSelectedClassId('');
    };

    // 반 추가
    const addClassToList = () => {
        if (!selectedClassId || !editData) return;
        if (editData.classAssignments.some(a => a.classId === selectedClassId)) {
            alert('이미 추가된 반입니다.');
            return;
        }

        const newClass = allClasses.find(c => c.id === selectedClassId);
        const newSettings = { ...editData.departmentSettings };
        if (newClass && !newSettings[newClass.department]) {
            newSettings[newClass.department] = {
                position: 'teacher',
                permission_scope: 'class',
            };
        }

        setEditData({
            ...editData,
            classAssignments: [...editData.classAssignments, { classId: selectedClassId, role: 'assistant' }],
            departmentSettings: newSettings,
        });
        setSelectedClassId('');
    };

    // 반 제거
    const removeClassFromList = (classId: string) => {
        if (!editData) return;
        const removedClass = allClasses.find(c => c.id === classId);
        const newAssignments = editData.classAssignments.filter(a => a.classId !== classId);

        const newSettings = { ...editData.departmentSettings };
        if (removedClass) {
            const remainingInDept = newAssignments.filter(a => {
                const cls = allClasses.find(c => c.id === a.classId);
                return cls?.department === removedClass.department;
            });
            if (remainingInDept.length === 0) {
                delete newSettings[removedClass.department];
            }
        }

        setEditData({
            ...editData,
            classAssignments: newAssignments,
            departmentSettings: newSettings,
        });
    };

    // 반 역할 변경
    const updateClassRole = (classId: string, role: ClassRole) => {
        if (!editData) return;
        setEditData({
            ...editData,
            classAssignments: editData.classAssignments.map(a =>
                a.classId === classId ? { ...a, role } : a
            ),
        });
    };

    // 반 변경 (같은 부서 내 다른 반으로 변경)
    const updateClassId = (oldClassId: string, newClassId: string, dept: string) => {
        if (!editData) return;
        if (oldClassId === newClassId) return;
        // 이미 존재하는 반인지 확인
        if (editData.classAssignments.some(a => a.classId === newClassId)) {
            alert('이미 추가된 반입니다.');
            return;
        }
        const oldAssignment = editData.classAssignments.find(a => a.classId === oldClassId);
        if (!oldAssignment) return;

        setEditData({
            ...editData,
            classAssignments: editData.classAssignments.map(a =>
                a.classId === oldClassId ? { ...a, classId: newClassId } : a
            ),
        });
    };

    // 부서별 설정 변경
    const updateDepartmentSetting = (
        dept: string,
        field: keyof DepartmentSetting,
        value: TeacherPosition | PermissionScope
    ) => {
        if (!editData) return;
        setEditData({
            ...editData,
            departmentSettings: {
                ...editData.departmentSettings,
                [dept]: {
                    ...editData.departmentSettings[dept],
                    [field]: value,
                },
            },
        });
    };

    // 저장
    const saveEdit = async () => {
        if (!editingTeacher || !editData) return;

        setSaving(true);

        try {
            // 1. 프로필 업데이트 (RPC 사용)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: profileError } = await (supabase.rpc('update_teacher_department_permissions', {
                target_teacher_id: editingTeacher.id,
                new_permissions: editData.departmentSettings
            } as any));

            if (profileError) {
                console.error('프로필 저장 오류:', profileError);
                // "function not found" 에러인 경우 마이그레이션 안내
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if ((profileError as any).message?.includes('function') && (profileError as any).message?.includes('not found')) {
                    alert('서버 함수를 찾을 수 없습니다. 마이그레이션(045)이 실행되었는지 확인해주세요.');
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    alert('저장에 실패했습니다: ' + (profileError as any).message);
                }
                setSaving(false);
                return;
            }

            // --- 반 배정 업데이트 (권한이 있는 부서에 대해서만 수행) ---

            // 내가 관리 가능한 반 ID 목록 추출
            const manageableClassIds = isAdmin
                ? allClasses.map(c => c.id)
                : allClasses.filter(c => myDepartmentScope.includes(c.department)).map(c => c.id);

            console.log('Manageable Class IDs:', manageableClassIds);
            console.log('Sending Department Settings to RPC:', editData.departmentSettings);

            if (manageableClassIds.length === 0) {
                console.log('No classes to manage (only modifying permissions?)');
                // 관리 가능한 반이 없으면(부서 권한만 수정하는 경우 등) 여기서 종료해도 되지만, 
                // 목록 갱신을 위해 아래로 진행
            } else {
                console.log('Removing assignments for manageable classes...');

                // 2. 권한 범위 내의 기존 main_teacher_id 해제
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { error: clearMainError } = await (supabase
                    .from('classes') as any)
                    .update({ main_teacher_id: null })
                    .eq('main_teacher_id', editingTeacher.id)
                    .in('id', manageableClassIds); // 내 권한 범위 내 반만 건드림

                if (clearMainError) console.error('Error clearing main teacher:', clearMainError);

                // 3. 권한 범위 내의 class_teachers 레코드 삭제
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { error: deleteTeacherError } = await (supabase
                    .from('class_teachers') as any)
                    .delete()
                    .eq('teacher_id', editingTeacher.id)
                    .in('class_id', manageableClassIds); // 내 권한 범위 내 반만 건드림

                if (deleteTeacherError) console.error('Error deleting class teachers:', deleteTeacherError);

                // 4. 새로운 배정 적용 (권한 범위 내의 반만)
                // editData에는 모든 배정이 들어있으므로, 내 권한 범위에 해당하는 것만 필터링해서 적용
                const assignmentsToApply = editData.classAssignments.filter(a => manageableClassIds.includes(a.classId));
                console.log('Applying assignments:', assignmentsToApply);

                for (const assignment of assignmentsToApply) {
                    if (assignment.role === 'main') {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        await (supabase
                            .from('classes') as any)
                            .update({ main_teacher_id: editingTeacher.id })
                            .eq('id', assignment.classId);
                    } else {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        await (supabase
                            .from('class_teachers') as any)
                            .insert({ class_id: assignment.classId, teacher_id: editingTeacher.id });
                    }
                }
            }

            // 5. 목록 갱신
            await fetchTeachers();

            cancelEdit();
        } catch (error: any) {
            console.error('저장 오류:', error);
            alert('저장에 실패했습니다: ' + (error?.message || '알 수 없는 오류'));
        } finally {
            setSaving(false);
        }
    };



    // 교사 승인
    const approveTeacher = async (teacherId: string) => {
        if (!confirm('이 교사의 가입을 승인하시겠습니까?')) return;

        try {
            const { error } = await (supabase
                .from('profiles') as any)
                .update({ status: 'approved' })
                .eq('id', teacherId);

            if (error) throw error;

            // 목록 갱신
            setTeachers(teachers.map(t =>
                t.id === teacherId ? { ...t, status: 'approved' } : t
            ));
            alert('승인되었습니다.');
        } catch (error: any) {
            console.error('승인 오류:', error);
            alert('승인 처리에 실패했습니다: ' + error.message);
        }
    };

    // 교사 삭제 (프로필 삭제)
    const deleteTeacher = async (teacherId: string) => {
        if (!confirm('정말로 이 교사를 삭제하시겠습니까?\n삭제된 계정은 복구할 수 없으며, 모든 권한과 배정이 사라집니다.')) return;

        try {
            // 1. 프로필 삭제
            const { error } = await (supabase
                .from('profiles') as any)
                .delete()
                .eq('id', teacherId);

            if (error) throw error;

            // 목록 갱신
            setTeachers(teachers.filter(t => t.id !== teacherId));
            alert('삭제되었습니다.');
        } catch (error: any) {
            console.error('삭제 오류:', error);
            alert('삭제 처리에 실패했습니다: ' + error.message);
        }
    };

    // 현재 편집 중인 부서별 반 그룹 + 설정만 있는 부서
    const groupedAssignedClasses = useMemo(() => {
        if (!editData) return {};
        const groups: Record<string, { cls: ClassInfo; role: ClassRole }[]> = {};

        // 1. 반 배정이 있는 부서 처리
        editData.classAssignments.forEach(a => {
            const cls = allClasses.find(c => c.id === a.classId);
            if (cls) {
                if (!groups[cls.department]) groups[cls.department] = [];
                groups[cls.department].push({ cls, role: a.role });
            }
        });

        // 2. 반 배정은 없지만 부서 설정이 있는 경우 처리
        Object.keys(editData.departmentSettings).forEach(dept => {
            if (!groups[dept]) {
                groups[dept] = [];
            }
        });

        return groups;
    }, [editData, allClasses]);

    // 부서 배정 삭제 (반 배정 및 권한 설정 모두 제거)
    const removeDepartment = (dept: string) => {
        console.log('=== removeDepartment called ===');
        console.log('Department to remove:', dept);
        console.log('Current editData:', editData);

        if (!editData) {
            console.log('editData is null, returning early');
            return;
        }

        // confirm 제거 - 취소 버튼으로 되돌릴 수 있음
        // if (!confirm(`'${dept}'의 모든 배정(직책, 담당 반)을 삭제하시겠습니까?`)) {
        //     console.log('User cancelled the confirmation');
        //     return;
        // }

        // 해당 부서의 반 배정 제거
        const newClassAssignments = editData.classAssignments.filter(a => {
            const cls = allClasses.find(c => c.id === a.classId);
            return cls?.department !== dept;
        });

        // 부서 설정 제거
        const newSettings = { ...editData.departmentSettings };
        delete newSettings[dept];

        console.log('New class assignments:', newClassAssignments);
        console.log('New department settings:', newSettings);

        setEditData({
            classAssignments: newClassAssignments,
            departmentSettings: newSettings,
        });

        console.log('editData state updated. Remember to click SAVE button!');

        // 만약 현재 수정 중이던 부서라면 선택 해제 또는 다른 동작
        if (selectedDepartment === dept) {
            setSelectedDepartment('');
            setSelectedClassId('');
        }
    };

    // 편집 다이얼로그에서 수정 가능한 부서
    const editableDepartments = useMemo(() => {
        if (isAdmin) return Object.keys(groupedAssignedClasses);
        return Object.keys(groupedAssignedClasses).filter(dept => myDepartmentScope.includes(dept));
    }, [groupedAssignedClasses, isAdmin, myDepartmentScope]);

    // 반 추가 드롭다운용 부서 목록
    const uniqueDepartments = useMemo(() => {
        const deptSet = new Set(allClasses.map(c => c.department));
        const allDepts = Array.from(deptSet);
        if (isAdmin) return allDepts;
        return allDepts.filter(dept => myDepartmentScope.includes(dept));
    }, [allClasses, isAdmin, myDepartmentScope]);

    if (loading || !currentUserProfile) {
        return (
            <>
                <PageHeader
                    title="교사 관리"
                    description="교사 목록을 확인하고 직책 및 권한을 관리합니다"
                />
                <div className="text-center py-8 text-gray-500">로딩 중...</div>
            </>
        );
    }

    return (
        <>
            <PageHeader
                title="교사 관리"
                description={isAdmin
                    ? "교사 목록을 확인하고 직책 및 권한을 관리합니다"
                    : `내 부서의 교사를 관리합니다`
                }
            />

            {/* 모바일: 부서 선택 목록 */}
            <div className="md:hidden mb-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            부서
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2">
                        <div className="space-y-1">
                            <button
                                onClick={() => setSelectedDeptFilter(null)}
                                className={cn(
                                    'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                                    selectedDeptFilter === null
                                        ? 'bg-blue-100 text-blue-700 font-medium'
                                        : 'hover:bg-gray-100 text-gray-700'
                                )}
                            >
                                전체 ({visibleTeachers.length})
                            </button>
                            {visibleDepartments.map((dept) => {
                                const count = teachers.filter(t => t.department_names.includes(dept.name)).length;
                                return (
                                    <button
                                        key={dept.id}
                                        onClick={() => setSelectedDeptFilter(dept.name)}
                                        className={cn(
                                            'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                                            selectedDeptFilter === dept.name
                                                ? 'bg-blue-100 text-blue-700 font-medium'
                                                : 'hover:bg-gray-100 text-gray-700'
                                        )}
                                    >
                                        {dept.name} ({count})
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 좌우 분할 레이아웃 */}
            <div className="flex gap-4">
                {/* 왼쪽: 부서 사이드바 (데스크톱만) */}
                <div className="hidden md:block w-48 flex-shrink-0">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                부서
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-2">
                            <div className="space-y-1">
                                <button
                                    onClick={() => setSelectedDeptFilter(null)}
                                    className={cn(
                                        'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                                        selectedDeptFilter === null
                                            ? 'bg-blue-100 text-blue-700 font-medium'
                                            : 'hover:bg-gray-100 text-gray-700'
                                    )}
                                >
                                    전체 ({visibleTeachers.length})
                                </button>
                                {visibleDepartments.map((dept) => {
                                    const count = teachers.filter(t => t.department_names.includes(dept.name)).length;
                                    return (
                                        <button
                                            key={dept.id}
                                            onClick={() => setSelectedDeptFilter(dept.name)}
                                            className={cn(
                                                'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                                                selectedDeptFilter === dept.name
                                                    ? 'bg-blue-100 text-blue-700 font-medium'
                                                    : 'hover:bg-gray-100 text-gray-700'
                                            )}
                                        >
                                            {dept.name} ({count})
                                        </button>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 오른쪽: 교사 목록 */}
                <div className="flex-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                {selectedDeptFilter ? `${selectedDeptFilter} 교사` : '전체 교사'}
                            </CardTitle>
                            <CardDescription>
                                {visibleTeachers.length}명
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {visibleTeachers.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    {selectedDeptFilter
                                        ? `${selectedDeptFilter}에 배정된 교사가 없습니다`
                                        : '교사가 없습니다'
                                    }
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>이름</TableHead>
                                                <TableHead>부서별 정보</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {visibleTeachers.map((teacher) => (
                                                <TableRow
                                                    key={teacher.id}
                                                    className="cursor-pointer hover:bg-gray-50"
                                                    onClick={() => canEditTeacher(teacher) && startEdit(teacher, selectedDeptFilter)}
                                                >
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className="font-medium">{teacher.full_name || '(이름 없음)'}</div>
                                                            {teacher.status === 'pending' && (
                                                                <Badge variant="destructive" className="text-[10px] h-5">승인대기</Badge>
                                                            )}
                                                            {teacher.status === 'approved' && (
                                                                <Badge variant="outline" className="text-[10px] h-5 bg-green-50 text-green-700 border-green-300">승인됨</Badge>
                                                            )}
                                                            {teacher.status === 'rejected' && (
                                                                <Badge variant="secondary" className="text-[10px] h-5 bg-gray-100 text-gray-500">거절됨</Badge>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-500">{teacher.email}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {(() => {
                                                            // 부서 순서 맵 생성
                                                            const deptOrderMap: Record<string, number> = {};
                                                            departments.forEach((d, idx) => {
                                                                deptOrderMap[d.name] = d.sort_order ?? idx;
                                                            });

                                                            // 권한이 있는 부서만 필터링 (관리자는 전체, 비관리자는 myDepartmentScope)
                                                            let deptsToShow = isAdmin
                                                                ? teacher.department_names
                                                                : teacher.department_names.filter(d => myDepartmentScope.includes(d));

                                                            // 선택된 부서 필터가 있으면 그 부서만 표시
                                                            if (selectedDeptFilter) {
                                                                deptsToShow = deptsToShow.filter(d => d === selectedDeptFilter);
                                                            }

                                                            // 부서 순서대로 정렬
                                                            deptsToShow = [...deptsToShow].sort((a, b) => {
                                                                const orderA = deptOrderMap[a] ?? 999;
                                                                const orderB = deptOrderMap[b] ?? 999;
                                                                return orderA - orderB;
                                                            });

                                                            if (deptsToShow.length === 0) {
                                                                return <span className="text-gray-400 text-sm">배정된 부서 없음</span>;
                                                            }

                                                            return (
                                                                <div className="space-y-2">
                                                                    {deptsToShow.map((dept, idx) => {
                                                                        const setting = teacher.department_permissions[dept] || {
                                                                            position: teacher.position,
                                                                            permission_scope: teacher.permission_scope,
                                                                        };
                                                                        const deptClasses = teacher.assigned_classes.filter(c => c.department === dept);
                                                                        return (
                                                                            <div key={idx} className="flex flex-wrap items-center gap-2 text-sm">
                                                                                <Badge variant="secondary">{dept}</Badge>
                                                                                <Badge className={POSITION_COLORS[setting.position]}>
                                                                                    {POSITION_LABELS[setting.position]}
                                                                                </Badge>
                                                                                <span className="text-gray-500 text-xs">
                                                                                    {SCOPE_LABELS[setting.permission_scope]}
                                                                                </span>
                                                                                <span className="text-gray-400">|</span>
                                                                                {deptClasses.map((c, cIdx) => (
                                                                                    <Badge
                                                                                        key={cIdx}
                                                                                        variant="outline"
                                                                                        className={`text-xs ${c.isMain ? 'border-blue-400 text-blue-600' : ''}`}
                                                                                    >
                                                                                        {c.name} ({c.isMain ? '담임' : '보조'})
                                                                                    </Badge>
                                                                                ))}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            );
                                                        })()}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* 교사 수정 다이얼로그 */}
            <Dialog open={!!editingTeacher} onOpenChange={(open) => !open && !saving && cancelEdit()}>
                <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>교사 정보 수정</DialogTitle>
                        <DialogDescription>
                            {editingTeacher?.full_name || '(이름 없음)'} ({editingTeacher?.email})
                            {!isAdmin && <span className="block text-xs mt-1">내 부서 범위 내에서만 수정 가능합니다.</span>}
                        </DialogDescription>
                    </DialogHeader>

                    {editData && (
                        <div className="space-y-6 py-4">
                            <div className="space-y-3">
                                <Label>부서별 직책, 권한 및 담당 반</Label>

                                <div className="space-y-4">
                                    {Object.keys(groupedAssignedClasses).length === 0 ? (
                                        <p className="text-sm text-gray-500">배정된 반이 없습니다.</p>
                                    ) : (
                                        Object.entries(groupedAssignedClasses)
                                            .sort(([deptA], [deptB]) => {
                                                // 부서 순서(sort_order)에 따라 정렬
                                                const orderA = departments.find(d => d.name === deptA)?.sort_order ?? 999;
                                                const orderB = departments.find(d => d.name === deptB)?.sort_order ?? 999;
                                                return orderA - orderB;
                                            })
                                            .map(([dept, items]) => {
                                                const setting = editData.departmentSettings[dept] || {
                                                    position: 'teacher',
                                                    permission_scope: 'class',
                                                };
                                                // 부서 필터가 선택된 경우: 해당 부서만 수정 가능
                                                // 부서 필터가 없는 경우: 권한에 따라 수정 가능
                                                const isEditable = editingDeptFilter
                                                    ? (dept === editingDeptFilter && (isAdmin || myDepartmentScope.includes(dept)))
                                                    : (isAdmin || myDepartmentScope.includes(dept));
                                                return (
                                                    <div key={dept} className={`border rounded-lg p-3 ${isEditable ? 'bg-gray-50' : 'bg-gray-100 opacity-60'}`}>
                                                        <div className="flex items-center gap-2 mb-3 pb-2 border-b justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-semibold text-sm">{dept}</span>
                                                                {!isEditable && <span className="text-xs text-gray-500">(수정 불가)</span>}
                                                            </div>

                                                            {isEditable && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                                                    onClick={() => removeDepartment(dept)}
                                                                    title="이 부서 배정 삭제"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                                            <div>
                                                                <Label className="text-xs text-gray-500">직책</Label>
                                                                <Select
                                                                    value={setting.position}
                                                                    onValueChange={(value) => updateDepartmentSetting(dept, 'position', value as TeacherPosition)}
                                                                    disabled={saving || !isEditable}
                                                                >
                                                                    <SelectTrigger className="h-8 text-sm">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {Object.entries(POSITION_LABELS).map(([key, label]) => (
                                                                            <SelectItem key={key} value={key} className="text-sm">
                                                                                {label}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div>
                                                                <Label className="text-xs text-gray-500">권한</Label>
                                                                <Select
                                                                    value={setting.permission_scope}
                                                                    onValueChange={(value) => updateDepartmentSetting(dept, 'permission_scope', value as PermissionScope)}
                                                                    disabled={saving || !isEditable}
                                                                >
                                                                    <SelectTrigger className="h-8 text-sm">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {Object.entries(SCOPE_LABELS).map(([key, label]) => (
                                                                            <SelectItem key={key} value={key} className="text-sm">
                                                                                {label}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-1">
                                                            <Label className="text-xs text-gray-500">담당 반</Label>
                                                            {items.map(({ cls, role }) => {
                                                                // 해당 부서의 전체 반 목록
                                                                const deptClasses = allClasses.filter(c => c.department === dept);
                                                                return (
                                                                    <div
                                                                        key={cls.id}
                                                                        className="flex items-center justify-between py-1 px-2 bg-white rounded border"
                                                                    >
                                                                        {/* 반 선택 드롭다운 */}
                                                                        <Select
                                                                            value={cls.id}
                                                                            onValueChange={(value) => updateClassId(cls.id, value, dept)}
                                                                            disabled={saving || !isEditable}
                                                                        >
                                                                            <SelectTrigger className="h-7 flex-1 text-sm mr-2">
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                {deptClasses.map((c) => (
                                                                                    <SelectItem key={c.id} value={c.id} className="text-sm">
                                                                                        {c.name}
                                                                                    </SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                        {/* 역할 선택 */}
                                                                        <Select
                                                                            value={role}
                                                                            onValueChange={(value) => updateClassRole(cls.id, value as ClassRole)}
                                                                            disabled={saving || !isEditable}
                                                                        >
                                                                            <SelectTrigger className="h-7 w-20 text-xs">
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                                                                                    <SelectItem key={key} value={key} className="text-xs">
                                                                                        {label}
                                                                                    </SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                        {isEditable && (
                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                className="h-6 w-6 p-0 ml-1 text-gray-400 hover:text-red-500"
                                                                                onClick={() => removeClassFromList(cls.id)}
                                                                                disabled={saving}
                                                                            >
                                                                                <X className="h-3 w-3" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                    )}
                                </div>

                                {uniqueDepartments.length > 0 && (
                                    <div className="pt-3 border-t">
                                        <p className="text-sm font-medium mb-2">반 추가</p>
                                        <div className="flex gap-2">
                                            <Select
                                                value={selectedDepartment}
                                                onValueChange={(value) => {
                                                    setSelectedDepartment(value);
                                                    setSelectedClassId('');
                                                }}
                                                disabled={saving}
                                            >
                                                <SelectTrigger className="flex-1">
                                                    <SelectValue placeholder="부서" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {uniqueDepartments.map((dept) => (
                                                        <SelectItem key={dept} value={dept}>
                                                            {dept}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            <Select
                                                value={selectedClassId}
                                                onValueChange={setSelectedClassId}
                                                disabled={saving || !selectedDepartment}
                                            >
                                                <SelectTrigger className="flex-1">
                                                    <SelectValue placeholder="반" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {filteredClasses.map((cls) => (
                                                        <SelectItem key={cls.id} value={cls.id}>
                                                            {cls.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            <Button
                                                size="sm"
                                                onClick={addClassToList}
                                                disabled={saving || !selectedClassId}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex justify-between sm:justify-between">
                        {isAdmin && editingTeacher && (
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    if (editingTeacher) {
                                        deleteTeacher(editingTeacher.id);
                                        cancelEdit();
                                    }
                                }}
                                disabled={saving}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                삭제
                            </Button>
                        )}
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={cancelEdit} disabled={saving}>
                                취소
                            </Button>
                            <Button onClick={saveEdit} disabled={saving}>
                                {saving ? '저장 중...' : '저장'}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog >
        </>
    );
}
