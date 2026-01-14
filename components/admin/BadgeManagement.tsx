/**
 * 배지 관리 컴포넌트
 * 배지 생성, 수정, 삭제
 */

'use client';

import { useState, FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllBadges, createBadge, updateBadge, deleteBadge } from '@/lib/supabase/badges';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Award } from 'lucide-react';
import type { Badge } from '@/lib/supabase/badges';

export function BadgeManagement() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  const [deletingBadge, setDeletingBadge] = useState<Badge | null>(null);

  // 배지 목록 조회
  const {
    data: badges = [],
    isLoading: badgesLoading,
    error: badgesError,
  } = useQuery({
    queryKey: ['badges', 'all'],
    queryFn: getAllBadges,
  });

  // 배지 생성
  const createMutation = useMutation({
    mutationFn: createBadge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      setIsCreateDialogOpen(false);
    },
  });

  // 배지 수정
  const updateMutation = useMutation({
    mutationFn: ({ badgeId, input }: { badgeId: string; input: any }) =>
      updateBadge(badgeId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      setEditingBadge(null);
    },
  });

  // 배지 삭제
  const deleteMutation = useMutation({
    mutationFn: deleteBadge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      setDeletingBadge(null);
    },
  });

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const conditionType = formData.get('condition_type') as string;
    const conditionValue = parseInt(formData.get('condition_value') as string, 10);

    if (!name.trim()) {
      alert('배지명을 입력해주세요.');
      return;
    }

    if (!conditionType.trim()) {
      alert('획득 조건 타입을 입력해주세요.');
      return;
    }

    if (isNaN(conditionValue) || conditionValue < 0) {
      alert('올바른 획득 조건 값을 입력해주세요.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        description: description?.trim() || undefined,
        condition_type: conditionType.trim(),
        condition_value: conditionValue,
      });
    } catch (error) {
      console.error('배지 생성 실패:', error);
      alert('배지 생성에 실패했습니다.');
    }
  };

  const handleUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingBadge) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const conditionType = formData.get('condition_type') as string;
    const conditionValue = parseInt(formData.get('condition_value') as string, 10);

    if (!name.trim()) {
      alert('배지명을 입력해주세요.');
      return;
    }

    if (!conditionType.trim()) {
      alert('획득 조건 타입을 입력해주세요.');
      return;
    }

    if (isNaN(conditionValue) || conditionValue < 0) {
      alert('올바른 획득 조건 값을 입력해주세요.');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        badgeId: editingBadge.id,
        input: {
          name: name.trim(),
          description: description?.trim() || undefined,
          condition_type: conditionType.trim(),
          condition_value: conditionValue,
        },
      });
    } catch (error) {
      console.error('배지 수정 실패:', error);
      alert('배지 수정에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!deletingBadge) return;

    try {
      await deleteMutation.mutateAsync(deletingBadge.id);
    } catch (error) {
      console.error('배지 삭제 실패:', error);
      alert('배지 삭제에 실패했습니다.');
    }
  };

  if (badgesError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>배지 관리</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">배지를 불러오는 중 오류가 발생했습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                배지 관리
              </CardTitle>
              <CardDescription>배지를 생성, 수정, 삭제할 수 있습니다</CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              배지 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {badgesLoading ? (
            <p className="text-gray-500">로딩 중...</p>
          ) : !badges || badges.length === 0 ? (
            <p className="text-gray-500">등록된 배지가 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {(badges || []).map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {badge.icon_url ? (
                      <img src={badge.icon_url} alt={badge.name} className="w-12 h-12" />
                    ) : (
                      <Award className="w-12 h-12 text-yellow-600" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">{badge.name}</p>
                      <p className="text-sm text-gray-500">{badge.description || '설명 없음'}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        조건: {badge.condition_type} ({badge.condition_value})
                      </p>
                    </div>
                    {!badge.is_active && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        비활성화
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingBadge(badge)}
                      disabled={deleteMutation.isPending || updateMutation.isPending}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingBadge(badge)}
                      disabled={deleteMutation.isPending || updateMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 배지 생성 다이얼로그 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>배지 추가</DialogTitle>
            <DialogDescription>새로운 배지를 추가하세요</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">배지명</Label>
                <Input
                  id="create-name"
                  name="name"
                  placeholder="예: 4주 개근"
                  required
                  disabled={createMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-description">설명 (선택)</Label>
                <Input
                  id="create-description"
                  name="description"
                  placeholder="예: 4주 연속 출석 달성"
                  disabled={createMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-condition-type">획득 조건 타입</Label>
                <Input
                  id="create-condition-type"
                  name="condition_type"
                  placeholder="예: consecutive_weeks"
                  required
                  disabled={createMutation.isPending}
                />
                <p className="text-xs text-gray-500">예: consecutive_weeks (연속 주)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-condition-value">획득 조건 값</Label>
                <Input
                  id="create-condition-value"
                  name="condition_value"
                  type="number"
                  min="0"
                  placeholder="4"
                  required
                  disabled={createMutation.isPending}
                />
                <p className="text-xs text-gray-500">예: 4 (4주)</p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={createMutation.isPending}
              >
                취소
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? '추가 중...' : '추가'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 배지 수정 다이얼로그 */}
      <Dialog open={!!editingBadge} onOpenChange={(open) => !open && setEditingBadge(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>배지 수정</DialogTitle>
            <DialogDescription>배지를 수정하세요</DialogDescription>
          </DialogHeader>
          {editingBadge && (
            <form onSubmit={handleUpdate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">배지명</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editingBadge.name}
                    required
                    disabled={updateMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">설명 (선택)</Label>
                  <Input
                    id="edit-description"
                    name="description"
                    defaultValue={editingBadge.description || ''}
                    disabled={updateMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-condition-type">획득 조건 타입</Label>
                  <Input
                    id="edit-condition-type"
                    name="condition_type"
                    defaultValue={editingBadge.condition_type}
                    required
                    disabled={updateMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-condition-value">획득 조건 값</Label>
                  <Input
                    id="edit-condition-value"
                    name="condition_value"
                    type="number"
                    min="0"
                    defaultValue={editingBadge.condition_value}
                    required
                    disabled={updateMutation.isPending}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingBadge(null)}
                  disabled={updateMutation.isPending}
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

      {/* 배지 삭제 확인 다이얼로그 */}
      <Dialog open={!!deletingBadge} onOpenChange={(open) => !open && setDeletingBadge(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>배지 삭제 확인</DialogTitle>
            <DialogDescription>
              정말 &quot;{deletingBadge?.name}&quot; 배지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingBadge(null)}
              disabled={deleteMutation.isPending}
            >
              취소
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
