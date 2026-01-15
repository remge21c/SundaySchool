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
import { useAllClasses } from '@/hooks/useClasses'; // Assuming this hook exists or similar
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface StudentMoveDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (classId: string) => void;
    selectedDepartment?: string;
}

export function StudentMoveDialog({
    open,
    onOpenChange,
    onConfirm,
    selectedDepartment,
}: StudentMoveDialogProps) {
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const { data: classes, isLoading } = useAllClasses();

    // 선택된 부서의 반만 필터링하거나 전체 반 표시
    const filteredClasses = selectedDepartment
        ? classes?.filter(c => c.department === selectedDepartment)
        : classes;

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            setSelectedClassId('');
        }
    }, [open]);

    const handleConfirm = () => {
        if (selectedClassId) {
            onConfirm(selectedClassId);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>학생 반 이동</DialogTitle>
                    <DialogDescription>
                        선택한 학생들을 이동시킬 반을 선택해주세요.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {isLoading ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                            <SelectTrigger>
                                <SelectValue placeholder="이동할 반 선택" />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredClasses?.map((cls) => (
                                    <SelectItem key={cls.id} value={cls.id}>
                                        {cls.department} - {cls.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        취소
                    </Button>
                    <Button onClick={handleConfirm} disabled={!selectedClassId}>
                        이동
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
