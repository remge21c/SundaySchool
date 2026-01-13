/**
 * 학생 리스트 컴포넌트
 * 반별 학생 목록을 출석 카드 형태로 표시
 */

'use client';

import { useStudentsByClass } from '@/hooks/useStudents';
import { AttendanceCard } from './AttendanceCard';
import { Loader2 } from 'lucide-react';

interface StudentListProps {
  classId: string;
  date: string; // YYYY-MM-DD 형식
  className?: string;
}

export function StudentList({ classId, date, className }: StudentListProps) {
  const { data: students, isLoading, error } = useStudentsByClass(classId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">학생 목록을 불러오는 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-600">학생 목록을 불러오는데 실패했습니다.</p>
        <p className="text-sm text-gray-500 mt-2">{error.message}</p>
      </div>
    );
  }

  if (!students || students.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">등록된 학생이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className || ''}`}>
      {students.map((student) => (
        <AttendanceCard
          key={student.id}
          student={student}
          date={date}
          classId={classId}
        />
      ))}
    </div>
  );
}
