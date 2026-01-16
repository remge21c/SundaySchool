/**
 * 이달의 생일자 표시 카드 컴포넌트
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cake, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useBirthdayStudentsByClass, useBirthdayStudentsByDepartment } from '@/hooks/useStudents';

interface BirthdayCardProps {
    /** 반 ID (반별 조회 시) */
    classId?: string | null;
    /** 부서명 (부서별 조회 시) */
    departmentName?: string | null;
}

/**
 * 이달의 생일자 카드
 * classId 또는 departmentName 중 하나를 전달하면 해당 범위의 생일자를 표시
 */
export function BirthdayCard({ classId, departmentName }: BirthdayCardProps) {
    // 반별 생일자 조회
    const {
        data: classBirthdays,
        isLoading: isLoadingClass,
    } = useBirthdayStudentsByClass(classId);

    // 부서별 생일자 조회
    const {
        data: deptBirthdays,
        isLoading: isLoadingDept,
    } = useBirthdayStudentsByDepartment(departmentName);

    // 표시할 데이터 결정
    const birthdays = classId ? classBirthdays : deptBirthdays;
    const isLoading = classId ? isLoadingClass : isLoadingDept;

    // 현재 월
    const currentMonth = new Date().getMonth() + 1;

    // 데이터가 없거나 로딩 중이 아닌데 비어있으면 렌더링하지 않음
    if (!isLoading && (!birthdays || birthdays.length === 0)) {
        return null;
    }

    return (
        <Card className="border-pink-200 bg-gradient-to-br from-pink-50 to-orange-50">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-pink-700 text-base">
                    <Cake className="h-4 w-4" />
                    🎂 {currentMonth}월 생일자
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                {isLoading ? (
                    <div className="flex items-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-pink-500" />
                        <span className="ml-2 text-sm text-gray-500">불러오는 중...</span>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {birthdays?.map((student: any) => (
                            <div
                                key={student.id}
                                className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-sm shadow-sm border border-pink-100"
                            >
                                <span className="text-xs">🎈</span>
                                <span className="font-medium text-gray-700">{student.name}</span>
                                {student.class_name && (
                                    <span className="text-xs text-gray-400">({student.class_name})</span>
                                )}
                                <span className="text-xs text-pink-500">
                                    {student.birthday && format(new Date(student.birthday), 'd일', { locale: ko })}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
