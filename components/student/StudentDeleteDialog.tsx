'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface StudentDeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    count: number;
}

export function StudentDeleteDialog({
    open,
    onOpenChange,
    onConfirm,
    count,
}: StudentDeleteDialogProps) {
    const [confirmText, setConfirmText] = useState('');

    // 다이얼로그가 열릴 때마다 입력 초기화
    useEffect(() => {
        if (open) {
            setConfirmText('');
        }
    }, [open]);

    const isConfirmed = confirmText === '삭제합니다';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-red-600">학생 영구 삭제</DialogTitle>
                    <DialogDescription>
                        선택한 {count}명의 학생을 <span className="font-bold text-red-600">영구 삭제</span>하시겠습니까?
                        <br />
                        <br />
                        <span className="font-medium text-red-600 mb-2 block">
                            주의: 이 작업은 되돌릴 수 없습니다. 모든 데이터가 완전히 삭제됩니다.
                        </span>
                        <span>
                            진행하려면 아래 입력창에 <strong>삭제합니다</strong>를 입력하세요.
                        </span>
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Input
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="삭제합니다"
                        className="border-red-200 focus-visible:ring-red-500"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        취소
                    </Button>
                    <Button
                        onClick={onConfirm}
                        variant="destructive"
                        disabled={!isConfirmed}
                    >
                        삭제
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
