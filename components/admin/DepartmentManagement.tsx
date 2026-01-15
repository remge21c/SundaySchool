/**
 * 부서 관리 컴포넌트
 * 부서 생성, 수정, 삭제
 */

'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAllDepartmentsForAdmin,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  moveDepartment,
} from '@/lib/supabase/departments';
import { moveClassesToDepartment } from '@/lib/supabase/classes';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, Building2, ChevronUp, ChevronDown, MoveRight } from 'lucide-react';
import type { Department } from '@/lib/supabase/departments';

export function DepartmentManagement() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);

  // 이동할 타겟 부서 상태 추가
  const [targetDepartmentId, setTargetDepartmentId] = useState<string>('none');
  const [isDeleting, setIsDeleting] = useState(false);

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

  // 부서 생성
  const createMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsCreateDialogOpen(false);
    },
  });

  // 부서 수정
  const updateMutation = useMutation({
    mutationFn: ({ departmentId, input }: { departmentId: string; input: any }) =>
      updateDepartment(departmentId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setEditingDepartment(null);
    },
  });

  // 부서 삭제
  const deleteMutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setDeletingDepartment(null);
      setTargetDepartmentId('none');
      setIsDeleting(false);
    },
    onError: () => {
      setIsDeleting(false);
    }
  });

  // 부서 순서 변경
  const moveMutation = useMutation({
    mutationFn: ({ departmentId, direction }: { departmentId: string; direction: 'up' | 'down' }) =>
      moveDepartment(departmentId, direction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!name.trim()) {
      alert('부서명을 입력해주세요.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        description: description?.trim() || undefined,
      });
    } catch (error) {
      console.error('부서 생성 실패:', error);
      alert('부서 생성에 실패했습니다. 이미 존재하는 부서명일 수 있습니다.');
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingDepartment) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const is_active = formData.get('is_active') === 'true';

    if (!name.trim()) {
      alert('부서명을 입력해주세요.');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        departmentId: editingDepartment.id,
        input: {
          name: name.trim(),
          description: description?.trim() || undefined,
          is_active,
        },
      });
    } catch (error) {
      console.error('부서 수정 실패:', error);
      alert('부서 수정에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!deletingDepartment) return;
    setIsDeleting(true);

    try {
      // 1. 학생(반) 이동이 선택되었으면 먼저 수행
      if (targetDepartmentId !== 'none') {
        const targetDept = departments.find(d => d.id === targetDepartmentId);
        if (targetDept) {
          console.log(`이동 시작: ${deletingDepartment.name} -> ${targetDept.name}`);
          try {
            await moveClassesToDepartment(deletingDepartment.name, targetDept.name);
            console.log('이동 완료');
          } catch (moveError) {
            console.error('반 이동 실패:', moveError);
            alert('반 이동 중 오류가 발생했습니다. 삭제가 취소됩니다.');
            setIsDeleting(false);
            return;
          }
        }
      }

      // 2. 부서 삭제 수행
      await deleteMutation.mutateAsync(deletingDepartment.id);
    } catch (error: any) {
      console.error('부서 삭제 실패:', error);
      console.error('Error details:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
      alert(`부서 삭제에 실패했습니다: ${error?.message || '알 수 없는 오류'}`);
    }
  };

  const handleMove = async (departmentId: string, direction: 'up' | 'down') => {
    try {
      await moveMutation.mutateAsync({ departmentId, direction });
    } catch (error) {
      console.error('부서 순서 변경 실패:', error);
      alert('부서 순서 변경에 실패했습니다.');
    }
  };

  if (departmentsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">부서 목록을 불러오는 중...</div>
      </div>
    );
  }

  if (departmentsError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="text-red-800">
          부서 목록을 불러오는 중 오류가 발생했습니다.
        </div>
        <div className="mt-2 text-xs text-red-600">
          관리자 권한이 올바르게 설정되었는지 확인하세요.
        </div>
      </div>
    );
  }

  // 삭제 대상 부서를 제외한 다른 활성 부서 목록 (이동 대상용)
  const availableTargetDepartments = departments.filter(
    d => deletingDepartment && d.id !== deletingDepartment.id && d.is_active
  );

  return (
    <div className="space-y-6">
      {/* 생성 버튼 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">부서 관리</h3>
          <p className="text-sm text-gray-500">부서를 생성, 수정, 삭제할 수 있습니다.</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          부서 생성
        </Button>
      </div>

      {/* 부서 목록 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(departments || []).map((dept, index) => (
          <Card key={dept.id} className={!dept.is_active ? 'opacity-50' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {dept.name}
                </span>
                <div className="flex items-center gap-1">
                  {!dept.is_active && (
                    <span className="text-xs text-gray-500">(비활성화)</span>
                  )}
                  {/* 순서 변경 버튼 */}
                  <div className="flex flex-col">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 p-0"
                      onClick={() => handleMove(dept.id, 'up')}
                      disabled={index === 0 || moveMutation.isPending}
                      title="위로 이동"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 p-0"
                      onClick={() => handleMove(dept.id, 'down')}
                      disabled={index === departments.length - 1 || moveMutation.isPending}
                      title="아래로 이동"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardTitle>
              {dept.description && (
                <CardDescription>{dept.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingDepartment(dept)}
                  className="flex-1"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  수정
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDeletingDepartment(dept);
                    setTargetDepartmentId('none');
                  }}
                  className="flex-1"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  삭제
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 부서 생성 다이얼로그 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>부서 생성</DialogTitle>
              <DialogDescription>새로운 부서를 생성합니다.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">부서명 *</Label>
                <Input
                  id="create-name"
                  name="name"
                  placeholder="예: 유년부"
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-description">설명</Label>
                <textarea
                  id="create-description"
                  name="description"
                  placeholder="부서에 대한 설명을 입력하세요 (선택사항)"
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

      {/* 부서 수정 다이얼로그 */}
      <Dialog open={!!editingDepartment} onOpenChange={(open) => !open && setEditingDepartment(null)}>
        <DialogContent>
          {editingDepartment && (
            <form onSubmit={handleUpdate}>
              <DialogHeader>
                <DialogTitle>부서 수정</DialogTitle>
                <DialogDescription>부서 정보를 수정합니다.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">부서명 *</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editingDepartment.name}
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">설명</Label>
                  <textarea
                    id="edit-description"
                    name="description"
                    defaultValue={editingDepartment.description || ''}
                    placeholder="부서에 대한 설명을 입력하세요 (선택사항)"
                    rows={3}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-is_active">상태</Label>
                  <select
                    id="edit-is_active"
                    name="is_active"
                    defaultValue={editingDepartment.is_active ? 'true' : 'false'}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="true">활성화</option>
                    <option value="false">비활성화</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingDepartment(null)}
                >
                  취소
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? '저장 중...' : '저장'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 부서 삭제 확인 다이얼로그 */}
      <Dialog open={!!deletingDepartment} onOpenChange={(open) => !open && !isDeleting && setDeletingDepartment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>부서 삭제</DialogTitle>
            <DialogDescription>
              <span className="block">
                really &quot;{deletingDepartment?.name}&quot; delete this department?
              </span>
            </DialogDescription>

            <div className="space-y-4 pt-2">
              <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
                <div className="flex gap-2">
                  <MoveRight className="h-5 w-5 text-yellow-600 shrink-0" />
                  <div className="space-y-2 w-full">
                    <p className="text-sm font-medium text-yellow-800">
                      소속된 반(학생) 이동
                    </p>
                    <Select
                      value={targetDepartmentId}
                      onValueChange={setTargetDepartmentId}
                      disabled={isDeleting}
                    >
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="이동할 부서 선택 (선택사항)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-red-500">
                          이동 안 함 (학생/반 모두 삭제됨)
                        </SelectItem>
                        {availableTargetDepartments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}로 이동
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <span className="block text-red-600 font-bold text-sm">
                {targetDepartmentId === 'none'
                  ? "주의: 이동하지 않으면 소속된 모든 반과 학생 데이터가 영구적으로 삭제됩니다."
                  : "주의: 부서 데이터는 삭제되지만, 소속된 반들은 선택한 부서로 이동됩니다."
                }
              </span>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingDepartment(null)}
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? '처리 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
