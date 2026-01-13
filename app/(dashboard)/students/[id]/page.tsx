/**
 * 학생 프로필 페이지
 * 동적 라우트: /students/[id]
 */

import { StudentProfile } from '@/components/student/StudentProfile';

interface StudentProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentProfilePage({
  params,
}: StudentProfilePageProps) {
  const { id } = await params;

  return <StudentProfile studentId={id} />;
}
