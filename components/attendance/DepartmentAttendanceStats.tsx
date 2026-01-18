/**
 * 부서별 출석 통계 컴포넌트
 * 부서 전체의 출석 통계를 표시하는 컴포넌트
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { getDepartmentAttendanceStats, getDepartmentAbsentees } from '@/lib/supabase/attendance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckCircle, XCircle, Clock, TrendingUp, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DepartmentAttendanceStatsProps {
    department: string;
    date: string;
    className?: string;
}

export function DepartmentAttendanceStats({ department, date, className }: DepartmentAttendanceStatsProps) {
    // 통계 조회 (캐싱 5분)
    const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
        queryKey: ['department-attendance-stats', department, date],
        queryFn: () => getDepartmentAttendanceStats(department, date),
        staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    });

    // 결석자 목록 조회 (캐싱 5분)
    const { data: absentees, isLoading: absenteesLoading } = useQuery({
        queryKey: ['department-absentees', department, date],
        queryFn: () => getDepartmentAbsentees(department, date),
        staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    });

    if (statsLoading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {department} 출석 통계
                    </CardTitle>
                    <CardDescription>통계를 불러오는 중...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-4 text-gray-500">로딩 중...</div>
                </CardContent>
            </Card>
        );
    }

    if (statsError) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {department} 출석 통계
                    </CardTitle>
                    <CardDescription>통계를 불러오는 중 오류가 발생했습니다.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-4 text-red-500">
                        {statsError instanceof Error ? statsError.message : '알 수 없는 오류'}
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
                    <Building2 className="h-5 w-5" />
                    {department} 출석 통계
                </CardTitle>
                <CardDescription>부서 전체 출석 현황을 확인하세요</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

                    {/* 지각 통계 숨김 처리됨 */}

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

                {/* 결석자 목록 */}
                {stats.absent > 0 && (
                    <div className="mt-6 pt-6 border-t">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-500" />
                            결석자 목록 ({stats.absent}명)
                        </h4>
                        {absenteesLoading ? (
                            <div className="text-sm text-gray-500">결석자 목록을 불러오는 중...</div>
                        ) : absentees && absentees.length > 0 ? (
                            <div className="space-y-2">
                                {absentees.map((student) => (
                                    <div
                                        key={student.studentId}
                                        className="flex items-start justify-between p-3 bg-red-50 rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">
                                                {student.studentName}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {student.className}
                                            </div>
                                        </div>
                                        <div className="text-sm text-red-600 max-w-[50%] text-right">
                                            {student.reason || '(사유 없음)'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500">결석자 정보가 없습니다.</div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

