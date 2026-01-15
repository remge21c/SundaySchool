/**
 * 출석 통계 컴포넌트
 * 반별 출석 통계를 표시하는 컴포넌트
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { getAttendanceStats } from '@/lib/supabase/attendance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttendanceStatsProps {
  classId: string;
  date: string;
  className?: string;
}

export function AttendanceStats({ classId, date, className }: AttendanceStatsProps) {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['attendance-stats', classId, date],
    queryFn: () => getAttendanceStats(classId, date),
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>출석 통계</CardTitle>
          <CardDescription>통계를 불러오는 중...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">로딩 중...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>출석 통계</CardTitle>
          <CardDescription>통계를 불러오는 중 오류가 발생했습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-red-500">
            {error instanceof Error ? error.message : '알 수 없는 오류'}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          출석 통계
        </CardTitle>
        <CardDescription>오늘의 출석 현황을 확인하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* 전체 학생 */}
          <div className="flex flex-col items-center p-4 rounded-lg bg-gray-50">
            <Users className="h-8 w-8 text-gray-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">전체 학생</div>
          </div>

          {/* 출석 */}
          <div className="flex flex-col items-center p-4 rounded-lg bg-green-50">
            <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
            <div className="text-2xl font-bold text-green-700">{stats.present}</div>
            <div className="text-sm text-green-600">출석</div>
          </div>

          {/* 결석 */}
          <div className="flex flex-col items-center p-4 rounded-lg bg-red-50">
            <XCircle className="h-8 w-8 text-red-600 mb-2" />
            <div className="text-2xl font-bold text-red-700">{stats.absent}</div>
            <div className="text-sm text-red-600">결석</div>
          </div>

          {/* 지각 */}
          <div className="flex flex-col items-center p-4 rounded-lg bg-amber-50">
            <Clock className="h-8 w-8 text-amber-600 mb-2" />
            <div className="text-2xl font-bold text-amber-700">{stats.late}</div>
            <div className="text-sm text-amber-600">지각</div>
          </div>

          {/* 출석률 */}
          <div className="flex flex-col items-center p-4 rounded-lg bg-blue-50">
            <TrendingUp className="h-8 w-8 text-blue-600 mb-2" />
            <div className="text-2xl font-bold text-blue-700">{stats.attendanceRate}%</div>
            <div className="text-sm text-blue-600">출석률</div>
          </div>
        </div>

        {/* 출석률 프로그레스 바 */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">출석률</span>
            <span className="text-sm font-semibold text-gray-900">
              {stats.attendanceRate}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-500',
                stats.attendanceRate >= 80
                  ? 'bg-green-500'
                  : stats.attendanceRate >= 60
                    ? 'bg-amber-500'
                    : 'bg-red-500'
              )}
              style={{ width: `${stats.attendanceRate}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
