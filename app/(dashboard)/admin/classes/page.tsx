/**
 * 반 관리 페이지
 * 관리자가 반을 생성, 수정, 삭제하는 페이지
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { isAdmin } from '@/lib/utils/auth';
import { PageHeader } from '@/components/layout/PageHeader';
import { ClassManagement } from '@/components/admin/ClassManagement';

export default function ClassesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isAdminUser, setIsAdminUser] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!authLoading && user) {
        const admin = await isAdmin();
        setIsAdminUser(admin);
        setCheckingAdmin(false);

        if (!admin) {
          router.push('/dashboard');
        }
      } else if (!authLoading && !user) {
        router.push('/login');
      }
    };

    checkAdmin();
  }, [user, authLoading, router]);

  if (authLoading || checkingAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!isAdminUser) {
    return null;
  }

  return (
    <>
      <PageHeader
        title="반 관리"
        description="반을 생성, 수정, 삭제할 수 있습니다"
      />
      <ClassManagement />
    </>
  );
}
