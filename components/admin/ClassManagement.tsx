/**
 * 반 관리 컴포넌트
 * 반 생성, 수정, 삭제 및 교사 배정
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
  assignTeacherToClass,
} from '@/lib/supabase/admin';
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

const DEPARTMENTS = ['유년부', '초등부', '중등부', '고등부'];
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
    mutationFn: ({ classId, input }: { classId: string; input: any }) =>
      updateClass(classId, input),
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

  // 교사 배정
  const assignTeacherMutation = useMutation({
    mutationFn: ({ classId, teacherId }: { classId: string; teacherId: string | null }) =>
      assignTeacherToClass(classId, teacherId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });

  // 부서별 반 그룹화
  const classesByDepartment = classes.reduce((acc, cls) => {
    if (!acc[cls.department]) {
      acc[cls.department] = [];
    }
    acc[cls.department].push(cls);
    return acc;
  }, {} as Record<string, Class[]>);

  const filteredClasses = selectedDepartment
    ? classesByDepartment[selectedDepartment] || []
    : classes;

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
    const main_teacher_id_raw = formData.get('main_teacher_id') as string;
    const main_teacher_id = main_teacher_id_raw && main_teacher_id_raw !== 'unassigned' ? main_teacher_id_raw : null;

    createMutation.mutate({
      name,
      department,
      year: CURRENT_YEAR,
      main_teacher_id,
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingClass) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const department = formData.get('department') as string;
    const main_teacher_id_raw = formData.get('main_teacher_id') as string;
    const main_teacher_id = main_teacher_id_raw && main_teacher_id_raw !== 'unassigned' ? main_teacher_id_raw : null;

    updateMutation.mutate({
      classId: editingClass.id,
      input: { name, department, main_teacher_id },
    });
  };

  const handleDelete = (classId: string) => {
    if (confirm('정말 이 반을 삭제하시겠습니까? 학생 데이터도 함께 삭제됩니다.')) {
      deleteMutation.mutate(classId);
    }
  };

  const handleAssignTeacher = (classId: string, teacherId: string | null) => {
    assignTeacherMutation.mutate({ classId, teacherId });
  };

  if (classesLoading || teachersLoading) {
    return (
      <div className="text-center text-gray-500">
        <div className="mb-2">로딩 중...</div>
        <div className="text-sm">반 목록과 교사 목록을 불러오는 중입니다.</div>
      </div>
    );
  }

  if (classesError || teachersError) {
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
            {DEPARTMENTS.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
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
        {filteredClasses.map((cls) => (
          <Card key={cls.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{cls.department} {cls.name}</span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingClass(cls)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(cls.id)}
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
                    담임: {getTeacherName(cls.main_teacher_id)}
                  </span>
                </div>
                <Select
                  value={cls.main_teacher_id || 'unassigned'}
                  onValueChange={(value) =>
                    handleAssignTeacher(cls.id, value === 'unassigned' ? null : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="교사 배정" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">미배정</SelectItem>
                    {teachers.map((teacher: Teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.full_name || teacher.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 반 생성 다이얼로그 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>반 생성</DialogTitle>
            <DialogDescription>새로운 반을 생성합니다.</DialogDescription>
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
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
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
              <div className="space-y-2">
                <Label htmlFor="main_teacher_id">담임 교사 (선택)</Label>
                <Select name="main_teacher_id" defaultValue="unassigned">
                  <SelectTrigger>
                    <SelectValue placeholder="교사 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">미배정</SelectItem>
                    {teachers.map((teacher: Teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.full_name || teacher.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <DialogDescription>반 정보를 수정합니다.</DialogDescription>
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
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
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
                <div className="space-y-2">
                  <Label htmlFor="edit-main_teacher_id">담임 교사</Label>
                  <Select
                    name="main_teacher_id"
                    defaultValue={editingClass.main_teacher_id || 'unassigned'}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">미배정</SelectItem>
                      {teachers.map((teacher: Teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.full_name || teacher.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
