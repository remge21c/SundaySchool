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
import { DepartmentManagement } from '@/components/admin/DepartmentManagement';
import { AppNameSettings } from '@/components/admin/AppNameSettings';
import { Separator } from '@/components/ui/separator';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isAdminUser, setIsAdminUser] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
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
      } catch (err) {
        console.error('관리자 권한 확인 중 에러:', err);
        setError('관리자 권한을 확인하는 중 오류가 발생했습니다.');
        setCheckingAdmin(false);
      }
    };

    checkAdmin();
  }, [user, authLoading, router]);

  if (authLoading || checkingAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-2">로딩 중...</div>
          {error && (
            <div className="text-red-500 text-sm mt-2">{error}</div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">{error}</div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            대시보드로 돌아가기
          </button>
        </div>
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
        description="부서 관리, 반 관리 및 교사 배정"
      />
      <div className="space-y-8">
        <AppNameSettings />
        <Separator />
        <DepartmentManagement />
        <Separator />
        <ClassManagement />
      </div>
    </>
  );
}
