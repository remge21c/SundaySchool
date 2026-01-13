/**
 * 결석 사유 선택 모달 컴포넌트
 * 결석 선택 시 사유를 입력받는 모달
 */

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
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface AbsenceReasonModalProps {
  open: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  studentName?: string;
}

/**
 * 미리 정의된 결석 사유 목록
 */
const PREDEFINED_REASONS = ['아픔', '여행', '늦잠', '기타'] as const;

export function AbsenceReasonModal({
  open,
  onConfirm,
  onCancel,
  studentName,
}: AbsenceReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  const handleReasonSelect = (reason: string) => {
    if (reason === '기타') {
      setIsCustomMode(true);
      setSelectedReason(null);
    } else {
      setIsCustomMode(false);
      setSelectedReason(reason);
      setCustomReason('');
    }
  };

  const handleConfirm = () => {
    if (isCustomMode) {
      if (customReason.trim()) {
        onConfirm(customReason.trim());
      }
    } else if (selectedReason) {
      onConfirm(selectedReason);
    }
  };

  const handleCancel = () => {
    setSelectedReason(null);
    setCustomReason('');
    setIsCustomMode(false);
    onCancel();
  };

  const canConfirm = isCustomMode
    ? customReason.trim().length > 0
    : selectedReason !== null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>결석 사유 선택</DialogTitle>
          <DialogDescription>
            {studentName ? `${studentName} 학생의 ` : ''}결석 사유를 선택해주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 미리 정의된 사유 버튼 */}
          {!isCustomMode && (
            <div className="grid grid-cols-2 gap-2">
              {PREDEFINED_REASONS.map((reason) => (
                <Button
                  key={reason}
                  variant={selectedReason === reason ? 'default' : 'outline'}
                  onClick={() => handleReasonSelect(reason)}
                  className={cn(
                    'h-auto py-3',
                    selectedReason === reason && 'bg-primary text-primary-foreground'
                  )}
                >
                  {reason}
                </Button>
              ))}
            </div>
          )}

          {/* 커스텀 사유 입력 */}
          {isCustomMode && (
            <div className="space-y-2">
              <label className="text-sm font-medium">직접 입력</label>
              <Input
                placeholder="결석 사유를 입력하세요"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canConfirm) {
                    handleConfirm();
                  }
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsCustomMode(false);
                  setCustomReason('');
                }}
                className="text-xs"
              >
                ← 미리 정의된 사유로 돌아가기
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            취소
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm}>
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
