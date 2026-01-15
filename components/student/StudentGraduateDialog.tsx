'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StudentGraduateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (year: number) => void;
    count?: number;
}

export function StudentGraduateDialog({
    open,
    onOpenChange,
    onConfirm,
    count,
}: StudentGraduateDialogProps) {
    const [year, setYear] = useState<number>(new Date().getFullYear());

    // Reset year when dialog opens
    useEffect(() => {
        if (open) {
            setYear(new Date().getFullYear());
        }
    }, [open]);

    const handleConfirm = () => {
        onConfirm(year);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>학생 졸업 처리</DialogTitle>
                    <DialogDescription>
                        선택한 {count}명의 학생을 졸업 처리시겠습니까?
                        <br />
                        졸업 처리된 학생은 학생 목록에서 숨겨집니다.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="year" className="text-right">
                            졸업 연도
                        </Label>
                        <Input
                            id="year"
                            type="number"
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="col-span-3"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        취소
                    </Button>
                    <Button onClick={handleConfirm}>
                        졸업 처리
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
