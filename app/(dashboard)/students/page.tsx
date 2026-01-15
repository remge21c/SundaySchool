/**
 * 학생 관리 페이지
 * 학생 목록 조회 및 관리
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { ClassSidebar } from '@/components/class/ClassSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useStudentsByClass, useAllStudents, useStudentsByDepartment, useUpdateStudentsClass, useGraduateStudents, useDeleteStudents, useTransferToDepartment, usePromoteGrade } from '@/hooks/useStudents';
import { useAllClasses, useClassesByTeacher } from '@/hooks/useClasses';
import { StudentAddForm } from '@/components/student/StudentAddForm';
import { useAuth } from '@/hooks/useAuth';
import { getUserRole } from '@/lib/utils/auth';
import { Search, UserPlus, Users, Loader2, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StudentBulkActions } from '@/components/student/StudentBulkActions';
import { StudentMoveDialog } from '@/components/student/StudentMoveDialog';
import { StudentDeleteDialog } from '@/components/student/StudentDeleteDialog';
import { StudentGraduateDialog } from '@/components/student/StudentGraduateDialog';
import { StudentDepartmentTransferDialog } from '@/components/student/StudentDepartmentTransferDialog';
import { StudentPromoteDialog } from '@/components/student/StudentPromoteDialog';

export default function StudentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // -- Filter State --
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'grade' | 'birthday'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // -- Selection State --
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // -- UI State --
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isAutoSelected, setIsAutoSelected] = useState(false);

  // -- Dialog State --
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isGraduateDialogOpen, setIsGraduateDialogOpen] = useState(false);
  const [isTransferDeptDialogOpen, setIsTransferDeptDialogOpen] = useState(false);
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);

  // -- Data Fetching --
  const { data: classes } = useAllClasses();
  const { data: teacherClasses } = useClassesByTeacher(user?.id, undefined);

  // Filter Params
  const filterParams = {
    search: searchQuery || undefined,
    grade: selectedGrade !== 'all' ? parseInt(selectedGrade) : undefined,
  };

  // Queries
  const { data: studentsByClass, isLoading: isLoadingByClass } = useStudentsByClass(
    selectedClassId || undefined,
    filterParams
  );

  const { data: studentsByDepartment, isLoading: isLoadingByDepartment } = useStudentsByDepartment(
    selectedDepartment || undefined,
    filterParams
  );

  const { data: allStudents, isLoading: isLoadingAll } = useAllStudents(filterParams);

  // -- Mutations --
  const updateClassMutation = useUpdateStudentsClass();
  const graduateMutation = useGraduateStudents();
  const deleteMutation = useDeleteStudents();
  const transferDeptMutation = useTransferToDepartment();
  const promoteGradeMutation = usePromoteGrade();

  // -- Derived Data --
  const students = selectedClassId
    ? studentsByClass || []
    : selectedDepartment
      ? studentsByDepartment || []
      : allStudents || [];

  const isLoading = selectedClassId
    ? isLoadingByClass
    : selectedDepartment
      ? isLoadingByDepartment
      : isLoadingAll;

  // -- Sorting --
  const sortedStudents = [...students].sort((a, b) => {
    let comparison = 0;

    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name, 'ko');
    } else if (sortBy === 'grade') {
      comparison = (a.grade || 0) - (b.grade || 0);
    } else if (sortBy === 'birthday') {
      const dateA = a.birthday ? new Date(a.birthday).getTime() : 0;
      const dateB = b.birthday ? new Date(b.birthday).getTime() : 0;
      comparison = dateA - dateB;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // 선택된 반 정보
  const selectedClass = classes?.find((c) => c.id === selectedClassId);

  // -- Effects --

  // Reset selection when filtering context changes
  useEffect(() => {
    setSelectedStudentIds(new Set());
  }, [selectedClassId, selectedDepartment, selectedGrade, searchQuery]);

  // 교사 자동 반 선택 (Initial Load only)
  useEffect(() => {
    if (authLoading || isAutoSelected || !user) return;

    getUserRole().then((role) => {
      // 교사이고 담당 반이 있는데 아직 선택된 반/부서가 없으면 첫 번째 반 자동 선택
      if (
        role !== 'admin' &&
        role === 'teacher' &&
        teacherClasses &&
        teacherClasses.length > 0 &&
        !selectedClassId &&
        !selectedDepartment
      ) {
        setSelectedClassId(teacherClasses[0].id);
        setIsAutoSelected(true);
      }
    });
  }, [user, authLoading, teacherClasses, selectedClassId, selectedDepartment, isAutoSelected]);

  // -- Handlers --

  const handleStudentClick = (studentId: string) => {
    // 선택 모드가 아닐 때만 이동 (This logic is optional, usually clicking card always navigates, checkbox is for selection)
    // Here we keep navigation on card click, checkbox handles selection
    router.push(`/students/${studentId}`);
  };

  const handleClassSelect = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedDepartment(null);
  };

  const handleDepartmentSelect = (departmentName: string) => {
    setSelectedDepartment(departmentName);
    setSelectedClassId(null);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudentIds(new Set(students.map(s => s.id)));
    } else {
      setSelectedStudentIds(new Set());
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudentIds);
    if (checked) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    setSelectedStudentIds(newSelected);
  };

  // Bulk Actions
  const currentDepartmentName = selectedClass?.department || selectedDepartment || '';

  const handleBulkMove = (targetClassId: string) => {
    updateClassMutation.mutate(
      { studentIds: Array.from(selectedStudentIds), targetClassId },
      {
        onSuccess: () => {
          setSelectedStudentIds(new Set());
          setIsMoveDialogOpen(false);
          window.alert('선택한 학생들이 이동되었습니다.');
        },
        onError: (error: any) => {
          window.alert(`이동 중 오류가 발생했습니다: ${error.message}`);
        },
      }
    );
  };

  const handleBulkGraduate = (graduationYear: number) => {
    // 대학부 -> 청년부 이동 (targetClassId 필요)
    // 청년부 -> 교적 졸업 (비활성화, targetClassId 없음)

    const processGraduation = async () => {
      let targetClassId: string | undefined;
      let successMessage = '졸업 처리가 완료되었습니다.';

      // 대학부인 경우 청년부 미배정 반 조회
      if (currentDepartmentName === '대학부') {
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { getOrCreateUnassignedClass } = await import('@/lib/supabase/classes');
          const unassignedClass = await getOrCreateUnassignedClass('청년부');
          targetClassId = unassignedClass.id;
          successMessage = '졸업생들이 청년부로 이동되었습니다.';
        } catch (e) {
          console.error('청년부 미배정 반 조회 실패', e);
          window.alert('청년부 미배정 반을 찾을 수 없어 졸업 처리를 진행할 수 없습니다.');
          return;
        }
      } else if (currentDepartmentName === '청년부') {
        successMessage = '교적 졸업(비활성화) 처리가 완료되었습니다.';
      }

      graduateMutation.mutate(
        { studentIds: Array.from(selectedStudentIds), graduationYear, targetClassId },
        {
          onSuccess: () => {
            setSelectedStudentIds(new Set());
            setIsGraduateDialogOpen(false);
            window.alert(successMessage);
          },
          onError: (error: any) => {
            window.alert(`졸업 처리 중 오류가 발생했습니다: ${error.message}`);
          },
        }
      );
    };

    processGraduation();
  };

  const handleBulkDelete = () => {

    deleteMutation.mutate(Array.from(selectedStudentIds), {
      onSuccess: () => {
        setSelectedStudentIds(new Set());
        setIsDeleteDialogOpen(false);
        window.alert('선택한 학생들이 영구 삭제되었습니다.');
      },
      onError: (error: any) => {
        window.alert(`삭제 중 오류가 발생했습니다: ${error.message}`);
      },
    });
  };

  const handleBulkTransferDept = (targetClassId: string, departmentName: string) => {
    transferDeptMutation.mutate(
      { studentIds: Array.from(selectedStudentIds), targetClassId },
      {
        onSuccess: () => {
          setSelectedStudentIds(new Set());
          setIsTransferDeptDialogOpen(false);
          window.alert(`선택한 학생들이 ${departmentName} 미배정 반으로 이동되었습니다.\n(학년이 0학년으로 초기화되었습니다)`);
        },
        onError: (error: any) => {
          window.alert(`부서 이동 중 오류가 발생했습니다: ${error.message}`);
        },
      }
    );
  };

  const handleBulkPromote = () => {
    promoteGradeMutation.mutate(Array.from(selectedStudentIds), {
      onSuccess: () => {
        setSelectedStudentIds(new Set());
        setIsPromoteDialogOpen(false);
        window.alert('선택한 학생들의 학년이 승급되었습니다.');
      },
      onError: (error: any) => {
        window.alert(`학년 승급 중 오류가 발생했습니다: ${error.message}`);
      },
    });
  };

  return (
    <>
      <PageHeader
        title="학생 관리"
        description="학생 정보를 조회하고 관리하세요"
      />

      <div className="flex flex-col gap-6 md:flex-row">
        {/* 반 선택 사이드바 */}
        <div className="md:w-64 md:flex-shrink-0">
          <ClassSidebar
            onSelect={handleClassSelect}
            selectedClassId={selectedClassId || undefined}
            onSelectDepartment={handleDepartmentSelect}
            selectedDepartment={selectedDepartment || undefined}
          />
        </div>

        {/* 메인 컨텐츠 */}
        <div className="flex-1 space-y-6">
          {/* 검색 및 필터 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                검색 및 필터
              </CardTitle>
              <CardDescription>
                학생 이름으로 검색하거나 학년별로 필터링할 수 있습니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="text"
                  placeholder="학생 이름 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />

                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger className="w-full sm:w-[120px]">
                    <SelectValue placeholder="학년" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전학년</SelectItem>
                    {[1, 2, 3, 4, 5, 6].map((grade) => (
                      <SelectItem key={grade} value={grade.toString()}>
                        {grade}학년
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {(selectedClass || selectedDepartment || selectedGrade !== 'all' || searchQuery) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedClassId(null);
                      setSelectedDepartment(null);
                      setSelectedGrade('all');
                      setSearchQuery('');
                    }}
                  >
                    초기화
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 선택된 반/부서 정보 */}
          {(selectedClass || selectedDepartment) && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedClass ? '선택된 반' : '선택된 부서'}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">
                  {selectedClass
                    ? `${selectedClass.department} - ${selectedClass.name}`
                    : selectedDepartment}
                </p>
              </CardContent>
            </Card>
          )}

          {/* 학생 목록 */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    학생 목록
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {selectedClass
                      ? `${selectedClass.department} ${selectedClass.name} 학생 목록`
                      : selectedDepartment
                        ? `${selectedDepartment} 전체 학생 목록`
                        : '전체 학생 목록'}
                    {students && ` (${students.length}명)`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* 정렬 버튼 */}
                  <div className="flex items-center gap-1 border rounded-lg p-1 bg-gray-50">
                    <Button
                      variant={sortBy === 'name' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => {
                        if (sortBy === 'name') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('name');
                          setSortOrder('asc');
                        }
                      }}
                      className="h-8 px-3 text-xs"
                    >
                      이름
                      {sortBy === 'name' && (
                        <ArrowUpDown className={`ml-1 h-3 w-3 ${sortOrder === 'desc' ? 'rotate-180' : ''} transition-transform`} />
                      )}
                    </Button>
                    <Button
                      variant={sortBy === 'grade' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => {
                        if (sortBy === 'grade') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('grade');
                          setSortOrder('asc');
                        }
                      }}
                      className="h-8 px-3 text-xs"
                    >
                      학년
                      {sortBy === 'grade' && (
                        <ArrowUpDown className={`ml-1 h-3 w-3 ${sortOrder === 'desc' ? 'rotate-180' : ''} transition-transform`} />
                      )}
                    </Button>
                    <Button
                      variant={sortBy === 'birthday' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => {
                        if (sortBy === 'birthday') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('birthday');
                          setSortOrder('asc');
                        }
                      }}
                      className="h-8 px-3 text-xs"
                    >
                      생년월일
                      {sortBy === 'birthday' && (
                        <ArrowUpDown className={`ml-1 h-3 w-3 ${sortOrder === 'desc' ? 'rotate-180' : ''} transition-transform`} />
                      )}
                    </Button>
                  </div>

                  {students && students.length > 0 && (
                    <div className="flex items-center px-2 py-1 bg-gray-50 rounded border text-sm">
                      <Checkbox
                        id="select-all"
                        checked={selectedStudentIds.size === students.length && students.length > 0}
                        onCheckedChange={handleSelectAll}
                        className="mr-2"
                      />
                      <label htmlFor="select-all" className="cursor-pointer text-gray-600 font-medium">
                        전체 선택
                      </label>
                    </div>
                  )}
                  <Button
                    onClick={() => setIsAddFormOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    학생 추가
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-gray-600">학생 목록을 불러오는 중...</span>
                </div>
              ) : !students || students.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-gray-500">
                    {searchQuery || selectedGrade !== 'all'
                      ? '검색 결과가 없습니다.'
                      : (selectedClass || selectedDepartment)
                        ? '등록된 학생이 없습니다.'
                        : '반을 선택하거나 검색어를 입력해주세요.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedStudents.map((student) => (
                    <div key={student.id} className="relative group">
                      {/* Checkbox Overlay */}
                      <div className="absolute top-4 left-4 z-10" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedStudentIds.has(student.id)}
                          onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                          className="bg-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-gray-300 shadow-sm"
                        />
                      </div>

                      <Card
                        className={`cursor-pointer transition-all border ${selectedStudentIds.has(student.id)
                          ? 'border-primary ring-1 ring-primary bg-primary/5'
                          : 'hover:shadow-md hover:border-gray-300'
                          }`}
                        onClick={() => handleStudentClick(student.id)}
                      >
                        <CardContent className="p-4 pl-12"> {/* Add padding left for checkbox space */}
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                {(student as any).photo_url ? (
                                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200">
                                    <img
                                      src={(student as any).photo_url}
                                      alt={student.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <span className="text-blue-600 font-semibold">
                                      {student.name.charAt(0)}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <div className="font-semibold text-base">{student.name}</div>
                                  <div className="text-sm text-gray-600">
                                    {student.grade}학년
                                    {student.birthday && (
                                      <span className="ml-2">
                                        ({format(new Date(student.birthday), 'yyyy년 M월 d일', {
                                          locale: ko,
                                        })})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-500">
                                {student.parent_contact}
                              </div>
                              {student.school_name && (
                                <div className="text-xs text-gray-400 mt-1">
                                  {student.school_name}
                                </div>
                              )}
                            </div>
                          </div>
                          {student.allergies && typeof student.allergies === 'object' && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <div className="text-xs text-amber-600">
                                알레르기:{' '}
                                {Array.isArray(
                                  (student.allergies as { food?: string[] }).food
                                )
                                  ? (student.allergies as { food?: string[] }).food?.join(', ')
                                  : '정보 없음'}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      <StudentBulkActions
        selectedCount={selectedStudentIds.size}
        onMove={() => setIsMoveDialogOpen(true)}
        onTransferDept={() => setIsTransferDeptDialogOpen(true)}
        onPromote={() => setIsPromoteDialogOpen(true)}
        onGraduate={() => setIsGraduateDialogOpen(true)}
        onDelete={() => setIsDeleteDialogOpen(true)}
        showGraduateButton={currentDepartmentName === '대학부' || currentDepartmentName === '청년부'}
      />

      {/* Dialogs */}
      <StudentMoveDialog
        open={isMoveDialogOpen}
        onOpenChange={setIsMoveDialogOpen}
        onConfirm={handleBulkMove}
        selectedDepartment={currentDepartmentName}
      />

      <StudentDepartmentTransferDialog
        open={isTransferDeptDialogOpen}
        onOpenChange={setIsTransferDeptDialogOpen}
        onConfirm={handleBulkTransferDept}
        count={selectedStudentIds.size}
        currentDepartment={currentDepartmentName}
      />

      <StudentPromoteDialog
        open={isPromoteDialogOpen}
        onOpenChange={setIsPromoteDialogOpen}
        onConfirm={handleBulkPromote}
        students={students.filter(s => selectedStudentIds.has(s.id))}
      />

      <StudentGraduateDialog
        open={isGraduateDialogOpen}
        onOpenChange={setIsGraduateDialogOpen}
        onConfirm={handleBulkGraduate}
      />

      <StudentDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleBulkDelete}
        count={selectedStudentIds.size}
      />

      {/* 학생 추가 폼 모달 */}
      <StudentAddForm
        open={isAddFormOpen}
        onClose={() => setIsAddFormOpen(false)}
        onSuccess={() => {
          setIsAddFormOpen(false);
        }}
        classes={classes || []}
        defaultClassId={selectedClassId || undefined}
      />
    </>
  );
}
