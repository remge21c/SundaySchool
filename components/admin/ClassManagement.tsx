/**
 * 반 관리 컴포넌트
 * 반 생성, 수정, 삭제 (교사 배정은 교사 관리에서 처리)
 */

'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllClasses } from '@/lib/supabase/classes';
import {
  getAllTeachers,
  createClass,
  updateClass,
  deleteClass,
  getClassTeachers,
} from '@/lib/supabase/admin';
import { getAllDepartmentsForAdmin } from '@/lib/supabase/departments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import type { Class } from '@/types/class';

const CURRENT_YEAR = new Date().getFullYear();

interface Teacher {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
}

export function ClassManagement() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');

  // 반 목록 조회
  const {
    data: classes = [],
    isLoading: classesLoading,
    error: classesError,
  } = useQuery({
    queryKey: ['classes', 'all', CURRENT_YEAR],
    queryFn: () => getAllClasses(CURRENT_YEAR),
    retry: 1,
  });

  // 교사 목록 조회
  const {
    data: teachers = [],
    isLoading: teachersLoading,
    error: teachersError,
  } = useQuery({
    queryKey: ['admin', 'teachers'],
    queryFn: getAllTeachers,
    retry: 1,
  });

  // 부서 목록 조회
  const {
    data: departments = [],
    isLoading: departmentsLoading,
    error: departmentsError,
  } = useQuery({
    queryKey: ['departments', 'admin'],
    queryFn: getAllDepartmentsForAdmin,
    retry: 1,
  });

  // 반 생성
  const createMutation = useMutation({
    mutationFn: createClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsCreateDialogOpen(false);
    },
  });

  // 반 수정
  const updateMutation = useMutation({
    mutationFn: async ({ classId, input }: { classId: string; input: any }) => {
      await updateClass(classId, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setEditingClass(null);
    },
  });

  // 반 삭제
  const deleteMutation = useMutation({
    mutationFn: deleteClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });

  // 부서별 반 그룹화
  const classesByDepartment = (classes || []).reduce((acc, cls) => {
    if (!acc[cls.department]) {
      acc[cls.department] = [];
    }
    acc[cls.department].push(cls);
    return acc;
  }, {} as Record<string, Class[]>);

  // 부서 순서대로 반 목록 정렬
  const getDepartmentSortOrder = (departmentName: string): number => {
    const department = departments.find((dept) => dept.name === departmentName);
    return department?.sort_order ?? 999;
  };

  const sortedClasses = [...(classes || [])].sort((a, b) => {
    const orderA = getDepartmentSortOrder(a.department);
    const orderB = getDepartmentSortOrder(b.department);
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.name.localeCompare(b.name, 'ko');
  });

  const filteredClasses = selectedDepartment
    ? (classesByDepartment[selectedDepartment] || [])
    : (sortedClasses || []);

  const getTeacherName = (teacherId: string | null) => {
    if (!teacherId) return '미배정';
    const teacher = teachers.find((t: Teacher) => t.id === teacherId);
    return teacher?.full_name || teacher?.email || '알 수 없음';
  };

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const department = formData.get('department') as string;

    createMutation.mutate({
      name,
      department,
      year: CURRENT_YEAR,
      main_teacher_id: null,
    });
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingClass) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const department = formData.get('department') as string;

    updateMutation.mutate({
      classId: editingClass.id,
      input: { name, department },
    });
  };

  const handleDelete = (classId: string) => {
    if (confirm('정말 이 반을 삭제하시겠습니까? 학생 데이터도 함께 삭제됩니다.')) {
      deleteMutation.mutate(classId);
    }
  };

  if (classesLoading || teachersLoading || departmentsLoading) {
    return (
      <div className="text-center text-gray-500">
        <div className="mb-2">로딩 중...</div>
        <div className="text-sm">반 목록과 교사 목록을 불러오는 중입니다.</div>
      </div>
    );
  }

  if (classesError || teachersError || departmentsError) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-destructive">
        <div className="font-semibold mb-2">데이터를 불러오는 중 오류가 발생했습니다.</div>
        <div className="text-sm">
          {classesError && (
            <div>반 목록: {classesError instanceof Error ? classesError.message : '알 수 없는 오류'}</div>
          )}
          {teachersError && (
            <div>교사 목록: {teachersError instanceof Error ? teachersError.message : '알 수 없는 오류'}</div>
          )}
          {departmentsError && (
            <div>부서 목록: {departmentsError instanceof Error ? departmentsError.message : '알 수 없는 오류'}</div>
          )}
          <div className="mt-2 text-xs">
            관리자 권한이 올바르게 설정되었는지 확인하세요.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 필터 및 생성 버튼 */}
      <div className="flex items-center justify-between">
        <Select
          value={selectedDepartment || 'all'}
          onValueChange={(value) => setSelectedDepartment(value === 'all' ? '' : value)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="부서 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            {(departments || []).map((dept) => (
              <SelectItem key={dept.id} value={dept.name}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          반 생성
        </Button>
      </div>

      {/* 반 목록 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(filteredClasses || []).map((cls) => (
          <ClassCard
            key={cls.id}
            cls={cls}
            getTeacherName={getTeacherName}
            onEdit={() => setEditingClass(cls)}
            onDelete={() => handleDelete(cls.id)}
          />
        ))}
      </div>

      {/* 반 생성 다이얼로그 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>반 생성</DialogTitle>
            <DialogDescription>새로운 반을 생성합니다. 교사 배정은 교사 관리에서 설정하세요.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="department">부서</Label>
                <Select name="department" required>
                  <SelectTrigger>
                    <SelectValue placeholder="부서 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {(departments || []).map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">반 이름</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="예: 1반, 사랑반"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                취소
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? '생성 중...' : '생성'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 반 수정 다이얼로그 */}
      <Dialog open={!!editingClass} onOpenChange={() => setEditingClass(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>반 수정</DialogTitle>
            <DialogDescription>반 정보를 수정합니다. 교사 배정은 교사 관리에서 설정하세요.</DialogDescription>
          </DialogHeader>
          {editingClass && (
            <form onSubmit={handleUpdate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-department">부서</Label>
                  <Select
                    name="department"
                    defaultValue={editingClass.department}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(departments || []).map((dept) => (
                        <SelectItem key={dept.id} value={dept.name}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-name">반 이름</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editingClass.name}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingClass(null)}
                >
                  취소
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? '수정 중...' : '수정'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 반 카드 컴포넌트 (교사 목록 표시용)
function ClassCard({
  cls,
  getTeacherName,
  onEdit,
  onDelete,
}: {
  cls: Class;
  getTeacherName: (id: string | null) => string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { data: classTeacherIds = [] } = useQuery({
    queryKey: ['class-teachers', cls.id],
    queryFn: async () => {
      try {
        return await getClassTeachers(cls.id);
      } catch (error) {
        console.warn(`반 ${cls.id}의 교사 배정 정보를 불러올 수 없습니다:`, error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const mainTeacherName = getTeacherName(cls.main_teacher_id);
  const otherTeacherNames = Array.isArray(classTeacherIds)
    ? classTeacherIds
      .filter((id) => id && id !== cls.main_teacher_id)
      .map((id) => getTeacherName(id))
      .filter((name) => name && name !== '미배정')
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{cls.department} {cls.name}</span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          {CURRENT_YEAR}학년도
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-sm">
              담임: {mainTeacherName}
            </span>
          </div>
          {otherTeacherNames.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4 text-gray-400" />
              <span>보조: {otherTeacherNames.join(', ')}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
