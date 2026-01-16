/**
 * 주간 출석 통계 컴포넌트
 * 이번주(일요일~토요일) 전체 출석 통계를 표시
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllAttendanceStatsByWeek, type AttendanceStats } from '@/lib/supabase/attendance';
import { getCurrentWeekRange } from '@/lib/utils/date';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckCircle, XCircle, Clock, TrendingUp, BarChart3, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { BirthdayCard } from '@/components/attendance/BirthdayCard';

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
  const { user } = useAuth();
  const [allowedDepartments, setAllowedDepartments] = useState<string[]>([]);

  // 사용자 권한이 있는 부서 조회
  useEffect(() => {
    if (!user) return;

    import('@/lib/supabase/client').then(({ supabase }) => {
      (supabase
        .from('profiles') as any)
        .select('permission_scope, department_permissions')
        .eq('id', user.id)
        .single()
        .then(({ data: profile }: any) => {
          if (profile) {
            // 1. 관리자인지 확인 (관리자는 모든 부서 표시) -> 여기서는 '배정된 부서'만 표시하므로 권한 정보만 확인
            // 2. 부서 권한이 있는 부서 목록 추출
            const deptPerms = profile.department_permissions as Record<string, any> || {};
            const depts = Object.entries(deptPerms)
              .filter(([_, setting]: [string, any]) =>
                typeof setting === 'object' && setting?.permission_scope === 'department'
              )
              .map(([deptName]) => deptName);

            setAllowedDepartments(depts);
          }
        });
    });
  }, [user]);

  // 전체 출석 통계 조회
  const { data: allStats, isLoading: isLoadingAll } = useQuery({
    queryKey: ['weekly-attendance-stats', startDate, endDate],
    queryFn: () => getAllAttendanceStatsByWeek(startDate, endDate),
    staleTime: 5 * 60 * 1000,
  });

  // 전체 통계 집계
  const overallStats: AttendanceStats | null = allStats
    ? allStats.reduce(
      (acc, classStats) => ({
        total: acc.total + classStats.stats.total,
        present: acc.present + classStats.stats.present,
        absent: acc.absent + classStats.stats.absent,
        late: acc.late + classStats.stats.late,
        attendanceRate: 0,
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

  // 부서별 통계 집계
  const departmentStats = useMemo(() => {
    if (!allStats || allowedDepartments.length === 0) return [];

    const statsByDept = new Map<string, AttendanceStats>();

    allStats.forEach((stat) => {
      if (allowedDepartments.includes(stat.department)) {
        const current = statsByDept.get(stat.department) || {
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          attendanceRate: 0,
        };

        statsByDept.set(stat.department, {
          total: current.total + stat.stats.total,
          present: current.present + stat.stats.present,
          absent: current.absent + stat.stats.absent,
          late: current.late + stat.stats.late,
          attendanceRate: 0,
        });
      }
    });

    // 출석률 계산 및 배열변환
    return Array.from(statsByDept.entries()).map(([dept, stats]) => {
      const rate = stats.total > 0
        ? Math.round(((stats.present + stats.late) / stats.total) * 100 * 10) / 10
        : 0;
      return {
        department: dept,
        stats: { ...stats, attendanceRate: rate }
      };
    }).sort((a, b) => a.department.localeCompare(b.department)); // 이름순 정렬

  }, [allStats, allowedDepartments]);

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
      <CardContent className="space-y-8">
        {isLoadingAll ? (
          <div className="text-center py-4 text-gray-500">로딩 중...</div>
        ) : overallStats ? (
          <>
            {/* 전체 통계 */}
            <div>
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
            </div>

            {/* 부서별 통계 (권한이 있는 부서만) */}
            {departmentStats.length > 0 && (
              <div className="space-y-6 pt-4 border-t">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-gray-500" />
                  내 담당 부서 통계
                </h3>

                {departmentStats.map(({ department, stats }: { department: string; stats: AttendanceStats }) => (
                  <div key={department} className="space-y-3">
                    <h4 className="font-medium text-gray-700">{department}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <StatCard
                        icon={Users}
                        value={stats.total}
                        label="학생 수"
                        bgColor="bg-gray-50/50"
                        textColor="text-gray-600"
                      />
                      <StatCard
                        icon={CheckCircle}
                        value={stats.present}
                        label="출석"
                        bgColor="bg-green-50/50"
                        textColor="text-green-600"
                      />
                      <StatCard
                        icon={XCircle}
                        value={stats.absent}
                        label="결석"
                        bgColor="bg-red-50/50"
                        textColor="text-red-600"
                      />
                      <StatCard
                        icon={Clock}
                        value={stats.late}
                        label="지각"
                        bgColor="bg-amber-50/50"
                        textColor="text-amber-600"
                      />
                      <StatCard
                        icon={TrendingUp}
                        value={stats.attendanceRate}
                        label="출석률"
                        bgColor="bg-blue-50/50"
                        textColor="text-blue-600"
                      />
                    </div>
                    <AttendanceRateBar rate={stats.attendanceRate} />

                    {/* 부서별 이달의 생일자 */}
                    <div className="mt-4">
                      <BirthdayCard departmentName={department} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4 text-gray-500">데이터가 없습니다.</div>
        )}
      </CardContent>
    </Card>
  );
}
