'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    getYearTransitionStatus,
    createNextYearClasses,
    assignStudentToClass,
    getUnassignedStudents,
    getNextYearClasses,
    executeYearTransition,
    assignStudentsBatch,
    resetNextYearClasses,
    type TransitionStatus,
    type StudentWithClass,
    type Class,
} from '@/lib/supabase/year-transition';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Loader2,
    CheckCircle,
    AlertTriangle,
    Calendar,
    RefreshCw,
    Circle,
    Users,
    Filter
} from 'lucide-react';

export function YearTransition() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<TransitionStatus | null>(null);
    const [unassignedStudents, setUnassignedStudents] = useState<StudentWithClass[]>([]);
    const [nextYearClasses, setNextYearClasses] = useState<Class[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isExecuting, setIsExecuting] = useState(false);
    const [showExecuteDialog, setShowExecuteDialog] = useState(false);
    const [showResetDialog, setShowResetDialog] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    // 필터링 및 선택 상태
    const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
    const [selectedGrade, setSelectedGrade] = useState<string>('all');
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [showBatchAssignDialog, setShowBatchAssignDialog] = useState(false);
    const [batchAssignClassId, setBatchAssignClassId] = useState<string>('');
    const [isBatchAssigning, setIsBatchAssigning] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const statusData = await getYearTransitionStatus();
            setStatus(statusData);

            if (statusData) {
                const students = await getUnassignedStudents(statusData.nextYear);
                setUnassignedStudents(students);

                if (statusData.classesCreated) {
                    const classes = await getNextYearClasses(statusData.nextYear);
                    setNextYearClasses(classes);
                }
            }
        } catch (err: any) {
            console.error('Error fetching data:', err);
            setError(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 필터링된 학생 목록
    const filteredStudents = useMemo(() => {
        return unassignedStudents.filter(student => {
            const matchDepartment = selectedDepartment === 'all' || student.department === selectedDepartment;
            const matchGrade = selectedGrade === 'all' || student.grade.toString() === selectedGrade;
            return matchDepartment && matchGrade;
        });
    }, [unassignedStudents, selectedDepartment, selectedGrade]);

    // 전체 선택/해제 핸들러
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSelectAll = (checked: any) => {
        if (checked === true) {
            setSelectedStudentIds(filteredStudents.map(s => s.id));
        } else {
            setSelectedStudentIds([]);
        }
    };

    // 개별 선택 핸들러
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSelectStudent = (studentId: string, checked: any) => {
        if (checked === true) {
            setSelectedStudentIds(prev => [...prev, studentId]);
        } else {
            setSelectedStudentIds(prev => prev.filter(id => id !== studentId));
        }
    };

    // 부서 목록 추출
    const departments = useMemo(() => {
        const unique = new Set(unassignedStudents.map(s => s.department).filter(Boolean));
        return Array.from(unique).sort();
    }, [unassignedStudents]);

    // 학년 목록 추출
    const grades = useMemo(() => {
        const unique = new Set(unassignedStudents.map(s => s.grade));
        return Array.from(unique).sort((a, b) => a - b);
    }, [unassignedStudents]);

    const handleCreateClasses = async () => {
        if (!status) return;
        try {
            setLoading(true);
            setSuccessMessage(null);
            const result = await createNextYearClasses();
            if (result.success) {
                setSuccessMessage(`${result.createdCount}개의 반이 생성되었습니다.`);
                fetchData();
            } else {
                setError(result.error || '반 생성 실패');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignStudent = async (studentId: string, classId: string) => {
        if (!status || !user) return;
        try {
            // Optimistic update
            setUnassignedStudents(prev => prev.filter(s => s.id !== studentId));
            setSelectedStudentIds(prev => prev.filter(id => id !== studentId));

            const result = await assignStudentToClass(studentId, classId, status.nextYear, user.id);
            if (!result.success) {
                setError(result.error || '학생 배정 실패');
                fetchData(); // 배정 실패 시 데이터 리로드
            } else {
                // 성공 시 상태 업데이트만 수행 (리로드 안함)
                setStatus(prev => prev ? {
                    ...prev,
                    assignedStudents: prev.assignedStudents + 1,
                    assignmentProgress: Math.round(((prev.assignedStudents + 1) / prev.totalStudents) * 100)
                } : null);
            }
        } catch (err: any) {
            setError(err.message);
            fetchData();
        }
    };

    const handleBatchAssign = async () => {
        if (!status || !user || !batchAssignClassId || selectedStudentIds.length === 0) return;

        try {
            setIsBatchAssigning(true);
            const result = await assignStudentsBatch({
                studentIds: selectedStudentIds,
                classId: batchAssignClassId,
                year: status.nextYear,
                assignedBy: user.id
            });

            if (result.success) {
                setSuccessMessage(`${result.count}명의 학생이 일괄 배정되었습니다.`);
                setShowBatchAssignDialog(false);
                setSelectedStudentIds([]);
                setBatchAssignClassId('');
                fetchData();
            } else {
                setError(result.error || '일괄 배정 실패');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsBatchAssigning(false);
        }
    };

    const handleExecuteTransition = async () => {
        if (!status || !user) return;
        try {
            setIsExecuting(true);
            setSuccessMessage(null);
            const result = await executeYearTransition(user.id);
            if (result.success) {
                setSuccessMessage('학년도 전환이 성공적으로 완료되었습니다!');
                setShowExecuteDialog(false);
                fetchData();
            } else {
                setError(result.error || '전환 실행 실패');
                setShowExecuteDialog(false);
            }
        } catch (err: any) {
            setError(err.message);
            setShowExecuteDialog(false);
        } finally {
            setIsExecuting(false);
        }
    };

    const handleResetClasses = async () => {
        if (!status) return;
        try {
            setIsResetting(true);
            setSuccessMessage(null);
            const result = await resetNextYearClasses();
            if (result.success) {
                setSuccessMessage('반 생성이 초기화되었습니다. 다시 생성할 수 있습니다.');
                setShowResetDialog(false);
                fetchData();
            } else {
                setError(result.error || '초기화 실패');
                setShowResetDialog(false);
            }
        } catch (err: any) {
            setError(err.message);
            setShowResetDialog(false);
        } finally {
            setIsResetting(false);
        }
    };

    if (loading && !status) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!status) return null;

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
                            {/* 단계별 액션 버튼 */}
                            <div className="flex-shrink-0">
                                {index === 0 && !step.completed && (
                                    <Button size="sm" onClick={handleCreateClasses} disabled={loading}>
                                        반 생성 실행
                                    </Button>
                                )}
                                {index === 0 && step.completed && (
                                    <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                                        <DialogTrigger asChild>
                                            <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200">
                                                <RefreshCw className="h-4 w-4 mr-1" />
                                                초기화 (다시 생성)
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle className="text-red-600 flex items-center gap-2">
                                                    <AlertTriangle className="h-5 w-5" />
                                                    반 생성 초기화
                                                </DialogTitle>
                                                <DialogDescription>
                                                    정말로 생성된 {status.nextYear}년도 반을 모두 삭제하시겠습니까?
                                                    <br />
                                                    이미 배정된 학생 정보도 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setShowResetDialog(false)}>취소</Button>
                                                <Button variant="destructive" onClick={handleResetClasses} disabled={isResetting}>
                                                    {isResetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                                    초기화 실행
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                )}
                                {index === 3 && step.completed === false && (
                                    <Dialog open={showExecuteDialog} onOpenChange={setShowExecuteDialog}>
                                        <DialogTrigger asChild>
                                            <Button size="sm" variant={status.assignmentProgress < 100 ? "secondary" : "default"} disabled={status.assignmentProgress < 100}>
                                                전환 실행
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>학년도 전환 실행</DialogTitle>
                                                <DialogDescription>
                                                    정말로 전환을 실행하시겠습니까? 이 작업은 되돌릴 수 없으며 다음 작업이 수행됩니다:
                                                    <ul className="list-disc list-inside mt-2 space-y-1">
                                                        <li>{status.currentYear}년도 반 비활성화</li>
                                                        <li>{status.nextYear}년도 반 활성화</li>
                                                        <li>학생 학년 일괄 상승 (+1)</li>
                                                        <li>새 반 편성 적용</li>
                                                    </ul>
                                                </DialogDescription>
                                            </DialogHeader>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setShowExecuteDialog(false)}>취소</Button>
                                                <Button onClick={handleExecuteTransition} disabled={isExecuting}>
                                                    {isExecuting ? '실행 중...' : '확인 및 실행'}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* 미배정 학생 목록 */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            미배정 학생 목록
                            <Badge variant="secondary" className="ml-2">{unassignedStudents.length}명</Badge>
                        </CardTitle>
                        <CardDescription>
                            아래 학생들은 아직 {status.nextYear}년 반에 배정되지 않았습니다.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* 필터링 및 일괄 작업 툴바 */}
                    <div className="flex flex-wrap items-center gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium">필터:</span>
                        </div>

                        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="부서 선택" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">전체 부서</SelectItem>
                                {departments.map(dept => (
                                    <SelectItem key={dept} value={dept || 'unknown'}>{dept || '미정'}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="학년 선택" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">전체 학년</SelectItem>
                                {grades.map(grade => (
                                    <SelectItem key={grade} value={grade.toString()}>{grade}학년</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="flex-1" />

                        <Dialog open={showBatchAssignDialog} onOpenChange={setShowBatchAssignDialog}>
                            <DialogTrigger asChild>
                                <Button disabled={selectedStudentIds.length === 0}>
                                    일괄 배정 ({selectedStudentIds.length}명)
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>학생 일괄 배정</DialogTitle>
                                    <DialogDescription>
                                        선택된 {selectedStudentIds.length}명의 학생을 다음 연도 반에 배정합니다.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                    <label className="text-sm font-medium mb-2 block">배정할 반 선택</label>
                                    <Select value={batchAssignClassId} onValueChange={setBatchAssignClassId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="반을 선택하세요" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {nextYearClasses.map((cls) => (
                                                <SelectItem key={cls.id} value={cls.id}>
                                                    {cls.name} {cls.teacher_name ? `(${cls.teacher_name})` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setShowBatchAssignDialog(false)}>취소</Button>
                                    <Button onClick={handleBatchAssign} disabled={!batchAssignClassId || isBatchAssigning}>
                                        {isBatchAssigning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        배정하기
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {unassignedStudents.length === 0 ? (
                        <div className="text-center py-8 text-green-600 bg-green-50 rounded-lg">
                            <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                            <p className="font-medium">모든 학생이 배정되었습니다!</p>
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            필터 조건에 맞는 학생이 없습니다.
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">
                                            <Checkbox
                                                checked={selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0}
                                                onCheckedChange={handleSelectAll}
                                            />
                                        </TableHead>
                                        <TableHead>이름</TableHead>
                                        <TableHead>부서</TableHead>
                                        <TableHead>학년</TableHead>
                                        <TableHead>현재 반</TableHead>
                                        <TableHead>배정할 반</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStudents.map((student) => (
                                        <TableRow key={student.id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedStudentIds.includes(student.id)}
                                                    onCheckedChange={(checked) => handleSelectStudent(student.id, checked)}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">{student.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{student.department || '미정'}</Badge>
                                            </TableCell>
                                            <TableCell>{student.grade}학년</TableCell>
                                            <TableCell>{student.className}</TableCell>
                                            <TableCell>
                                                <Select
                                                    onValueChange={(value) => handleAssignStudent(student.id, value)}
                                                >
                                                    <SelectTrigger className="w-[200px]">
                                                        <SelectValue placeholder="반 선택" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {nextYearClasses.map((cls) => (
                                                            <SelectItem key={cls.id} value={cls.id}>
                                                                {cls.name} {cls.teacher_name ? `(${cls.teacher_name})` : ''}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
