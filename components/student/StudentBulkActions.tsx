'use client';

import { Button } from '@/components/ui/button';
import { Trash2, MoveRight, GraduationCap, ArrowUpCircle, Building2 } from 'lucide-react';

interface StudentBulkActionsProps {
    selectedCount: number;
    onMove: () => void;
    onTransferDept: () => void;
    onPromote: () => void;
    onGraduate: () => void;
    onDelete: () => void;
    showGraduateButton?: boolean;
}

export function StudentBulkActions({
    selectedCount,
    onMove,
    onTransferDept,
    onPromote,
    onGraduate,
    onDelete,
    showGraduateButton,
}: StudentBulkActionsProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 bg-white rounded-lg shadow-lg border animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="px-3 py-1 font-medium text-sm text-gray-600 border-r mr-1">
                {selectedCount}명 선택됨
            </div>

            <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={onMove}
            >
                <MoveRight className="h-4 w-4 mr-2" />
                반 이동
            </Button>

            <Button
                variant="ghost"
                size="sm"
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={onTransferDept}
            >
                <Building2 className="h-4 w-4 mr-2" />
                부서 이동
            </Button>

            <Button
                variant="ghost"
                size="sm"
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                onClick={onPromote}
            >
                <ArrowUpCircle className="h-4 w-4 mr-2" />
                학년 승급
            </Button>

            {showGraduateButton && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                    onClick={onGraduate}
                >
                    <GraduationCap className="h-4 w-4 mr-2" />
                    졸업
                </Button>
            )}

            <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={onDelete}
            >
                <Trash2 className="h-4 w-4 mr-2" />
                삭제
            </Button>
        </div>
    );
}
