/**
 * 학년도 전환 관리 컴포넌트
 * 관리자용 연도 전환 대시보드
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    CheckCircle,
    Circle,
    Clock,
    Loader2,
    AlertTriangle,
    ArrowRight,
    Users,
    School,
    Calendar,
    RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    getYearTransitionStatus,
    createNextYearClasses,
    getUnassignedStudents,
    executeYearTransition,
    type TransitionStatus,
    type StudentWithClass,
} from '@/lib/supabase/year-transition';

export function YearTransition() {
    const [status, setStatus] = useState<TransitionStatus | null>(null);
    const [unassignedStudents, setUnassignedStudents] = useState<StudentWithClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const transitionStatus = await getYearTransitionStatus();
            setStatus(transitionStatus);

            if (transitionStatus.classesCreated) {
                const students = await getUnassignedStudents(transitionStatus.nextYear);
                setUnassignedStudents(students);
            }
        } catch (err: any) {
            console.error('Error fetching transition status:', err);
            setError('전환 상태를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateClasses = async () => {
        setActionLoading('create');
        setError(null);
        setSuccessMessage(null);

        try {
            const result = await createNextYearClasses();

            if (result.success) {
                setSuccessMessage(`${result.createdCount}개의 새 반이 생성되었습니다.`);
                await fetchData();
            } else {
                setError(result.error || '반 생성 중 오류가 발생했습니다.');
            }
        } catch (err: any) {
            setError(err.message || '반 생성 중 오류가 발생했습니다.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleExecuteTransition = async () => {
        if (!confirm('정말로 학년도 전환을 실행하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.')) {
            return;
        }

        setActionLoading('execute');
        setError(null);
        setSuccessMessage(null);

        try {
            const result = await executeYearTransition();

            if (result.success && result.stats) {
                setSuccessMessage(
                    `전환 완료! 활성화된 반: ${result.stats.classesActivated}개, ` +
                    `배정된 학생: ${result.stats.studentsAssigned}명, ` +
                    `학년 상승: ${result.stats.gradesIncremented}명`
                );
                await fetchData();
            } else {
                setError(result.error || '전환 실행 중 오류가 발생했습니다.');
            }
        } catch (err: any) {
            setError(err.message || '전환 실행 중 오류가 발생했습니다.');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-500">로딩 중...</span>
                </CardContent>
            </Card>
        );
    }

    if (!status) {
        return (
            <Card>
                <CardContent className="py-8">
                    <p className="text-center text-gray-500">상태를 불러올 수 없습니다.</p>
                </CardContent>
            </Card>
        );
    }

    const steps = [
        {
            title: '새 학년도 반 생성',
            description: `${status.nextYear}년 반 구조 생성`,
            completed: status.classesCreated,
            count: status.nextYearClassCount,
        },
        {
            title: '학생 반 편성',
            description: `${status.assignedStudents}/${status.totalStudents}명 배정 완료`,
            completed: status.assignmentProgress === 100,
            progress: status.assignmentProgress,
        },
        {
            title: '최종 확정',
            description: '관리자 승인 대기',
            completed: status.confirmed,
        },
        {
            title: '전환 실행',
            description: `${status.nextYear}년 1월 1일 자동 또는 수동 실행`,
            completed: status.executed,
        },
    ];

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {status.currentYear}→{status.nextYear} 학년도 전환
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        새 학년도 준비 및 학생 반 편성을 관리합니다.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                    새로고침
                </Button>
            </div>

            {/* 알림 메시지 */}
            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>오류</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {successMessage && (
                <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">성공</AlertTitle>
                    <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
                </Alert>
            )}

            {/* 진행 상태 카드 */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">전환 진행 상태</CardTitle>
                    <CardDescription>
                        4단계로 진행되는 학년도 전환 과정입니다.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {steps.map((step, index) => (
                        <div key={index} className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                                {step.completed ? (
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : step.progress !== undefined && step.progress > 0 ? (
                                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                                ) : (
                                    <Circle className="h-5 w-5 text-gray-300" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className={`font-medium ${step.completed ? 'text-green-700' : 'text-gray-700'}`}>
                                        {index + 1}단계: {step.title}
                                    </span>
                                    {step.count !== undefined && step.count > 0 && (
                                        <Badge variant="secondary">{step.count}개</Badge>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500">{step.description}</p>
                                {step.progress !== undefined && step.progress > 0 && step.progress < 100 && (
                                    <Progress value={step.progress} className="mt-2 h-2" />
                                )}
                            </div>
                        </div>
                    ))}
                </CardContent>
                <CardFooter className="gap-2 flex-wrap">
                    {!status.classesCreated && (
                        <Button
                            onClick={handleCreateClasses}
                            disabled={actionLoading === 'create'}
                        >
                            {actionLoading === 'create' ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <School className="h-4 w-4 mr-2" />
                            )}
                            {status.nextYear}년 반 생성
                        </Button>
                    )}

                    {status.classesCreated && !status.executed && (
                        <Button
                            variant="default"
                            onClick={handleExecuteTransition}
                            disabled={actionLoading === 'execute' || unassignedStudents.length > 0}
                        >
                            {actionLoading === 'execute' ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <ArrowRight className="h-4 w-4 mr-2" />
                            )}
                            전환 실행
                        </Button>
                    )}

                    {status.executed && (
                        <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            전환 완료
                        </Badge>
                    )}
                </CardFooter>
            </Card>

            {/* 미배정 학생 목록 */}
            {status.classesCreated && unassignedStudents.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            미배정 학생 목록
                            <Badge variant="destructive">{unassignedStudents.length}명</Badge>
                        </CardTitle>
                        <CardDescription>
                            아래 학생들은 아직 {status.nextYear}년 반에 배정되지 않았습니다.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Alert className="mb-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                모든 학생이 배정되어야 전환을 실행할 수 있습니다.
                            </AlertDescription>
                        </Alert>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>이름</TableHead>
                                    <TableHead>학년</TableHead>
                                    <TableHead>현재 반</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {unassignedStudents.slice(0, 10).map((student) => (
                                    <TableRow key={student.id}>
                                        <TableCell className="font-medium">{student.name}</TableCell>
                                        <TableCell>{student.grade}학년</TableCell>
                                        <TableCell>{student.className}</TableCell>
                                    </TableRow>
                                ))}
                                {unassignedStudents.length > 10 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-gray-500">
                                            외 {unassignedStudents.length - 10}명...
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <School className="h-5 w-5 text-blue-500" />
                            <div>
                                <p className="text-2xl font-bold">{status.nextYearClassCount}</p>
                                <p className="text-sm text-gray-500">{status.nextYear}년 반 개수</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-green-500" />
                            <div>
                                <p className="text-2xl font-bold">{status.assignedStudents}</p>
                                <p className="text-sm text-gray-500">배정 완료 학생</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-orange-500" />
                            <div>
                                <p className="text-2xl font-bold">{unassignedStudents.length}</p>
                                <p className="text-sm text-gray-500">미배정 학생</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
