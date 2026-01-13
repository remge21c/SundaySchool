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
import { Plus, Edit, Trash2, Building2, ChevronUp, ChevronDown } from 'lucide-react';
import type { Department } from '@/lib/supabase/departments';

export function DepartmentManagement() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);

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
    },
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

    try {
      await deleteMutation.mutateAsync(deletingDepartment.id);
    } catch (error) {
      console.error('부서 삭제 실패:', error);
      alert('부서 삭제에 실패했습니다.');
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
        {departments.map((dept, index) => (
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
                  onClick={() => setDeletingDepartment(dept)}
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
      <Dialog open={!!deletingDepartment} onOpenChange={(open) => !open && setDeletingDepartment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>부서 삭제 확인</DialogTitle>
            <DialogDescription>
              정말로 &quot;{deletingDepartment?.name}&quot; 부서를 삭제하시겠습니까?
              <br />
              <br />
              삭제된 부서는 비활성화되며, 해당 부서의 반들은 그대로 유지됩니다.
              <br />
              필요시 나중에 다시 활성화할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingDepartment(null)}
            >
              취소
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
