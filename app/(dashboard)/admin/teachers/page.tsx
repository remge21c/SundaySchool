/**
 * 교사 관리 페이지
 * 관리자가 교사 목록을 확인하고 직책 및 권한을 관리하는 페이지
 */

'use client';

import { useState, useEffect } from 'react';
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
import { supabase } from '@/lib/supabase/client';
import { Users, Edit2, Save, X } from 'lucide-react';

// 직책 타입
type TeacherPosition = 'pastor' | 'director' | 'secretary' | 'treasurer' | 'teacher';
type PermissionScope = 'department' | 'class';

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
    department_id: string | null;
    department_name: string | null; // 부서명 (기본)
    department_names: string[]; // 소속 부서 목록 (담당 반에서 추출)
    created_at: string;
    assigned_classes: { id: string; name: string; department: string }[]; // 담당 반 배열 (부서 포함)
}

interface Department {
    id: string;
    name: string;
}

interface ClassInfo {
    id: string;
    name: string;
    department: string;
}

interface EditData {
    position: TeacherPosition;
    permission_scope: PermissionScope;
}

export default function TeachersPage() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [allClasses, setAllClasses] = useState<ClassInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<EditData | null>(null);
    const [saving, setSaving] = useState(false);

    // 교사 목록 조회
    const fetchTeachers = async () => {
        setLoading(true);

        // 1. 부서 목록 조회
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: deptData, error: deptError } = await (supabase.from('departments') as any)
            .select('id, name')
            .order('name', { ascending: true });

        if (deptError) {
            console.warn('부서 목록 조회 오류:', deptError);
        }
        const depts = deptData || [];
        setDepartments(depts);

        // 부서 ID -> 이름 매핑
        const deptMap: Record<string, string> = {};
        depts.forEach((d: any) => { deptMap[d.id] = d.name; });

        // 2. 반 목록 조회 (main_teacher_id 포함)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: classData } = await (supabase.from('classes') as any)
            .select('id, name, department, main_teacher_id');
        setAllClasses((classData || []).map((c: any) => ({ id: c.id, name: c.name, department: c.department })));

        // 반 ID -> 반 정보 매핑
        const classMap: Record<string, { id: string; name: string; department: string }> = {};
        (classData || []).forEach((c: any) => {
            classMap[c.id] = { id: c.id, name: c.name, department: c.department };
        });

        // 3. 교사별 담당 반 매핑 (중복 방지용 Set 사용)
        const mainTeacherClassMap: Record<string, { id: string; name: string; department: string }[]> = {};
        const addedClassIds: Record<string, Set<string>> = {}; // 교사별로 추가된 class_id 추적

        // main_teacher_id로 담당 반 추가
        (classData || []).forEach((c: any) => {
            if (c.main_teacher_id) {
                if (!mainTeacherClassMap[c.main_teacher_id]) {
                    mainTeacherClassMap[c.main_teacher_id] = [];
                    addedClassIds[c.main_teacher_id] = new Set();
                }
                if (!addedClassIds[c.main_teacher_id].has(c.id)) {
                    mainTeacherClassMap[c.main_teacher_id].push({
                        id: c.id,
                        name: c.name,
                        department: c.department
                    });
                    addedClassIds[c.main_teacher_id].add(c.id);
                }
            }
        });

        // 4. class_teachers에서 추가 담당 반 조회
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: classAssignments } = await (supabase
            .from('class_teachers') as any)
            .select('teacher_id, class_id');

        // class_teachers 매핑 추가 (중복 방지)
        (classAssignments || []).forEach((ca: any) => {
            if (ca.class_id && classMap[ca.class_id]) {
                if (!mainTeacherClassMap[ca.teacher_id]) {
                    mainTeacherClassMap[ca.teacher_id] = [];
                    addedClassIds[ca.teacher_id] = new Set();
                }
                if (!addedClassIds[ca.teacher_id]) {
                    addedClassIds[ca.teacher_id] = new Set();
                }
                if (!addedClassIds[ca.teacher_id].has(ca.class_id)) {
                    const classInfo = classMap[ca.class_id];
                    mainTeacherClassMap[ca.teacher_id].push({
                        id: classInfo.id,
                        name: classInfo.name,
                        department: classInfo.department
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

        // 6. 교사 데이터 조합 (부서는 담당 반의 부서에서 추출)
        setTeachers((profilesData || []).map((t: any) => {
            const rawClasses = mainTeacherClassMap[t.id] || [];

            // 최종 중복 제거: 부서+반이름 기준으로 유니크한 클래스만 유지 (데이터베이스에 중복된 반이 있어도 UI상 하나만 표시)
            const seenKeys = new Set<string>();
            const assignedClasses = rawClasses.filter(c => {
                const key = `${c.department}-${c.name}`;
                if (seenKeys.has(key)) return false;
                seenKeys.add(key);
                return true;
            });

            // 담당 반에서 유니크한 부서 목록 추출
            const uniqueDepartments = [...new Set(assignedClasses.map(c => c.department).filter(Boolean))];
            const derivedDepartment = uniqueDepartments.length > 0 ? uniqueDepartments[0] : null;

            return {
                ...t,
                position: t.position || 'teacher',
                permission_scope: t.permission_scope || 'class',
                department_name: derivedDepartment || (t.department_id ? deptMap[t.department_id] : null),
                department_names: uniqueDepartments,
                assigned_classes: assignedClasses.map(c => ({ id: c.id, name: c.name, department: c.department })),
            };
        }));

        setLoading(false);
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    // 편집 시작
    const startEdit = (teacher: Teacher) => {
        setEditingId(teacher.id);
        setEditData({
            position: teacher.position,
            permission_scope: teacher.permission_scope,
        });
    };

    // 편집 취소
    const cancelEdit = () => {
        setEditingId(null);
        setEditData(null);
    };

    // 저장
    const saveEdit = async (teacherId: string) => {
        if (!editData) return;

        setSaving(true);

        // 1. 프로필 업데이트
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: profileError } = await (supabase
            .from('profiles') as any)
            .update({
                position: editData.position,
                permission_scope: editData.permission_scope,
                updated_at: new Date().toISOString(),
            })
            .eq('id', teacherId);

        if (profileError) {
            console.error('프로필 저장 오류:', profileError);
            alert('저장에 실패했습니다: ' + profileError.message);
            setSaving(false);
            return;
        }

        await fetchTeachers();
        setEditingId(null);
        setEditData(null);
        setSaving(false);
    };

    return (
        <>
            <PageHeader
                title="교사 관리"
                description="교사 목록을 확인하고 직책 및 권한을 관리합니다"
            />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        교사 목록
                    </CardTitle>
                    <CardDescription>
                        총 {teachers.length}명의 교사가 등록되어 있습니다
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">로딩 중...</div>
                    ) : teachers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">등록된 교사가 없습니다</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>이름</TableHead>
                                        <TableHead>부서</TableHead>
                                        <TableHead>담당반</TableHead>
                                        <TableHead>직책</TableHead>
                                        <TableHead>권한</TableHead>
                                        <TableHead className="text-right">관리</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {teachers.map((teacher) => (
                                        <TableRow key={teacher.id}>
                                            <TableCell>
                                                <div className="font-medium">{teacher.full_name || '(이름 없음)'}</div>
                                                <div className="text-xs text-gray-500">{teacher.email}</div>
                                            </TableCell>
                                            <TableCell>
                                                {teacher.department_names.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {teacher.department_names.map((dept, idx) => (
                                                            <Badge key={idx} variant="secondary" className="text-xs">
                                                                {dept}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {teacher.assigned_classes.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {teacher.assigned_classes.map((c, idx) => (
                                                            <Badge key={idx} variant="outline" className="text-xs">
                                                                {c.department}-{c.name}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {editingId === teacher.id ? (
                                                    <Select
                                                        value={editData?.position}
                                                        onValueChange={(value) =>
                                                            setEditData((prev) => prev ? { ...prev, position: value as TeacherPosition } : null)
                                                        }
                                                    >
                                                        <SelectTrigger className="w-32">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {Object.entries(POSITION_LABELS).map(([key, label]) => (
                                                                <SelectItem key={key} value={key}>
                                                                    {label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <Badge className={POSITION_COLORS[teacher.position]}>
                                                        {POSITION_LABELS[teacher.position]}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {editingId === teacher.id ? (
                                                    <Select
                                                        value={editData?.permission_scope}
                                                        onValueChange={(value) =>
                                                            setEditData((prev) => prev ? { ...prev, permission_scope: value as PermissionScope } : null)
                                                        }
                                                    >
                                                        <SelectTrigger className="w-32">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {Object.entries(SCOPE_LABELS).map(([key, label]) => (
                                                                <SelectItem key={key} value={key}>
                                                                    {label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <span className="text-sm text-gray-600">
                                                        {SCOPE_LABELS[teacher.permission_scope]}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {editingId === teacher.id ? (
                                                    <div className="flex gap-2 justify-end">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={cancelEdit}
                                                            disabled={saving}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => saveEdit(teacher.id)}
                                                            disabled={saving}
                                                        >
                                                            <Save className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => startEdit(teacher)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
