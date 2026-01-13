/**
 * 출석 체크 카드 컴포넌트
 * 학생 한 명의 출석 상태를 표시하고 변경할 수 있는 카드
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { upsertAttendanceLog, getAttendanceLogByStudentAndDate } from '@/lib/supabase/attendance';
import { Card } from '@/components/ui/card';
import { AbsenceReasonModal } from './AbsenceReasonModal';
import type { Student } from '@/types/student';
import type { AttendanceStatus } from '@/types/attendance';
import { Check, X, Clock, User } from 'lucide-react';

interface AttendanceCardProps {
  student: Student;
  date: string; // YYYY-MM-DD 형식
  classId: string;
}

/**
 * 출석 상태에 따른 스타일
 */
const getStatusStyle = (status: AttendanceStatus | null) => {
  switch (status) {
    case 'present':
      return 'border-green-500 bg-green-50';
    case 'absent':
      return 'border-red-500 bg-red-50';
    case 'late':
      return 'border-amber-500 bg-amber-50';
    default:
      return 'border-gray-200 bg-white';
  }
};

/**
 * 출석 상태에 따른 아이콘
 */
const getStatusIcon = (status: AttendanceStatus | null) => {
  switch (status) {
    case 'present':
      return <Check className="h-5 w-5 text-green-600" />;
    case 'absent':
      return <X className="h-5 w-5 text-red-600" />;
    case 'late':
      return <Clock className="h-5 w-5 text-amber-600" />;
    default:
      return null;
  }
};

/**
 * 출석 상태에 따른 텍스트
 */
const getStatusText = (status: AttendanceStatus | null) => {
  switch (status) {
    case 'present':
      return '출석';
    case 'absent':
      return '결석';
    case 'late':
      return '지각';
    default:
      return '미체크';
  }
};

/**
 * 다음 출석 상태로 토글
 * 순서: 미체크(null) → 출석(present) → 지각(late) → 결석(absent) → 출석(present) (다시 시작)
 */
const getNextStatus = (currentStatus: AttendanceStatus | null): AttendanceStatus => {
  if (!currentStatus) {
    // 미체크 → 출석
    return 'present';
  }
  if (currentStatus === 'present') {
    // 출석 → 지각
    return 'late';
  }
  if (currentStatus === 'late') {
    // 지각 → 결석
    return 'absent';
  }
  // 결석 → 출석 (다시 시작)
  return 'present';
};

export function AttendanceCard({ student, date, classId }: AttendanceCardProps) {
  const queryClient = useQueryClient();
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);

  // 출석 기록 조회
  const { data: attendance, isLoading } = useQuery({
    queryKey: ['attendance', student.id, date],
    queryFn: () => getAttendanceLogByStudentAndDate(student.id, date),
    staleTime: 30 * 1000, // 30초간 fresh 상태 유지
  });

  // 출석 기록 업데이트 (Optimistic Update)
  const mutation = useMutation({
    mutationFn: async ({
      status,
      reason,
    }: {
      status: AttendanceStatus;
      reason?: string | null;
    }) => {
      return upsertAttendanceLog({
        student_id: student.id,
        class_id: classId,
        date,
        status,
        reason: reason ?? null,
      });
    },
    // Optimistic Update: 서버 응답 전에 UI 업데이트
    onMutate: async (newStatus) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ['attendance', student.id, date] });

      // 이전 값 저장 (롤백용)
      const previousAttendance = queryClient.getQueryData(['attendance', student.id, date]);

      // Optimistic Update
      queryClient.setQueryData(['attendance', student.id, date], (old: any) => {
        if (old) {
          return {
            ...old,
            status: newStatus.status,
            reason: newStatus.reason ?? null,
          };
        }
        return {
          id: `temp-${Date.now()}`,
          student_id: student.id,
          class_id: classId,
          date,
          status: newStatus.status,
          reason: newStatus.reason ?? null,
          created_at: new Date().toISOString(),
        };
      });

      return { previousAttendance };
    },
    // 에러 발생 시 롤백
    onError: (err, newStatus, context) => {
      if (context?.previousAttendance) {
        queryClient.setQueryData(
          ['attendance', student.id, date],
          context.previousAttendance
        );
      }
    },
    // 성공 시 쿼리 무효화하여 서버 데이터로 갱신
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', student.id, date] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'class', classId, date] });
      // 출석 통계도 무효화하여 실시간 업데이트
      queryClient.invalidateQueries({ queryKey: ['attendance-stats', classId, date] });
    },
  });

  const handleClick = () => {
    // 모달이 열려있거나 mutation이 진행 중이면 클릭 무시
    if (isAbsenceModalOpen || mutation.isPending || isLoading) return;

    const nextStatus = getNextStatus(attendance?.status || null);

    // 결석 선택 시 모달 표시
    if (nextStatus === 'absent') {
      setIsAbsenceModalOpen(true);
    } else {
      // 출석 또는 지각은 바로 저장
      mutation.mutate({ status: nextStatus });
    }
  };

  const handleAbsenceReasonConfirm = (reason: string) => {
    // mutation 완료 후 모달 닫기
    mutation.mutate(
      { status: 'absent', reason },
      {
        onSuccess: () => {
          setIsAbsenceModalOpen(false);
        },
        onError: () => {
          // 에러 발생 시에도 모달은 닫기 (사용자가 다시 시도할 수 있도록)
          setIsAbsenceModalOpen(false);
        },
      }
    );
  };

  const handleAbsenceReasonCancel = () => {
    setIsAbsenceModalOpen(false);
  };

  const currentStatus = attendance?.status || null;

  return (
    <Card
      className={`
        min-h-[48px] p-4 cursor-pointer transition-all
        hover:shadow-md active:scale-95
        ${getStatusStyle(currentStatus)}
        ${mutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`${student.name} 출석 체크`}
      aria-busy={mutation.isPending || isLoading}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* 프로필 사진 */}
          <div className="flex-shrink-0">
            {student.photo_url ? (
              <img
                src={student.photo_url}
                alt={student.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                <User className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
          {getStatusIcon(currentStatus)}
          <div>
            <div className="font-semibold text-base">{student.name}</div>
            <div className="text-sm text-gray-600">{student.grade}학년</div>
          </div>
        </div>
        <div className="text-sm font-medium text-gray-700">
          {getStatusText(currentStatus)}
        </div>
      </div>
      {attendance?.reason && (
        <div className="mt-2 text-xs text-gray-500">
          사유: {attendance.reason}
        </div>
      )}

      {/* 결석 사유 선택 모달 */}
      <AbsenceReasonModal
        open={isAbsenceModalOpen}
        onConfirm={handleAbsenceReasonConfirm}
        onCancel={handleAbsenceReasonCancel}
        studentName={student.name}
      />
    </Card>
  );
}
