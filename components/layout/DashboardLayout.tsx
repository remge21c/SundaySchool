/**
 * 대시보드 레이아웃 컴포넌트
 * 네비게이션 바와 사이드바를 포함한 대시보드 레이아웃
 */

'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Container } from './Container';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 모바일에서 사이드바 자동 닫기 (화면 크기 변경 시)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 인증되지 않은 사용자는 메인 페이지(로그인 페이지)로 리다이렉트
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 모바일 오버레이 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 사이드바 */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPath={pathname}
        onLogout={handleLogout}
        user={user}
      />

      {/* 메인 컨텐츠 영역 */}
      <div className="md:pl-64">
        {/* 상단 네비게이션 바 */}
        <Navbar
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
          user={user}
        />

        {/* 페이지 컨텐츠 */}
        <main className="py-6">
          <Container>{children}</Container>
        </main>
      </div>
    </div>
  );
}
