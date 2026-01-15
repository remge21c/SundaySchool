/**
 * 학년도 전환 관리 컴포넌트
 * 새 학년도 반 생성, 학생 배정, 전환 실행
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    CheckCircle,
    Circle,
    Loader2,
    AlertTriangle,
    Calendar,
    Users,
    RefreshCw,
    Trash2,
    Sparkles,
    Wand2,
    Play,
    RotateCcw,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
    getTransitionProgress,
    createNextYearClasses,
    getClassesByYear,
    getUnassignedStudents,
    assignStudentTemp,
    removeStudentTempAssignment,
    autoAssignStudents,
    confirmTransition,
    executeTransition,
    deleteNextYearClasses,
} from '@/lib/supabase/year-transition';
import type { TransitionProgress, StudentAssignmentInfo } from '@/types/year-transition';
import type { Class } from '@/types/class';

const CURRENT_YEAR = new Date().getFullYear();
const NEXT_YEAR = CURRENT_YEAR + 1;

export function YearTransition() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showExecuteDialog, setShowExecuteDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
    const [selectedTargetClass, setSelectedTargetClass] = useState<string>('');

    // 진행 상황 조회
    const { data: progress, isLoading: progressLoading, refetch: refetchProgress } = useQuery({
        queryKey: ['yearTransitionProgress', NEXT_YEAR],
        queryFn: () => getTransitionProgress(NEXT_YEAR),
        refetchInterval: 10000, // 10초마다 갱신
    });

    // 새 학년도 반 목록
    const { data: nextYearClasses = [], refetch: refetchClasses } = useQuery({
        queryKey: ['classes', NEXT_YEAR],
        queryFn: () => getClassesByYear(NEXT_YEAR),
        enabled: progress?.classesCreated ?? false,
    });

    // 학생 배정 현황
    const { data: students = [], refetch: refetchStudents } = useQuery({
        queryKey: ['unassignedStudents', NEXT_YEAR],
        queryFn: () => getUnassignedStudents(NEXT_YEAR),
        enabled: progress?.classesCreated ?? false,
    });

    // 새 학년도 반 생성
    const createClassesMutation = useMutation({
        mutationFn: () => createNextYearClasses(CURRENT_YEAR, NEXT_YEAR),
        onSuccess: (result) => {
            if (result.success) {
                refetchProgress();
                refetchClasses();
                alert(`${result.createdCount}개의 반이 생성되었습니다.`);
            } else {
                alert(`오류: ${result.error}`);
            }
        },
    });

    // 학생 개별 배정
    const assignStudentMutation = useMutation({
        mutationFn: ({ studentId, classId }: { studentId: string; classId: string }) =>
            assignStudentTemp(studentId, classId, NEXT_YEAR),
        onSuccess: () => {
            refetchProgress();
            refetchStudents();
            setSelectedStudent(null);
            setSelectedTargetClass('');
        },
    });

    // 학생 배정 취소
    const removeAssignmentMutation = useMutation({
        mutationFn: (studentId: string) => removeStudentTempAssignment(studentId, NEXT_YEAR),
        onSuccess: () => {
            refetchProgress();
            refetchStudents();
        },
    });

    // 전체 자동 배정
    const autoAssignMutation = useMutation({
        mutationFn: () => autoAssignStudents(CURRENT_YEAR, NEXT_YEAR),
        onSuccess: (result) => {
            if (result.success) {
                refetchProgress();
                refetchStudents();
                alert(`${result.assignedCount}명의 학생이 자동 배정되었습니다.`);
            } else {
                alert(`오류: ${result.error}`);
            }
        },
    });

    // 전환 확정
    const confirmMutation = useMutation({
        mutationFn: () => confirmTransition(CURRENT_YEAR, NEXT_YEAR, user?.id ?? ''),
        onSuccess: (result) => {
            if (result.success) {
                refetchProgress();
                setShowConfirmDialog(false);
                alert('전환이 확정되었습니다. 실행 버튼을 눌러 최종 전환을 진행하세요.');
            } else {
                alert(`오류: ${result.error}`);
            }
        },
    });

    // 전환 실행
    const executeMutation = useMutation({
        mutationFn: (logId: string) => executeTransition(logId),
        onSuccess: (result) => {
            if (result.success) {
                refetchProgress();
                queryClient.invalidateQueries({ queryKey: ['classes'] });
                queryClient.invalidateQueries({ queryKey: ['students'] });
                setShowExecuteDialog(false);
                alert('학년도 전환이 완료되었습니다!');
            } else {
                alert(`오류: ${result.error}`);
            }
        },
    });

    // 반 삭제 (전환 취소)
    const deleteMutation = useMutation({
        mutationFn: () => deleteNextYearClasses(NEXT_YEAR),
        onSuccess: (result) => {
            if (result.success) {
                refetchProgress();
                refetchClasses();
                setShowDeleteDialog(false);
                alert('새 학년도 반이 삭제되었습니다.');
            } else {
                alert(`오류: ${result.error}`);
            }
        },
    });

    const handleAssignStudent = () => {
        if (selectedStudent && selectedTargetClass) {
            assignStudentMutation.mutate({ studentId: selectedStudent, classId: selectedTargetClass });
        }
    };

    const unassignedStudents = students.filter((s) => !s.isAssigned);
    const assignedStudents = students.filter((s) => s.isAssigned);

    if (progressLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>로딩 중...</span>
                </CardContent>
            </Card>
        );
    }

    const isCurrentMonth = new Date().getMonth() >= 10 || new Date().getMonth() <= 1; // 11월~2월

    return (
        <div className="space-y-6">
            {/* 안내 배너 (시즌에만 표시) */}
            {isCurrentMonth && (
                <Alert className="bg-blue-50 border-blue-200">
                    <Sparkles className="h-4 w-4" />
                    <AlertTitle>새 학년도 준비 시즌입니다!</AlertTitle>
                    <AlertDescription>
                        {CURRENT_YEAR}년 {CURRENT_YEAR + 1}월 1일부터 새 학년도가 시작됩니다.
                        아래 단계를 따라 새 학년도 반 편성을 준비해 주세요.
                    </AlertDescription>
                </Alert>
            )}

            {/* 메인 대시보드 카드 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {CURRENT_YEAR}→{NEXT_YEAR} 학년도 전환 대시보드
                    </CardTitle>
                    <CardDescription>
                        새 학년도 반 생성, 학생 배정, 전환 실행을 관리합니다.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* 단계별 진행 상황 */}
                    <div className="space-y-4">
                        {/* Step 1: 새 학년도 반 생성 */}
                        <div className="flex items-center gap-3 p-3 border rounded-lg">
                            {progress?.classesCreated ? (
                                <CheckCircle className="h-6 w-6 text-green-500" />
                            ) : (
                                <Circle className="h-6 w-6 text-gray-300" />
                            )}
                            <div className="flex-1">
                                <p className="font-medium">1단계: 새 학년도 반 생성</p>
                                <p className="text-sm text-gray-500">
                                    {progress?.classesCreated
                                        ? `${nextYearClasses.length}개의 반이 생성됨`
                                        : '현재 연도 반을 복사하여 새 학년도 반을 생성합니다.'}
                                </p>
                            </div>
                            {!progress?.classesCreated && (
                                <Button
                                    onClick={() => createClassesMutation.mutate()}
                                    disabled={createClassesMutation.isPending}
                                >
                                    {createClassesMutation.isPending && (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    )}
                                    반 생성
                                </Button>
                            )}
                            {progress?.classesCreated && !progress?.executed && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setShowDeleteDialog(true)}
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    삭제
                                </Button>
                            )}
                        </div>

                        {/* Step 2: 학생 반 편성 */}
                        <div className="flex items-center gap-3 p-3 border rounded-lg">
                            {progress?.assignmentProgress === 100 ? (
                                <CheckCircle className="h-6 w-6 text-green-500" />
                            ) : progress?.classesCreated ? (
                                <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                            ) : (
                                <Circle className="h-6 w-6 text-gray-300" />
                            )}
                            <div className="flex-1">
                                <p className="font-medium">2단계: 학생 반 편성</p>
                                <p className="text-sm text-gray-500">
                                    {progress?.assignedStudents ?? 0} / {progress?.totalStudents ?? 0}명 배정됨
                                </p>
                                {progress?.classesCreated && (
                                    <Progress
                                        value={progress?.assignmentProgress ?? 0}
                                        className="mt-2 h-2"
                                    />
                                )}
                            </div>
                            {progress?.classesCreated && progress.assignmentProgress < 100 && (
                                <Button
                                    variant="outline"
                                    onClick={() => autoAssignMutation.mutate()}
                                    disabled={autoAssignMutation.isPending}
                                >
                                    {autoAssignMutation.isPending && (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    )}
                                    <Wand2 className="h-4 w-4 mr-1" />
                                    자동 배정
                                </Button>
                            )}
                        </div>

                        {/* Step 3: 최종 확정 */}
                        <div className="flex items-center gap-3 p-3 border rounded-lg">
                            {progress?.confirmed ? (
                                <CheckCircle className="h-6 w-6 text-green-500" />
                            ) : (
                                <Circle className="h-6 w-6 text-gray-300" />
                            )}
                            <div className="flex-1">
                                <p className="font-medium">3단계: 최종 확정</p>
                                <p className="text-sm text-gray-500">
                                    {progress?.confirmed
                                        ? '전환이 확정되었습니다.'
                                        : '모든 학생 배정 완료 후 확정이 가능합니다.'}
                                </p>
                            </div>
                            {progress?.classesCreated &&
                                progress.assignmentProgress === 100 &&
                                !progress?.confirmed && (
                                    <Button onClick={() => setShowConfirmDialog(true)}>
                                        확정하기
                                    </Button>
                                )}
                        </div>

                        {/* Step 4: 전환 실행 */}
                        <div className="flex items-center gap-3 p-3 border rounded-lg">
                            {progress?.executed ? (
                                <CheckCircle className="h-6 w-6 text-green-500" />
                            ) : (
                                <Circle className="h-6 w-6 text-gray-300" />
                            )}
                            <div className="flex-1">
                                <p className="font-medium">4단계: 전환 실행</p>
                                <p className="text-sm text-gray-500">
                                    {progress?.executed
                                        ? '전환이 완료되었습니다!'
                                        : `예정일: ${NEXT_YEAR}-01-01`}
                                </p>
                            </div>
                            {progress?.confirmed && !progress?.executed && progress.currentLog && (
                                <Button
                                    variant="default"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => setShowExecuteDialog(true)}
                                >
                                    <Play className="h-4 w-4 mr-1" />
                                    지금 실행
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="justify-between border-t pt-4">
                    <Button variant="ghost" size="sm" onClick={() => refetchProgress()}>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        새로고침
                    </Button>
                    {progress?.currentLog && (
                        <Badge
                            variant={
                                progress.currentLog.status === 'completed'
                                    ? 'default'
                                    : progress.currentLog.status === 'failed'
                                        ? 'destructive'
                                        : 'secondary'
                            }
                        >
                            {progress.currentLog.status === 'pending' && '대기 중'}
                            {progress.currentLog.status === 'in_progress' && '진행 중'}
                            {progress.currentLog.status === 'completed' && '완료됨'}
                            {progress.currentLog.status === 'failed' && '실패'}
                            {progress.currentLog.status === 'rolled_back' && '취소됨'}
                        </Badge>
                    )}
                </CardFooter>
            </Card>

            {/* 학생 배정 테이블 (반이 생성된 경우에만 표시) */}
            {progress?.classesCreated && !progress?.executed && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            학생 반 배정
                        </CardTitle>
                        <CardDescription>
                            미배정: {unassignedStudents.length}명 / 배정 완료: {assignedStudents.length}명
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* 미배정 학생 섹션 */}
                        {unassignedStudents.length > 0 && (
                            <div className="mb-6">
                                <h4 className="font-medium mb-2 text-orange-600">
                                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                                    미배정 학생 ({unassignedStudents.length}명)
                                </h4>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>이름</TableHead>
                                            <TableHead>현재 반</TableHead>
                                            <TableHead>현재 학년 → 다음 학년</TableHead>
                                            <TableHead>배정할 반</TableHead>
                                            <TableHead>작업</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {unassignedStudents.map((student) => (
                                            <TableRow key={student.id}>
                                                <TableCell className="font-medium">{student.name}</TableCell>
                                                <TableCell>{student.currentClassName}</TableCell>
                                                <TableCell>
                                                    {student.currentGrade}학년 → {student.nextGrade}학년
                                                </TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={selectedStudent === student.id ? selectedTargetClass : ''}
                                                        onValueChange={(value) => {
                                                            setSelectedStudent(student.id);
                                                            setSelectedTargetClass(value);
                                                        }}
                                                    >
                                                        <SelectTrigger className="w-40">
                                                            <SelectValue placeholder="반 선택" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {nextYearClasses.map((cls) => (
                                                                <SelectItem key={cls.id} value={cls.id}>
                                                                    {cls.department} - {cls.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="sm"
                                                        onClick={handleAssignStudent}
                                                        disabled={
                                                            selectedStudent !== student.id ||
                                                            !selectedTargetClass ||
                                                            assignStudentMutation.isPending
                                                        }
                                                    >
                                                        배정
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {/* 배정 완료 학생 섹션 */}
                        {assignedStudents.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-2 text-green-600">
                                    <CheckCircle className="h-4 w-4 inline mr-1" />
                                    배정 완료 ({assignedStudents.length}명)
                                </h4>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>이름</TableHead>
                                            <TableHead>현재 반</TableHead>
                                            <TableHead>→</TableHead>
                                            <TableHead>새 반</TableHead>
                                            <TableHead>작업</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {assignedStudents.map((student) => (
                                            <TableRow key={student.id}>
                                                <TableCell className="font-medium">{student.name}</TableCell>
                                                <TableCell>{student.currentClassName}</TableCell>
                                                <TableCell>→</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">{student.nextClassName}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => removeAssignmentMutation.mutate(student.id)}
                                                        disabled={removeAssignmentMutation.isPending}
                                                    >
                                                        <RotateCcw className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {students.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                배정할 학생이 없습니다.
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* 확정 확인 다이얼로그 */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>학년도 전환 확정</DialogTitle>
                        <DialogDescription>
                            모든 학생 배정이 완료되었습니다. 전환을 확정하시겠습니까?
                            <br />
                            확정 후에도 실행 전까지는 취소할 수 있습니다.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <p>
                            <strong>전환 정보:</strong>
                        </p>
                        <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
                            <li>전환 대상: {CURRENT_YEAR}년 → {NEXT_YEAR}년</li>
                            <li>총 학생 수: {progress?.totalStudents}명</li>
                            <li>배정 완료: {progress?.assignedStudents}명</li>
                        </ul>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                            취소
                        </Button>
                        <Button
                            onClick={() => confirmMutation.mutate()}
                            disabled={confirmMutation.isPending}
                        >
                            {confirmMutation.isPending && (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            )}
                            확정하기
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 실행 확인 다이얼로그 */}
            <Dialog open={showExecuteDialog} onOpenChange={setShowExecuteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>⚠️ 학년도 전환 실행</DialogTitle>
                        <DialogDescription>
                            <span className="text-red-600 font-bold">이 작업은 되돌릴 수 없습니다!</span>
                            <br />
                            전환을 실행하면 다음과 같이 변경됩니다:
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <ul className="list-disc list-inside text-sm space-y-1">
                            <li>{CURRENT_YEAR}년 반이 비활성화됩니다.</li>
                            <li>{NEXT_YEAR}년 반이 활성화됩니다.</li>
                            <li>모든 학생의 반이 새 반으로 변경됩니다.</li>
                            <li>모든 학생의 학년이 1씩 증가합니다.</li>
                        </ul>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowExecuteDialog(false)}>
                            취소
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (progress?.currentLog?.id) {
                                    executeMutation.mutate(progress.currentLog.id);
                                }
                            }}
                            disabled={executeMutation.isPending}
                        >
                            {executeMutation.isPending && (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            )}
                            전환 실행
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 삭제 확인 다이얼로그 */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>새 학년도 반 삭제</DialogTitle>
                        <DialogDescription>
                            {NEXT_YEAR}년도 반과 모든 임시 배정을 삭제하시겠습니까?
                            <br />
                            이 작업은 되돌릴 수 없습니다.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            취소
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteMutation.mutate()}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending && (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            )}
                            삭제
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
