/**
 * 심방 기록 폼 컴포넌트
 * 심방 기록을 생성하는 폼
 */

'use client';

import { useState, FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createVisitationLog } from '@/lib/supabase/visitation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Home, MessageSquare, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VisitationType, CreateVisitationLogInput } from '@/types/visitation';

interface VisitationFormProps {
  studentId: string;
  teacherId: string;
  onSuccess?: () => void;
}

/**
 * 심방 유형 옵션
 */
const VISITATION_TYPES: { value: VisitationType; label: string; icon: typeof Phone }[] = [
  { value: 'call', label: '전화', icon: Phone },
  { value: 'visit', label: '심방', icon: Home },
  { value: 'kakao', label: '카카오톡', icon: MessageSquare },
];

export function VisitationForm({ studentId, teacherId, onSuccess }: VisitationFormProps) {
  const queryClient = useQueryClient();
  const [visitDate, setVisitDate] = useState(() => {
    // 오늘 날짜를 YYYY-MM-DD 형식으로 반환
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [type, setType] = useState<VisitationType | null>(null);
  const [content, setContent] = useState('');
  const [prayerRequest, setPrayerRequest] = useState('');
  const [isConfidential, setIsConfidential] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (data: CreateVisitationLogInput) => {
      return createVisitationLog(data);
    },
    onSuccess: () => {
      // 쿼리 무효화로 타임라인 새로고침
      queryClient.invalidateQueries({ queryKey: ['visitations'] });
      
      // 폼 초기화
      setContent('');
      setPrayerRequest('');
      setIsConfidential(false);
      setType(null);
      setError(null);
      
      // 성공 콜백 실행
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (err: Error) => {
      setError(err.message || '오류가 발생했습니다. 다시 시도해주세요.');
    },
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // 필수 필드 검증
    if (!type) {
      setError('심방 유형을 선택해주세요.');
      return;
    }

    if (!content.trim()) {
      setError('심방 내용을 입력해주세요.');
      return;
    }

    if (!visitDate) {
      setError('날짜를 선택해주세요.');
      return;
    }

    // 심방 기록 생성
    mutation.mutate({
      student_id: studentId,
      teacher_id: teacherId,
      visit_date: visitDate,
      type,
      content: content.trim(),
      prayer_request: prayerRequest.trim() || null,
      is_confidential: isConfidential,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>심방 기록 작성</CardTitle>
        <CardDescription>새로운 심방 기록을 작성하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 날짜 선택 */}
          <div className="space-y-2">
            <label htmlFor="visit-date" className="text-sm font-medium">
              날짜 <span className="text-red-500">*</span>
            </label>
            <Input
              id="visit-date"
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              required
              disabled={mutation.isPending}
            />
          </div>

          {/* 심방 유형 선택 */}
          <div className="space-y-2">
            <label htmlFor="visitation-type" className="text-sm font-medium">
              심방 유형 <span className="text-red-500">*</span>
            </label>
            <div id="visitation-type" role="group" aria-label="심방 유형 선택">
            <div className="grid grid-cols-3 gap-2">
              {VISITATION_TYPES.map((visitationType) => {
                const Icon = visitationType.icon;
                const isSelected = type === visitationType.value;

                return (
                  <Button
                    key={visitationType.value}
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={() => setType(visitationType.value)}
                    disabled={mutation.isPending}
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
                    <Icon className="h-5 w-5" />
                    <span>{visitationType.label}</span>
                  </Button>
                );
              })}
            </div>
            </div>
          </div>

          {/* 심방 내용 */}
          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">
              심방 내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              disabled={mutation.isPending}
              rows={4}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="심방 내용을 입력하세요"
            />
          </div>

          {/* 기도 제목 */}
          <div className="space-y-2">
            <label htmlFor="prayer-request" className="text-sm font-medium">
              기도 제목 (선택)
            </label>
            <Input
              id="prayer-request"
              type="text"
              value={prayerRequest}
              onChange={(e) => setPrayerRequest(e.target.value)}
              disabled={mutation.isPending}
              placeholder="기도 제목을 입력하세요"
            />
          </div>

          {/* 비밀 보장 */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is-confidential"
              checked={isConfidential}
              onChange={(e) => setIsConfidential(e.target.checked)}
              disabled={mutation.isPending}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
            />
            <label htmlFor="is-confidential" className="text-sm font-medium flex items-center gap-1">
              <Lock className="h-4 w-4" />
              비밀 보장
            </label>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* 제출 버튼 */}
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? '저장 중...' : '저장'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
