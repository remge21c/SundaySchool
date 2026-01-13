/**
 * 메모 타임라인 컴포넌트
 * 학생 메모를 시간순으로 표시하는 컴포넌트
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotesByStudent, deleteNote, updateNote } from '@/lib/supabase/notes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Edit, Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import type { StudentNote } from '@/lib/supabase/notes';

interface NoteTimelineProps {
  studentId: string;
}

export function NoteTimeline({ studentId }: NoteTimelineProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [editingNote, setEditingNote] = useState<StudentNote | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editDate, setEditDate] = useState('');

  const { data: notes, isLoading, error } = useQuery({
    queryKey: ['student-notes', studentId],
    queryFn: () => getNotesByStudent(studentId),
    staleTime: 1 * 60 * 1000, // 1분간 fresh 상태 유지
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-notes', studentId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ noteId, content, noteDate }: { noteId: string; content: string; noteDate: string }) =>
      updateNote(noteId, { content, note_date: noteDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-notes', studentId] });
      setEditingNote(null);
      setEditContent('');
      setEditDate('');
    },
  });

  const handleEdit = (note: StudentNote) => {
    setEditingNote(note);
    setEditContent(note.content);
    setEditDate(note.note_date);
  };

  const handleSaveEdit = () => {
    if (!editingNote) return;
    if (!editContent.trim()) return;

    updateMutation.mutate({
      noteId: editingNote.id,
      content: editContent.trim(),
      noteDate: editDate,
    });
  };

  const handleDelete = (noteId: string) => {
    if (confirm('정말 이 메모를 삭제하시겠습니까?')) {
      deleteMutation.mutate(noteId);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-gray-500">메모를 불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-red-600">메모를 불러오는데 실패했습니다.</p>
          <p className="text-sm text-gray-500 mt-2">{error instanceof Error ? error.message : '알 수 없는 오류'}</p>
        </CardContent>
      </Card>
    );
  }

  if (!notes || notes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            메모 목록
          </CardTitle>
          <CardDescription>작성된 메모가 없습니다</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">아직 작성된 메모가 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            메모 목록 ({notes.length}개)
          </CardTitle>
          <CardDescription>작성된 메모를 확인하고 관리하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notes.map((note) => {
              const canEdit = user && (user.id === note.teacher_id || user.email?.includes('admin'));
              
              return (
                <div
                  key={note.id}
                  className="border rounded-lg p-4 space-y-2 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <span className="font-medium">
                          {format(new Date(note.note_date), 'yyyy년 M월 d일', { locale: ko })}
                        </span>
                        <span>•</span>
                        <span>
                          {note.teacher_id === user?.id
                            ? '나'
                            : note.profiles?.full_name || note.profiles?.email || '알 수 없음'}
                        </span>
                      </div>
                      <p className="text-base whitespace-pre-wrap">{note.content}</p>
                      <div className="text-xs text-gray-400 mt-2">
                        작성일: {format(new Date(note.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                        {note.updated_at !== note.created_at && (
                          <span className="ml-2">(수정됨)</span>
                        )}
                      </div>
                    </div>
                    {canEdit && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(note)}
                          disabled={deleteMutation.isPending || updateMutation.isPending}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(note.id)}
                          disabled={deleteMutation.isPending || updateMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 메모 수정 다이얼로그 */}
      <Dialog open={!!editingNote} onOpenChange={(isOpen) => !isOpen && setEditingNote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>메모 수정</DialogTitle>
            <DialogDescription>메모 내용을 수정하세요</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editDate">날짜</Label>
              <Input
                id="editDate"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editContent">메모 내용</Label>
              <Textarea
                id="editContent"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
                disabled={updateMutation.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingNote(null)}
              disabled={updateMutation.isPending}
            >
              취소
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending || !editContent.trim()}
            >
              {updateMutation.isPending ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
