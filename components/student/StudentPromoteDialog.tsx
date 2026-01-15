'use client';

import { useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import type { Student } from '@/types/student';

interface StudentPromoteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    students: Student[];
    isLoading?: boolean;
}

export function StudentPromoteDialog({
    open,
    onOpenChange,
    onConfirm,
    students,
    isLoading = false,
}: StudentPromoteDialogProps) {
    // 학년별 요약 계산
    const summary = useMemo(() => {
        const gradeCount: Record<number, number> = {};
        let grade6Count = 0;

        for (const student of students) {
            const grade = student.grade || 0;
            if (grade >= 6) {
                grade6Count++;
            } else {
                gradeCount[grade] = (gradeCount[grade] || 0) + 1;
            }
        }

        return { gradeCount, grade6Count };
    }, [students]);

    const promotableCount = students.length - summary.grade6Count;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>학년 승급</DialogTitle>
                    <DialogDescription>
                        선택한 학생들의 학년을 1단계 승급합니다.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-3">
                    <div className="text-sm text-gray-600">
                        <strong>승급 내역:</strong>
                    </div>
                    <ul className="text-sm space-y-1 bg-gray-50 p-3 rounded-lg">
                        {Object.entries(summary.gradeCount)
                            .sort(([a], [b]) => Number(a) - Number(b))
                            .map(([grade, count]) => (
                                <li key={grade}>
                                    • {grade === '0' ? '미배정(0학년)' : `${grade}학년`} → {Number(grade) === 0 ? '1' : Number(grade) + 1}학년: <strong>{count}명</strong>
                                </li>
                            ))}
                    </ul>

                    {summary.grade6Count > 0 && (
                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div>
                                <strong>6학년 학생 {summary.grade6Count}명</strong>은 승급 대상에서 제외됩니다.
                                <br />
                                졸업 처리를 이용해주세요.
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        취소
                    </Button>
                    <Button onClick={onConfirm} disabled={promotableCount === 0 || isLoading}>
                        {isLoading ? '처리 중...' : `${promotableCount}명 승급`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
