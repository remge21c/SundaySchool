'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useDepartments } from '@/hooks/useClasses';
import { getOrCreateUnassignedClass } from '@/lib/supabase/classes';

interface StudentDepartmentTransferDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (targetClassId: string, departmentName: string) => void;
    count: number;
    currentDepartment?: string;
}

export function StudentDepartmentTransferDialog({
    open,
    onOpenChange,
    onConfirm,
    count,
    currentDepartment,
}: StudentDepartmentTransferDialogProps) {
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    // 정렬된 부서 목록 조회
    const { data: allDepartments } = useDepartments();

    // 현재 부서 제외 (이미 API에서 정렬되어 옴)
    const departments = (allDepartments || []).filter((d) => d !== currentDepartment);

    const handleConfirm = async () => {
        if (!selectedDepartment) return;

        setIsLoading(true);
        try {
            // 대상 부서의 미배정 반 조회/생성
            const unassignedClass = await getOrCreateUnassignedClass(selectedDepartment);
            onConfirm(unassignedClass.id, selectedDepartment);
        } catch (error) {
            console.error('미배정 반 조회 실패:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>부서 이동</DialogTitle>
                    <DialogDescription>
                        선택한 {count}명의 학생을 다른 부서로 이동합니다.
                        <br />
                        학생들은 대상 부서의 &quot;미배정&quot; 반으로 이동되며,
                        해당 부서 관리자가 적절한 반으로 배정합니다.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                        <SelectTrigger>
                            <SelectValue placeholder="이동할 부서를 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                            {departments.map((dept) => (
                                <SelectItem key={dept} value={dept}>
                                    {dept}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        취소
                    </Button>
                    <Button onClick={handleConfirm} disabled={!selectedDepartment || isLoading}>
                        {isLoading ? '처리 중...' : '이동'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
