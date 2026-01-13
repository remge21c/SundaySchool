/**
 * 주간 출석 통계 컴포넌트
 * 이번주(일요일~토요일) 전체 출석 통계를 표시
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { getAllAttendanceStatsByWeek, type AttendanceStats } from '@/lib/supabase/attendance';
import { getCurrentWeekRange } from '@/lib/utils/date';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckCircle, XCircle, Clock, TrendingUp, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeeklyAttendanceStatsProps {
  className?: string;
}

/**
 * 통계 카드 아이템
 */
function StatCard({ icon: Icon, value, label, bgColor, textColor }: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  bgColor: string;
  textColor: string;
}) {
  return (
    <div className={cn('flex flex-col items-center p-4 rounded-lg', bgColor)}>
      <Icon className={cn('h-6 w-6 mb-2', textColor)} />
      <div className={cn('text-xl font-bold', textColor)}>{value}</div>
      <div className={cn('text-xs', textColor)}>{label}</div>
    </div>
  );
}

/**
 * 출석률 프로그레스 바
 */
function AttendanceRateBar({ rate }: { rate: number }) {
  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-gray-700">출석률</span>
        <span className="text-xs font-semibold text-gray-900">{rate}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-500',
            rate >= 80 ? 'bg-green-500' : rate >= 60 ? 'bg-amber-500' : 'bg-red-500'
          )}
          style={{ width: `${rate}%` }}
        />
      </div>
    </div>
  );
}

export function WeeklyAttendanceStats({ className }: WeeklyAttendanceStatsProps) {
  const { startDate, endDate } = getCurrentWeekRange();
  
  // 전체 출석 통계 조회
  const { data: allStats, isLoading: isLoadingAll } = useQuery({
    queryKey: ['weekly-attendance-stats', startDate, endDate],
    queryFn: () => getAllAttendanceStatsByWeek(startDate, endDate),
    staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
  });

  // 전체 통계 집계 (모든 반의 통계 합산)
  const overallStats: AttendanceStats | null = allStats
    ? allStats.reduce(
        (acc, classStats) => ({
          total: acc.total + classStats.stats.total,
          present: acc.present + classStats.stats.present,
          absent: acc.absent + classStats.stats.absent,
          late: acc.late + classStats.stats.late,
          attendanceRate: 0, // 아래에서 계산
        }),
        { total: 0, present: 0, absent: 0, late: 0, attendanceRate: 0 }
      )
    : null;

  if (overallStats) {
    overallStats.attendanceRate =
      overallStats.total > 0
        ? Math.round(((overallStats.present + overallStats.late) / overallStats.total) * 100 * 10) / 10
        : 0;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          주일학교 전체 출석 통계 (이번주)
        </CardTitle>
        <CardDescription>
          {startDate} ~ {endDate}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingAll ? (
          <div className="text-center py-4 text-gray-500">로딩 중...</div>
        ) : overallStats ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <StatCard
                icon={Users}
                value={overallStats.total}
                label="전체 학생"
                bgColor="bg-gray-50"
                textColor="text-gray-600"
              />
              <StatCard
                icon={CheckCircle}
                value={overallStats.present}
                label="출석"
                bgColor="bg-green-50"
                textColor="text-green-600"
              />
              <StatCard
                icon={XCircle}
                value={overallStats.absent}
                label="결석"
                bgColor="bg-red-50"
                textColor="text-red-600"
              />
              <StatCard
                icon={Clock}
                value={overallStats.late}
                label="지각"
                bgColor="bg-amber-50"
                textColor="text-amber-600"
              />
              <StatCard
                icon={TrendingUp}
                value={overallStats.attendanceRate}
                label="출석률 (%)"
                bgColor="bg-blue-50"
                textColor="text-blue-600"
              />
            </div>
            <AttendanceRateBar rate={overallStats.attendanceRate} />
          </>
        ) : (
          <div className="text-center py-4 text-gray-500">데이터가 없습니다.</div>
        )}
      </CardContent>
    </Card>
  );
}
