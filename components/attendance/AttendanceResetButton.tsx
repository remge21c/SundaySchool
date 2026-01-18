/**
 * 출석 초기화 버튼 컴포넌트
 * 특정 반의 특정 날짜 출석 기록을 모두 초기화
 */

'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { resetAttendanceLogs } from '@/lib/supabase/attendance';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { RotateCcw, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface AttendanceResetButtonProps {
    classId: string;
    date: string;
    className?: string;
}

export function AttendanceResetButton({ classId, date, className }: AttendanceResetButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();

    const formattedDate = format(new Date(date), 'yyyy년 M월 d일', { locale: ko });

    const resetMutation = useMutation({
        mutationFn: () => resetAttendanceLogs(classId, date),
        onSuccess: (deletedCount) => {
            // 관련 쿼리 무효화
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
            queryClient.invalidateQueries({ queryKey: ['attendance-stats', classId, date] });
            queryClient.invalidateQueries({ queryKey: ['students', classId] });

            setIsOpen(false);

            if (deletedCount > 0) {
                alert(`${deletedCount}명의 출석 기록이 초기화되었습니다.`);
            } else {
                alert('초기화할 출석 기록이 없습니다.');
            }
        },
        onError: (error) => {
            console.error('출석 초기화 실패:', error);
            alert('출석 초기화에 실패했습니다. 다시 시도해주세요.');
        },
    });

    const handleReset = () => {
        resetMutation.mutate();
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={className}
                    disabled={resetMutation.isPending}
                >
                    {resetMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <RotateCcw className="h-4 w-4 mr-2" />
                    )}
                    출석 초기화
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>출석 기록 초기화</AlertDialogTitle>
                    <AlertDialogDescription>
                        <strong>{formattedDate}</strong>의 모든 출석 기록을 초기화하시겠습니까?
                        <br /><br />
                        이 작업은 되돌릴 수 없으며, 해당 날짜의 모든 출석/결석/지각 기록이 삭제됩니다.
                        <br />
                        (연동된 달란트 점수도 함께 삭제됩니다.)
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={resetMutation.isPending}>취소</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleReset}
                        disabled={resetMutation.isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {resetMutation.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                초기화 중...
                            </>
                        ) : (
                            '초기화'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
