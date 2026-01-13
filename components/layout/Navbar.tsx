/**
 * 상단 네비게이션 바 컴포넌트
 * 모바일에서 햄버거 메뉴와 로그아웃 버튼을 포함
 */

'use client';

import { useState, useEffect } from 'react';
import { Menu, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { AbsenceAlertBadge } from '@/components/absence/AbsenceAlertBadge';
import { useQuery } from '@tanstack/react-query';
import { getAppName } from '@/lib/supabase/settings';
import { cn } from '@/lib/utils';

interface NavbarProps {
  onMenuClick: () => void;
  onLogout: () => void;
  user: SupabaseUser | null;
}

export function Navbar({ onMenuClick, onLogout, user }: NavbarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // 교적부 이름 동적 로드
  const { data: appName = '주일학교 교적부' } = useQuery({
    queryKey: ['app-name'],
    queryFn: getAppName,
    staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
    refetchOnWindowFocus: false,
  });

  // 스크롤 방향 감지
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 스크롤 다운: 메뉴 숨김 (아래로 이동)
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }
      // 스크롤 업: 메뉴 표시
      else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <nav
      className={cn(
        'sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm transition-transform duration-300 ease-in-out',
        isVisible ? 'translate-y-0' : 'translate-y-full'
      )}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 왼쪽: 햄버거 메뉴 (모바일) */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="md:hidden"
              aria-label="메뉴 열기"
            >
              <Menu className="h-6 w-6" />
            </Button>

            {/* 로고/제목 */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                {appName}
              </h1>
            </div>
          </div>

          {/* 오른쪽: 알림 배지 및 로그아웃 */}
          <div className="flex items-center gap-4">
            {/* 장기 결석 알림 배지 (데스크톱) */}
            {user && (
              <div className="hidden sm:block">
                <AbsenceAlertBadge teacherId={user.id} />
              </div>
            )}

            {/* 사용자 정보 (데스크톱) */}
            {user?.email && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span className="max-w-[200px] truncate">{user.email}</span>
              </div>
            )}

            {/* 로그아웃 버튼 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="flex items-center gap-2"
              aria-label="로그아웃"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">로그아웃</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
