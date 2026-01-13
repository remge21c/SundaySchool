/**
 * 출석 체크 페이지
 * 반별 학생 출석을 체크할 수 있는 페이지
 */

'use client';

import { useState } from 'react';
import { StudentList } from '@/components/attendance/StudentList';
import { AttendanceStats } from '@/components/attendance/AttendanceStats';
import { ClassSidebar } from '@/components/class/ClassSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useClass } from '@/hooks/useClasses';

export default function AttendancePage() {
  // 오늘 날짜를 기본값으로 사용
  const [selectedDate, setSelectedDate] = useState(() => {
    return format(new Date(), 'yyyy-MM-dd');
  });

  // 선택된 반 ID
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // 선택된 반 정보 조회
  const { data: selectedClass } = useClass(selectedClassId);

  const formattedDate = format(new Date(selectedDate), 'yyyy년 M월 d일 (EEE)', {
    locale: ko,
  });

  return (
    <>
      <PageHeader
        title="출석 체크"
        description="학생의 출석 상태를 터치로 빠르게 체크하세요"
      />

      <div className="flex gap-6">
        {/* 반 선택 사이드바 */}
        <div className="w-64 flex-shrink-0">
          <ClassSidebar
            onSelect={setSelectedClassId}
            selectedClassId={selectedClassId || undefined}
          />
        </div>

        {/* 메인 컨텐츠 */}
        <div className="flex-1 space-y-6">
          {/* 날짜 선택 카드 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                날짜 선택
              </CardTitle>
              <CardDescription>
                출석을 체크할 날짜를 선택하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="max-w-xs"
              />
              <p className="mt-2 text-sm text-gray-600">{formattedDate}</p>
            </CardContent>
          </Card>

          {/* 선택된 반 정보 */}
          {selectedClass && (
            <Card>
              <CardHeader>
                <CardTitle>선택된 반</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">
                  {selectedClass.department} - {selectedClass.name}
                </p>
              </CardContent>
            </Card>
          )}

          {/* 출석 통계 */}
          {selectedClassId && (
            <AttendanceStats classId={selectedClassId} date={selectedDate} />
          )}

          {/* 학생 리스트 */}
          {selectedClassId ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">학생 목록</h2>
              <StudentList classId={selectedClassId} date={selectedDate} />
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">반을 선택해주세요</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
