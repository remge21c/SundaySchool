/**
 * 달란트 규칙 관리 컴포넌트
 * 달란트 포인트 규칙 생성, 수정, 삭제
 */

'use client';

import { useState, FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getTalentRules,
  createTalentRule,
  updateTalentRule,
  deleteTalentRule,
} from '@/lib/supabase/talent';
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
import { Plus, Edit, Trash2, Coins } from 'lucide-react';
import type { TalentRule } from '@/lib/supabase/talent';

export function TalentRuleManagement() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<TalentRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<TalentRule | null>(null);

  // 규칙 목록 조회
  const {
    data: rules = [],
    isLoading: rulesLoading,
    error: rulesError,
  } = useQuery({
    queryKey: ['talent-rules', 'all'],
    queryFn: getTalentRules,
  });

  // 규칙 생성
  const createMutation = useMutation({
    mutationFn: createTalentRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent-rules'] });
      setIsCreateDialogOpen(false);
    },
  });

  // 규칙 수정
  const updateMutation = useMutation({
    mutationFn: ({ ruleId, input }: { ruleId: string; input: any }) =>
      updateTalentRule(ruleId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent-rules'] });
      setEditingRule(null);
    },
  });

  // 규칙 삭제
  const deleteMutation = useMutation({
    mutationFn: deleteTalentRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent-rules'] });
      setDeletingRule(null);
    },
  });

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const category = formData.get('category') as string;
    const amount = parseInt(formData.get('amount') as string, 10);
    const description = formData.get('description') as string;
    const requiresApproval = formData.get('requires_approval') === 'on';

    if (!category.trim()) {
      alert('카테고리명을 입력해주세요.');
      return;
    }

    if (isNaN(amount) || amount < 0) {
      alert('올바른 포인트를 입력해주세요.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        category: category.trim(),
        amount,
        description: description?.trim() || undefined,
        requires_approval: requiresApproval,
      });
    } catch (error) {
      console.error('규칙 생성 실패:', error);
      alert('규칙 생성에 실패했습니다.');
    }
  };

  const handleUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingRule) return;

    const formData = new FormData(e.currentTarget);
    const category = formData.get('category') as string;
    const amount = parseInt(formData.get('amount') as string, 10);
    const description = formData.get('description') as string;
    const requiresApproval = formData.get('requires_approval') === 'on';
    const isActive = formData.get('is_active') === 'on';

    if (!category.trim()) {
      alert('카테고리명을 입력해주세요.');
      return;
    }

    if (isNaN(amount) || amount < 0) {
      alert('올바른 포인트를 입력해주세요.');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        ruleId: editingRule.id,
        input: {
          category: category.trim(),
          amount,
          description: description?.trim() || undefined,
          requires_approval: requiresApproval,
          is_active: isActive,
        },
      });
    } catch (error) {
      console.error('규칙 수정 실패:', error);
      alert('규칙 수정에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!deletingRule) return;

    try {
      await deleteMutation.mutateAsync(deletingRule.id);
    } catch (error) {
      console.error('규칙 삭제 실패:', error);
      alert('규칙 삭제에 실패했습니다.');
    }
  };

  if (rulesError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>달란트 규칙 관리</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">규칙을 불러오는 중 오류가 발생했습니다.</p>
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
                <Coins className="h-5 w-5" />
                달란트 규칙 관리
              </CardTitle>
              <CardDescription>달란트 포인트 지급 규칙을 관리하세요</CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              규칙 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rulesLoading ? (
            <p className="text-gray-500">로딩 중...</p>
          ) : !rules || rules.length === 0 ? (
            <p className="text-gray-500">등록된 규칙이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {(rules || []).map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-semibold">{rule.category}</p>
                        <p className="text-sm text-gray-500">{rule.description || '설명 없음'}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-bold text-amber-600">+{rule.amount} 달란트</span>
                        {rule.requires_approval && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            교사 승인
                          </span>
                        )}
                        {!rule.is_active && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            비활성화
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingRule(rule)}
                      disabled={deleteMutation.isPending || updateMutation.isPending}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingRule(rule)}
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

      {/* 규칙 생성 다이얼로그 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>달란트 규칙 추가</DialogTitle>
            <DialogDescription>새로운 달란트 포인트 규칙을 추가하세요</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-category">카테고리명</Label>
                <Input
                  id="create-category"
                  name="category"
                  placeholder="예: 성경 암송"
                  required
                  disabled={createMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-amount">포인트</Label>
                <Input
                  id="create-amount"
                  name="amount"
                  type="number"
                  min="0"
                  placeholder="10"
                  required
                  disabled={createMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-description">설명 (선택)</Label>
                <Input
                  id="create-description"
                  name="description"
                  placeholder="예: 교사 승인 필요"
                  disabled={createMutation.isPending}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  id="create-requires-approval"
                  name="requires_approval"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  disabled={createMutation.isPending}
                />
                <Label htmlFor="create-requires-approval" className="cursor-pointer">
                  교사 승인 필요
                </Label>
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

      {/* 규칙 수정 다이얼로그 */}
      <Dialog open={!!editingRule} onOpenChange={(open) => !open && setEditingRule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>달란트 규칙 수정</DialogTitle>
            <DialogDescription>달란트 포인트 규칙을 수정하세요</DialogDescription>
          </DialogHeader>
          {editingRule && (
            <form onSubmit={handleUpdate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category">카테고리명</Label>
                  <Input
                    id="edit-category"
                    name="category"
                    defaultValue={editingRule.category}
                    required
                    disabled={updateMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-amount">포인트</Label>
                  <Input
                    id="edit-amount"
                    name="amount"
                    type="number"
                    min="0"
                    defaultValue={editingRule.amount}
                    required
                    disabled={updateMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">설명 (선택)</Label>
                  <Input
                    id="edit-description"
                    name="description"
                    defaultValue={editingRule.description || ''}
                    disabled={updateMutation.isPending}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    id="edit-requires-approval"
                    name="requires_approval"
                    type="checkbox"
                    defaultChecked={editingRule.requires_approval}
                    className="h-4 w-4 rounded border-gray-300"
                    disabled={updateMutation.isPending}
                  />
                  <Label htmlFor="edit-requires-approval" className="cursor-pointer">
                    교사 승인 필요
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    id="edit-is-active"
                    name="is_active"
                    type="checkbox"
                    defaultChecked={editingRule.is_active}
                    className="h-4 w-4 rounded border-gray-300"
                    disabled={updateMutation.isPending}
                  />
                  <Label htmlFor="edit-is-active" className="cursor-pointer">
                    활성화
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingRule(null)}
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

      {/* 규칙 삭제 확인 다이얼로그 */}
      <Dialog open={!!deletingRule} onOpenChange={(open) => !open && setDeletingRule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>규칙 삭제 확인</DialogTitle>
            <DialogDescription>
              정말 &quot;{deletingRule?.category}&quot; 규칙을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingRule(null)}
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
