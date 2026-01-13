/**
 * 심방 타임라인 컴포넌트
 * 학생별 심방 기록을 시간순으로 표시하는 컴포넌트
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateVisitationLog, deleteVisitationLog } from '@/lib/supabase/visitation';
import { useVisitations } from '@/hooks/useVisitations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Phone, Home, MessageSquare, Lock, Heart, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { VisitationLog, VisitationType, UpdateVisitationLogInput } from '@/types/visitation';
import type { Class } from '@/types/class';

interface VisitationTimelineProps {
  studentId: string;
  classInfo?: Class | null;
}

/**
 * 심방 유형에 따른 아이콘 및 텍스트 반환
 */
function getVisitationTypeInfo(type: VisitationType) {
  switch (type) {
    case 'call':
      return {
        icon: Phone,
        label: '전화',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
      };
    case 'visit':
      return {
        icon: Home,
        label: '심방',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
      };
    case 'kakao':
      return {
        icon: MessageSquare,
        label: '카카오톡',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
      };
  }
}

/**
 * 심방 유형 옵션
 */
const VISITATION_TYPES: { value: VisitationType; label: string; icon: typeof Phone }[] = [
  { value: 'call', label: '전화', icon: Phone },
  { value: 'visit', label: '심방', icon: Home },
  { value: 'kakao', label: '카카오톡', icon: MessageSquare },
];

export function VisitationTimeline({ studentId, classInfo }: VisitationTimelineProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [editingVisitation, setEditingVisitation] = useState<VisitationLog | null>(null);
  const [editVisitDate, setEditVisitDate] = useState('');
  const [editType, setEditType] = useState<VisitationType | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editPrayerRequest, setEditPrayerRequest] = useState('');
  const [editIsConfidential, setEditIsConfidential] = useState(false);

  const { data: visitations, isLoading, error } = useVisitations({ student_id: studentId });

  const deleteMutation = useMutation({
    mutationFn: deleteVisitationLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitations'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateVisitationLogInput }) =>
      updateVisitationLog(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitations'] });
      setEditingVisitation(null);
      setEditVisitDate('');
      setEditType(null);
      setEditContent('');
      setEditPrayerRequest('');
      setEditIsConfidential(false);
    },
  });

  const handleEdit = (visitation: VisitationLog) => {
    setEditingVisitation(visitation);
    setEditVisitDate(visitation.visit_date);
    setEditType(visitation.type);
    setEditContent(visitation.content);
    setEditPrayerRequest(visitation.prayer_request || '');
    setEditIsConfidential(visitation.is_confidential);
  };

  const handleSaveEdit = () => {
    if (!editingVisitation || !editType || !editContent.trim() || !editVisitDate) {
      return;
    }

    const updateInput: UpdateVisitationLogInput = {
      visit_date: editVisitDate,
      type: editType,
      content: editContent.trim(),
      prayer_request: editPrayerRequest.trim() || null,
      is_confidential: editIsConfidential,
    };

    updateMutation.mutate({
      id: editingVisitation.id,
      input: updateInput,
    });
  };

  const handleDelete = (visitationId: string) => {
    if (confirm('정말 이 심방 기록을 삭제하시겠습니까?')) {
      deleteMutation.mutate(visitationId);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>심방 기록</CardTitle>
          <CardDescription>심방 이력을 시간순으로 확인하세요</CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">로딩 중...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>심방 기록</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <p className="text-red-500">
            {error instanceof Error ? error.message : '심방 기록을 불러오는 중 오류가 발생했습니다.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!visitations || visitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>심방 기록</CardTitle>
          <CardDescription>심방 이력을 시간순으로 확인하세요</CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">심방 기록이 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>심방 기록</CardTitle>
          <CardDescription>심방 이력을 시간순으로 확인하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {visitations.map((visitation, index) => {
              const typeInfo = getVisitationTypeInfo(visitation.type);
              const Icon = typeInfo.icon;
              const visitDate = format(new Date(visitation.visit_date), 'yyyy년 M월 d일', {
                locale: ko,
              });
              const canEdit = user && (user.id === visitation.teacher_id || user.email?.includes('admin'));

              return (
                <div
                  key={visitation.id}
                  className="relative pl-8 pb-6 border-l-2 border-gray-200 last:border-l-0 last:pb-0"
                >
                  {/* 타임라인 연결선 */}
                  {index < visitations.length - 1 && (
                    <div className="absolute left-[-5px] top-8 w-2 h-2 bg-gray-300 rounded-full" />
                  )}

                  {/* 날짜 및 유형 */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <div className={`p-2 rounded-lg ${typeInfo.bgColor}`}>
                        <Icon className={`h-4 w-4 ${typeInfo.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">{visitDate}</span>
                          {classInfo && (
                            <span className="text-gray-400 text-xs font-normal">
                              {classInfo.department} - {classInfo.name}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">{typeInfo.label}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {visitation.is_confidential && (
                        <div className="flex items-center gap-1 text-amber-600 text-sm">
                          <Lock className="h-4 w-4" />
                          <span>비밀</span>
                        </div>
                      )}
                      {canEdit && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(visitation)}
                            disabled={deleteMutation.isPending || updateMutation.isPending}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(visitation.id)}
                            disabled={deleteMutation.isPending || updateMutation.isPending}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 심방 내용 */}
                  <div className="ml-12 mt-2">
                    <p className="text-gray-700 whitespace-pre-wrap">{visitation.content}</p>

                    {/* 기도 제목 */}
                    {visitation.prayer_request && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-2">
                          <Heart className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-blue-900 mb-1">기도 제목</div>
                            <p className="text-sm text-blue-800 whitespace-pre-wrap">
                              {visitation.prayer_request}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 심방 기록 수정 다이얼로그 */}
      <Dialog open={!!editingVisitation} onOpenChange={(isOpen) => !isOpen && setEditingVisitation(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>심방 기록 수정</DialogTitle>
            <DialogDescription>심방 기록 내용을 수정하세요</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 날짜 선택 */}
            <div className="space-y-2">
              <Label htmlFor="editVisitDate">날짜</Label>
              <Input
                id="editVisitDate"
                type="date"
                value={editVisitDate}
                onChange={(e) => setEditVisitDate(e.target.value)}
                disabled={updateMutation.isPending}
                required
              />
            </div>

            {/* 심방 유형 선택 */}
            <div className="space-y-2">
              <Label>심방 유형</Label>
              <div className="grid grid-cols-3 gap-2">
                {VISITATION_TYPES.map((visitationType) => {
                  const TypeIcon = visitationType.icon;
                  const isSelected = editType === visitationType.value;

                  return (
                    <Button
                      key={visitationType.value}
                      type="button"
                      variant={isSelected ? 'default' : 'outline'}
                      onClick={() => setEditType(visitationType.value)}
                      disabled={updateMutation.isPending}
                      className={cn(
                        'h-auto py-3 flex flex-col items-center gap-2',
                        isSelected &&
                          (visitationType.value === 'call'
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : visitationType.value === 'visit'
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-yellow-600 hover:bg-yellow-700')
                      )}
                    >
                      <TypeIcon className="h-5 w-5" />
                      <span>{visitationType.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* 심방 내용 */}
            <div className="space-y-2">
              <Label htmlFor="editContent">심방 내용</Label>
              <Textarea
                id="editContent"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
                disabled={updateMutation.isPending}
                required
                placeholder="심방 내용을 입력하세요"
              />
            </div>

            {/* 기도 제목 */}
            <div className="space-y-2">
              <Label htmlFor="editPrayerRequest">기도 제목 (선택)</Label>
              <Input
                id="editPrayerRequest"
                type="text"
                value={editPrayerRequest}
                onChange={(e) => setEditPrayerRequest(e.target.value)}
                disabled={updateMutation.isPending}
                placeholder="기도 제목을 입력하세요"
              />
            </div>

            {/* 비밀 보장 */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="editIsConfidential"
                checked={editIsConfidential}
                onChange={(e) => setEditIsConfidential(e.target.checked)}
                disabled={updateMutation.isPending}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
              />
              <Label htmlFor="editIsConfidential" className="text-sm font-medium flex items-center gap-1">
                <Lock className="h-4 w-4" />
                비밀 보장
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingVisitation(null)}
              disabled={updateMutation.isPending}
            >
              취소
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending || !editType || !editContent.trim() || !editVisitDate}
            >
              {updateMutation.isPending ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
