/**
 * 장기 결석 알림 목록 컴포넌트
 * 장기 결석 학생 목록을 표시하는 컴포넌트
 */

'use client';

import { useAbsenceAlerts } from '@/hooks/useAbsenceAlerts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { GetLongTermAbsentStudentsParams } from '@/types/absence-alert';
import { AlertCircle, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AbsenceAlertListProps {
  /** 반 ID (class_id 또는 teacher_id 중 하나 필수) */
  classId?: string;
  /** 교사 ID (class_id 또는 teacher_id 중 하나 필수) */
  teacherId?: string;
  /** 경고 기준 주수 (기본값: 3주) */
  weeks?: number;
  /** 학생 클릭 핸들러 (선택) */
  onStudentClick?: (studentId: string) => void;
  /** 추가 클래스명 */
  className?: string;
}

/**
 * 장기 결석 알림 목록
 * 장기 결석 학생 목록을 카드 형태로 표시합니다.
 */
export function AbsenceAlertList({
  classId,
  teacherId,
  weeks,
  onStudentClick,
  className,
}: AbsenceAlertListProps) {
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

  const { data: absentStudents, isLoading, isError, error } = useAbsenceAlerts(params);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          장기 결석 알림
        </CardTitle>
        <CardDescription>
          {weeks ? `${weeks}주 이상` : '3주 이상'} 결석한 학생 목록
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="text-center py-8 text-gray-500">로딩 중...</div>
        )}

        {isError && (
          <div className="text-center py-8 text-red-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-400" />
            <p className="font-medium">오류가 발생했습니다</p>
            <p className="text-sm text-gray-600 mt-1">
              {error instanceof Error
                ? error.message.includes('class_id 또는 teacher_id')
                  ? '조회할 반 정보가 없습니다.'
                  : error.message
                : '알 수 없는 오류'}
            </p>
          </div>
        )}

        {!isLoading && !isError && absentStudents && absentStudents.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            장기 결석 학생이 없습니다.
          </div>
        )}

        {!isLoading && !isError && absentStudents && absentStudents.length > 0 && (
          <div className="space-y-2">
            {absentStudents.map((student) => (
              <button
                key={student.student_id}
                type="button"
                onClick={() => onStudentClick?.(student.student_id)}
                disabled={!onStudentClick}
                className={cn(
                  'w-full text-left p-4 rounded-lg border transition-colors',
                  'hover:bg-gray-50 active:bg-gray-100',
                  onStudentClick && 'cursor-pointer',
                  !onStudentClick && 'cursor-default',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                )}
                aria-label={`${student.student_name} - ${student.daysSinceLastAttendance}일째 결석`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-base">{student.student_name}</div>
                      {student.class_name && (
                        <div className="text-sm text-gray-600">{student.class_name}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {student.daysSinceLastAttendance}일째
                      </span>
                    </div>
                    {student.lastAttendanceDate && (
                      <div className="text-xs text-gray-500">
                        마지막 출석: {new Date(student.lastAttendanceDate).toLocaleDateString('ko-KR')}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
