/**
 * 출석 체크 페이지
 * 반별 학생 출석을 체크할 수 있는 페이지
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { StudentList } from '@/components/attendance/StudentList';
import { AttendanceStats } from '@/components/attendance/AttendanceStats';
import { ClassSidebar } from '@/components/class/ClassSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useClass, useClassesByTeacher } from '@/hooks/useClasses';
import { useAuth } from '@/hooks/useAuth';
import { getUserRole } from '@/lib/utils/auth';
import { getCurrentWeekRange } from '@/lib/utils/date';

export default function AttendancePage() {
  const { user, loading: authLoading } = useAuth();
  
  // 이번주 일요일 날짜로 고정
  const selectedDate = useMemo(() => {
    const weekRange = getCurrentWeekRange();
    return weekRange.startDate;
  }, []);

  // 선택된 반 ID
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isAutoSelected, setIsAutoSelected] = useState(false); // 자동 선택 여부 추적

  // 교사의 담당 반 조회
  const { data: teacherClasses } = useClassesByTeacher(user?.id, undefined);
  
  // 선택된 반 정보 조회
  const { data: selectedClass } = useClass(selectedClassId);

  // 교사가 로그인하고 담당 반이 있으면 자동 선택
  useEffect(() => {
    // 인증 로딩 중이거나 이미 자동 선택했으면 스킵
    if (authLoading || isAutoSelected || !user) {
      return;
    }

    // 사용자 역할 확인
    getUserRole().then((role) => {
      // 관리자가 아니고, 교사이며, 담당 반이 있고, 아직 반이 선택되지 않았으면
      if (role !== 'admin' && role === 'teacher' && teacherClasses && teacherClasses.length > 0 && !selectedClassId) {
        // 첫 번째 담당 반을 자동 선택
        setSelectedClassId(teacherClasses[0].id);
        setIsAutoSelected(true);
      }
    });
  }, [user, authLoading, teacherClasses, selectedClassId, isAutoSelected]);

  const formattedDate = format(new Date(selectedDate), 'yyyy년 M월 d일 (EEE)', {
    locale: ko,
  });

  return (
    <>
      <PageHeader
        title="출석 체크"
        description="학생의 출석 상태를 터치로 빠르게 체크하세요"
      />

      {/* 레이아웃: 모바일에서는 세로(Stack), 데스크톱에서는 가로(Flex) */}
      <div className="flex flex-col gap-6 md:flex-row">
        {/* 반 선택 사이드바 - 모바일에서는 상단 전체 폭, 데스크톱에서는 좌측 고정 폭 */}
        <div className="md:w-64 md:flex-shrink-0">
          <ClassSidebar
            onSelect={setSelectedClassId}
            selectedClassId={selectedClassId || undefined}
          />
        </div>

        {/* 메인 컨텐츠 - 모바일/데스크톱 공통으로 가변 폭 */}
        <div className="flex-1 space-y-6">
          {/* 날짜 정보 카드 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                출석 체크 날짜
              </CardTitle>
              <CardDescription>
                출석 체크는 이번주 일요일 날짜로 기록됩니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-900">{formattedDate}</p>
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
