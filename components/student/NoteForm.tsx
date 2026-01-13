/**
 * 메모 작성 폼 컴포넌트
 * 학생 메모를 작성하는 폼
 */

'use client';

import { useState, FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createNote } from '@/lib/supabase/notes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface NoteFormProps {
  studentId: string;
  onSuccess?: () => void;
}

export function NoteForm({ studentId, onSuccess }: NoteFormProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // 오늘 날짜를 기본값으로 사용
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd', { locale: ko });
  
  const [noteDate, setNoteDate] = useState(todayStr);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (data: { student_id: string; teacher_id: string; note_date: string; content: string }) => {
      return createNote(data);
    },
    onSuccess: () => {
      // 쿼리 무효화로 메모 목록 새로고침
      queryClient.invalidateQueries({ queryKey: ['student-notes', studentId] });
      
      // 폼 초기화
      setContent('');
      setNoteDate(todayStr);
      setError(null);
      
      // 성공 콜백 실행
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (err: Error) => {
      setError(err.message || '메모 작성에 실패했습니다. 다시 시도해주세요.');
    },
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // 필수 필드 검증
    if (!content.trim()) {
      setError('메모 내용을 입력해주세요.');
      return;
    }

    if (!noteDate) {
      setError('날짜를 선택해주세요.');
      return;
    }

    if (!user) {
      setError('로그인이 필요합니다.');
      return;
    }

    // 메모 생성
    mutation.mutate({
      student_id: studentId,
      teacher_id: user.id,
      note_date: noteDate,
      content: content.trim(),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>메모 작성</CardTitle>
        <CardDescription>학생에 대한 메모를 작성하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 날짜 선택 */}
            <div className="space-y-2">
              <Label htmlFor="noteDate">날짜 *</Label>
              <Input
                id="noteDate"
                type="date"
                value={noteDate}
                onChange={(e) => setNoteDate(e.target.value)}
                required
                disabled={mutation.isPending}
              />
            </div>

            {/* 작성자 (읽기 전용) */}
            <div className="space-y-2">
              <Label htmlFor="author">작성자</Label>
              <Input
                id="author"
                type="text"
                value={user?.email || '로그인 필요'}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>

          {/* 메모 내용 */}
          <div className="space-y-2">
            <Label htmlFor="content">메모 내용 *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="메모 내용을 입력하세요"
              rows={4}
              required
              disabled={mutation.isPending}
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" disabled={mutation.isPending || !user}>
            {mutation.isPending ? '저장 중...' : '저장'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
