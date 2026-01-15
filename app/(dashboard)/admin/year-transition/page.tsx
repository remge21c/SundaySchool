/**
 * 학년도 전환 페이지
 * 관리자용 연도 전환 대시보드
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { isAdmin } from '@/lib/utils/auth';
import { PageHeader } from '@/components/layout/PageHeader';
import { YearTransition } from '@/components/admin/YearTransition';

export default function YearTransitionPage() {
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
                        router.push('/dashboard');
                    }
                } else if (!authLoading && !user) {
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
        return null;
    }

    return (
        <>
            <PageHeader
                title="학년도 전환"
                description="새 학년도 반 생성 및 학생 배정 관리"
            />
            <YearTransition />
        </>
    );
}
