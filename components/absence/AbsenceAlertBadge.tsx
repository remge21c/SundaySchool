/**
 * 장기 결석 알림 배지 컴포넌트
 * 장기 결석 학생 수를 표시하는 배지
 */

'use client';

import { useAbsenceAlerts } from '@/hooks/useAbsenceAlerts';
import type { GetLongTermAbsentStudentsParams } from '@/types/absence-alert';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface AbsenceAlertBadgeProps {
  /** 반 ID (class_id 또는 teacher_id 중 하나 필수) */
  classId?: string;
  /** 교사 ID (class_id 또는 teacher_id 중 하나 필수) */
  teacherId?: string;
  /** 경고 기준 주수 (기본값: 3주) */
  weeks?: number;
  /** 클릭 핸들러 (선택) */
  onClick?: () => void;
  /** 추가 클래스명 */
  className?: string;
}

/**
 * 장기 결석 알림 배지
 * 장기 결석 학생이 있을 때만 배지를 표시합니다.
 */
export function AbsenceAlertBadge({
  classId,
  teacherId,
  weeks,
  onClick,
  className,
}: AbsenceAlertBadgeProps) {
  // class_id 또는 teacher_id 중 하나는 필수
  const params: GetLongTermAbsentStudentsParams = {};
  if (classId) {
    params.class_id = classId;
  }
  if (teacherId) {
    params.teacher_id = teacherId;
  }
  if (weeks) {
    params.weeks = weeks;
  }

  const { data: absentStudents, isLoading, isError } = useAbsenceAlerts(params);

  // 로딩 중이거나 에러 발생 시 배지 표시하지 않음
  if (isLoading || isError) {
    return null;
  }

  // 장기 결석 학생이 없으면 배지 표시하지 않음
  if (!absentStudents || absentStudents.length === 0) {
    return null;
  }

  const count = absentStudents.length;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative inline-flex items-center justify-center',
        'rounded-full bg-red-500 text-white',
        'min-w-[24px] h-6 px-2',
        'text-xs font-bold',
        'hover:bg-red-600 active:bg-red-700',
        'transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
        className
      )}
      aria-label={`장기 결석 학생 ${count}명`}
      aria-live="polite"
    >
      <AlertCircle className="h-3 w-3 mr-1" aria-hidden="true" />
      <span>{count}</span>
    </button>
  );
}
