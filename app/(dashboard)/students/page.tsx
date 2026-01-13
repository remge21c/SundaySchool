/**
 * 학생 관리 페이지
 * 학생 목록 조회 및 관리
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { ClassSidebar } from '@/components/class/ClassSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useStudentsByClass, useAllStudents } from '@/hooks/useStudents';
import { useAllClasses } from '@/hooks/useClasses';
import { Search, UserPlus, Users, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function StudentsPage() {
  const router = useRouter();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 반 목록 조회
  const { data: classes } = useAllClasses();

  // 선택된 반의 학생 목록 조회
  const { data: studentsByClass, isLoading: isLoadingByClass } = useStudentsByClass(
    selectedClassId || undefined,
    { search: searchQuery || undefined }
  );

  // 전체 학생 목록 조회 (반 선택 안 했을 때)
  const { data: allStudents, isLoading: isLoadingAll } = useAllStudents({
    search: searchQuery || undefined,
  });

  const students = selectedClassId ? studentsByClass : allStudents;
  const isLoading = selectedClassId ? isLoadingByClass : isLoadingAll;

  // 선택된 반 정보
  const selectedClass = classes?.find((c) => c.id === selectedClassId);

  const handleStudentClick = (studentId: string) => {
    router.push(`/students/${studentId}`);
  };

  return (
    <>
      <PageHeader
        title="학생 관리"
        description="학생 정보를 조회하고 관리하세요"
      />

      <div className="flex gap-6">
        {/* 반 선택 사이드바 */}
        <div className="w-64 flex-shrink-0">
          <ClassSidebar
            onSelect={setSelectedClassId}
            selectedClassId={selectedClassId || undefined}
          />
        </div>

        {/* 메인 컨텐츠 */}
        <div className="flex-1 space-y-6">
          {/* 검색 및 필터 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                검색
              </CardTitle>
              <CardDescription>
                학생 이름으로 검색할 수 있습니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="학생 이름 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                {selectedClass && (
                  <Button
                    variant="outline"
                    onClick={() => setSelectedClassId(null)}
                  >
                    전체 보기
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 선택된 반 정보 */}
          {selectedClass && (
            <Card>
              <CardHeader>
                <CardTitle>선택된 반</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">
                  {selectedClass.department} - {selectedClass.name}
                </p>
              </CardContent>
            </Card>
          )}

          {/* 학생 목록 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    학생 목록
                  </CardTitle>
                  <CardDescription>
                    {selectedClass
                      ? `${selectedClass.department} ${selectedClass.name} 학생 목록`
                      : '전체 학생 목록'}
                    {students && ` (${students.length}명)`}
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    // TODO: 학생 추가 모달 또는 페이지로 이동
                    alert('학생 추가 기능은 곧 추가될 예정입니다.');
                  }}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  학생 추가
                </Button>
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
                    {searchQuery
                      ? '검색 결과가 없습니다.'
                      : selectedClass
                        ? '등록된 학생이 없습니다.'
                        : '반을 선택하거나 검색어를 입력해주세요.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {students.map((student) => (
                    <Card
                      key={student.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleStudentClick(student.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-semibold">
                                  {student.name.charAt(0)}
                                </span>
                              </div>
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
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
