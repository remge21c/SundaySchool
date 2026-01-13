/**
 * 학생 프로필 컴포넌트
 * 학생의 상세 정보를 표시하는 컴포넌트
 */

'use client';

import { useStudentProfile } from '@/hooks/useStudentProfile';
import { useAuth } from '@/hooks/useAuth';
import { useClass } from '@/hooks/useClasses';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { VisitationTimeline } from '@/components/visitation/VisitationTimeline';
import { VisitationForm } from '@/components/visitation/VisitationForm';
import { StudentPhotoUpload } from './StudentPhotoUpload';
import { AllergyEditForm } from './AllergyEditForm';
import { NoteForm } from './NoteForm';
import { NoteTimeline } from './NoteTimeline';
import { User, Phone, MapPin, School, Calendar, AlertTriangle, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { StudentEditForm } from './StudentEditForm';

interface StudentProfileProps {
  studentId: string;
}

export function StudentProfile({ studentId }: StudentProfileProps) {
  const { data: student, isLoading, error } = useStudentProfile(studentId);
  const { user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAllergyEditModalOpen, setIsAllergyEditModalOpen] = useState(false);
  
  // 반 정보 조회
  const { data: classInfo } = useClass(student?.class_id);

  /**
   * 학생 정보 수정 버튼 클릭 핸들러
   */
  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  if (isLoading) {
    return (
      <Container>
        <PageHeader title="학생 프로필" description="학생 정보를 불러오는 중..." />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">로딩 중...</p>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <PageHeader title="학생 프로필" description="학생 정보를 불러오는 중 오류가 발생했습니다." />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-500">
              {error instanceof Error ? error.message : '알 수 없는 오류'}
            </p>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (!student) {
    return (
      <Container>
        <PageHeader title="학생 프로필" description="학생을 찾을 수 없습니다." />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">학생을 찾을 수 없습니다.</p>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // 알레르기 정보 파싱
  const allergies = student.allergies as
    | { food?: string[]; medicine?: string[]; other?: string }
    | null
    | undefined;

  // 제목에 부서와 반 이름 추가
  const title = classInfo
    ? `${student.name} 학생 프로필 (${classInfo.department} ${classInfo.name})`
    : `${student.name} 학생 프로필`;

  return (
    <Container>
      <PageHeader
        title={title}
        description="학생의 상세 정보를 확인하세요"
      />

      <div className="space-y-6">
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  기본 정보
                </CardTitle>
                <CardDescription>학생의 기본 정보입니다</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditClick}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                정보 수정
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 학생 사진 */}
            <div className="flex justify-center pb-4 border-b border-gray-200">
              <StudentPhotoUpload
                studentId={student.id}
                currentPhotoUrl={(student as any).photo_url || null}
                studentName={student.name}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">이름</label>
                <p className="text-lg font-semibold">{student.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">학년</label>
                <p className="text-lg font-semibold">{student.grade}학년</p>
              </div>

              {student.birthday && (
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    생년월일
                  </label>
                  <p className="text-base">
                    {format(new Date(student.birthday), 'yyyy년 M월 d일', { locale: ko })}
                  </p>
                </div>
              )}

              {student.gender && (
                <div>
                  <label className="text-sm font-medium text-gray-500">성별</label>
                  <p className="text-base">{student.gender === 'M' ? '남' : '여'}</p>
                </div>
              )}

              {student.school_name && (
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <School className="h-4 w-4" />
                    학교명
                  </label>
                  <p className="text-base">{student.school_name}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  보호자 연락처
                </label>
                <p className="text-base">{student.parent_contact}</p>
              </div>

              {student.address && (
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    주소
                  </label>
                  <p className="text-base">{student.address}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 알레르기 정보 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  알레르기 정보
                </CardTitle>
                <CardDescription>주의가 필요한 알레르기 정보입니다</CardDescription>
              </div>
              {user && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAllergyEditModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  수정
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {allergies ? (
              <>
                {allergies.food && allergies.food.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">음식 알레르기</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {allergies.food.map((item, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {allergies.medicine && allergies.medicine.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">약물 알레르기</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {allergies.medicine.map((item, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {allergies.other && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">기타 알레르기</label>
                    <p className="mt-2 text-base text-gray-700">{allergies.other}</p>
                  </div>
                )}

                {(!allergies.food || allergies.food.length === 0) &&
                  (!allergies.medicine || allergies.medicine.length === 0) &&
                  !allergies.other && (
                    <p className="text-gray-500">등록된 알레르기 정보가 없습니다.</p>
                  )}
              </>
            ) : (
              <p className="text-gray-500">등록된 알레르기 정보가 없습니다.</p>
            )}
          </CardContent>
        </Card>

        {/* 메모집 */}
        {user && (
          <>
            <NoteForm studentId={student.id} />
            <NoteTimeline studentId={student.id} />
          </>
        )}

        {/* 심방 기록 작성 폼 */}
        {user && (
          <Card>
            <CardHeader>
              <CardTitle>심방 기록 작성</CardTitle>
              <CardDescription>새로운 심방 기록을 작성하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <VisitationForm
                studentId={student.id}
                teacherId={user.id}
              />
            </CardContent>
          </Card>
        )}

        {/* 심방 기록 타임라인 */}
        <Card>
          <CardHeader>
            <CardTitle>심방 기록</CardTitle>
            <CardDescription>학생의 심방 기록을 확인하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <VisitationTimeline studentId={student.id} />
          </CardContent>
        </Card>
      </div>

      {/* 학생 정보 수정 모달 */}
      {student && (
        <>
          <StudentEditForm
            student={student}
            open={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={() => {
              setIsEditModalOpen(false);
            }}
          />
          <AllergyEditForm
            student={student}
            open={isAllergyEditModalOpen}
            onClose={() => setIsAllergyEditModalOpen(false)}
            onSuccess={() => {
              setIsAllergyEditModalOpen(false);
            }}
          />
        </>
      )}
    </Container>
  );
}
