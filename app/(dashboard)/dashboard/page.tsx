/**
 * 대시보드 페이지
 * 교사가 담당하는 반의 주요 정보와 장기 결석 알림을 표시하는 페이지
 */

'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { AbsenceAlertBadge } from '@/components/absence/AbsenceAlertBadge';
import { AbsenceAlertList } from '@/components/absence/AbsenceAlertList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle, Users, Calendar, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  // DashboardLayout에서 인증 처리하므로 여기서는 user만 확인
  const teacherId = user?.id || undefined;

  const handleStudentClick = (studentId: string) => {
    router.push(`/students/${studentId}`);
  };

  return (
    <>
      <PageHeader
        title="대시보드"
        description="주요 정보를 한눈에 확인하세요"
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* 빠른 액션 카드: 출석 체크 */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" role="button" tabIndex={0} onClick={() => router.push('/attendance')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push('/attendance'); }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              출석 체크
            </CardTitle>
            <CardDescription>
              오늘의 출석을 빠르게 체크하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">출석 페이지로 이동</span>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>

              {/* 빠른 액션 카드: 학생 목록 */}
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" role="button" tabIndex={0} onClick={() => router.push('/students')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push('/students'); }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-500" />
                    학생 관리
                  </CardTitle>
                  <CardDescription>
                    학생 정보를 확인하고 관리하세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">학생 관리 페이지로 이동</span>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>

        {/* 장기 결석 알림 카드 */}
        {teacherId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  장기 결석 알림
                </div>
                <AbsenceAlertBadge teacherId={teacherId} />
              </CardTitle>
              <CardDescription>
                3주 이상 결석한 학생 목록
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AbsenceAlertList
                teacherId={teacherId}
                onStudentClick={handleStudentClick}
                className="border-0 shadow-none"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
