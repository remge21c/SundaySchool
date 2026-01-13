/**
 * 관리자 페이지
 * 반 관리 및 교사 배정
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { isAdmin } from '@/lib/utils/auth';
import { PageHeader } from '@/components/layout/PageHeader';
import { ClassManagement } from '@/components/admin/ClassManagement';

export default function AdminPage() {
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
          // 관리자가 아니면 대시보드로 리다이렉트
          router.push('/dashboard');
        }
      } else if (!authLoading && !user) {
        // 로그인되지 않았으면 로그인 페이지로
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
    return null; // 리다이렉트 중
  }

  return (
    <>
      <PageHeader
        title="관리자 페이지"
        description="반 관리 및 교사 배정"
      />
      <ClassManagement />
    </>
  );
}
