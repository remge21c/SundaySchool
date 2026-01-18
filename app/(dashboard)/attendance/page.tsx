/**
 * 출석 체크 페이지
 * 반별 학생 출석을 체크할 수 있는 페이지
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { StudentList } from '@/components/attendance/StudentList';
import { AttendanceStats } from '@/components/attendance/AttendanceStats';
import { DepartmentAttendanceStats } from '@/components/attendance/DepartmentAttendanceStats';
import { AttendanceResetButton } from '@/components/attendance/AttendanceResetButton';

import { ClassSidebar } from '@/components/class/ClassSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Loader2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useClass, useClassesByTeacher } from '@/hooks/useClasses';
import { useAuth } from '@/hooks/useAuth';
import { getUserRole } from '@/lib/utils/auth';
import { getCurrentWeekRange } from '@/lib/utils/date';

export default function AttendancePage() {
  const { user, loading: authLoading } = useAuth();

  // -- Permission State --
  const [userRole, setUserRole] = useState<'admin' | 'teacher' | 'parent' | null>(null);
  const [permissionChecked, setPermissionChecked] = useState(false);

  // 이번주 일요일 날짜로 고정
  const selectedDate = useMemo(() => {
    const weekRange = getCurrentWeekRange();
    return weekRange.startDate;
  }, []);

  // 선택된 반 ID
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  // 선택된 부서
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [isAutoSelected, setIsAutoSelected] = useState(false); // 자동 선택 여부 추적

  // 교사의 담당 반 조회
  const { data: teacherClasses } = useClassesByTeacher(user?.id, undefined);

  // 선택된 반 정보 조회
  const { data: selectedClass } = useClass(selectedClassId);

  // 권한 확인 및 교사 자동 반 선택
  useEffect(() => {
    // 인증 로딩 중이면 스킵
    if (authLoading || !user) {
      return;
    }

    // 사용자 역할 확인
    getUserRole().then((role) => {
      setUserRole(role);

      if (role === 'admin') {
        // 관리자는 바로 통과
        setPermissionChecked(true);
      } else if (role === 'teacher') {
        // 교사: 담당 반이 있으면 자동 선택
        if (teacherClasses && teacherClasses.length > 0 && !selectedClassId && !isAutoSelected) {
          setSelectedClassId(teacherClasses[0].id);
          setIsAutoSelected(true);
        }
        setPermissionChecked(true);
      } else {
        // 기타 역할
        setPermissionChecked(true);
      }
    });
  }, [user, authLoading, teacherClasses, selectedClassId, isAutoSelected]);

  const formattedDate = format(new Date(selectedDate), 'yyyy년 M월 d일 (EEE)', {
    locale: ko,
  });

  // 반 선택 핸들러
  const handleSelectClass = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedDepartment(null); // 반 선택 시 부서 선택 해제
  };

  // 부서 선택 핸들러
  const handleSelectDepartment = (dept: string) => {
    setSelectedDepartment(dept);
    setSelectedClassId(null); // 부서 선택 시 반 선택 해제
  };

  // 반 배정이 없는 교사 확인
  const hasNoClassAssignment = userRole === 'teacher' && (!teacherClasses || teacherClasses.length === 0);

  return (
    <>
      <PageHeader
        title="출석 체크"
        description="학생의 출석 상태를 터치로 빠르게 체크하세요"
      />

      {/* 권한 확인 중 로딩 */}
      {!permissionChecked ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-600">권한 확인 중...</span>
        </div>
      ) : hasNoClassAssignment ? (
        /* 반 배정 없는 교사에게 안내 메시지 */
        <Card className="mt-6">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">반 배정이 필요합니다</h3>
            <p className="text-gray-500">
              출석 체크 기능을 사용하려면 관리자에게 반 배정을 요청해 주세요.
            </p>
          </CardContent>
        </Card>
      ) : (
        /* 레이아웃: 모바일에서는 세로(Stack), 데스크톱에서는 가로(Flex) */
        <div className="flex flex-col gap-6 md:flex-row">
          {/* 반 선택 사이드바 - 모바일에서는 상단 전체 폭, 데스크톱에서는 좌측 고정 폭 */}
          <div className="md:w-64 md:flex-shrink-0">
            <ClassSidebar
              onSelect={handleSelectClass}
              selectedClassId={selectedClassId || undefined}
              onSelectDepartment={handleSelectDepartment}
              selectedDepartment={selectedDepartment || undefined}
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

            {/* 부서 선택 시: 부서 출석 통계 */}
            {selectedDepartment && (
              <DepartmentAttendanceStats department={selectedDepartment} date={selectedDate} />
            )}

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

            {/* 출석 통계 (반 선택 시) */}
            {selectedClassId && (
              <AttendanceStats classId={selectedClassId} date={selectedDate} />
            )}

            {/* 이달의 생일자 표시 제거됨 */}

            {/* 학생 리스트 (반 선택 시) */}
            {selectedClassId ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">학생 목록</h2>
                  <AttendanceResetButton classId={selectedClassId} date={selectedDate} />
                </div>
                <StudentList classId={selectedClassId} date={selectedDate} />
              </div>
            ) : selectedDepartment ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">{selectedDepartment}의 개별 반을 선택하면 학생 목록이 표시됩니다</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">반을 선택해주세요</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </>
  );
}

