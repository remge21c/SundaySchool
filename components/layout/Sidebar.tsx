/**
 * 사이드바 네비게이션 컴포넌트
 * 모바일과 데스크톱 모두 지원
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Home, Calendar, X, Users, Settings, CalendarClock, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { isAdmin } from '@/lib/utils/auth';
import { supabase } from '@/lib/supabase/client';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  onLogout: () => void;
  user: SupabaseUser | null;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  adminOnly?: boolean;
  departmentScopeAllowed?: boolean; // 부서 전체 권한자도 접근 가능
}

export function Sidebar({ isOpen, onClose, currentPath, user }: SidebarProps) {
  const router = useRouter();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [hasDepartmentScope, setHasDepartmentScope] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!user) return;

      // Admin 확인
      const admin = await isAdmin();
      setIsAdminUser(admin);

      // 부서 전체 권한 확인
      if (!admin) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase.from('profiles') as any)
          .select('department_permissions')
          .eq('id', user.id)
          .single();

        if (data?.department_permissions) {
          const hasDeptScope = Object.values(data.department_permissions).some(
            (setting: any) =>
              typeof setting === 'object' && setting?.permission_scope === 'department'
          );
          setHasDepartmentScope(hasDeptScope);
        }
      }
    };
    checkPermissions();
  }, [user]);

  const navItems: NavItem[] = [
    {
      label: '대시보드',
      path: '/dashboard',
      icon: <Home className="h-5 w-5" />,
    },
    {
      label: '출석 체크',
      path: '/attendance',
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      label: '학생 관리',
      path: '/students',
      icon: <Users className="h-5 w-5" />,
    },

    {
      label: '관리자',
      path: '/admin',
      icon: <Settings className="h-5 w-5" />,
      adminOnly: true,
    },
    {
      label: '교사 관리',
      path: '/admin/teachers',
      icon: <UserCog className="h-5 w-5" />,
      adminOnly: true,
      departmentScopeAllowed: true, // 부서 전체 권한자도 접근 가능
    },
    {
      label: '학년도 전환',
      path: '/admin/year-transition',
      icon: <CalendarClock className="h-5 w-5" />,
      adminOnly: true,
    },
  ];

  // 메뉴 필터링: admin이거나, departmentScopeAllowed이고 hasDepartmentScope인 경우 표시
  const visibleNavItems = (navItems || []).filter((item) => {
    if (!item.adminOnly) return true;
    if (isAdminUser) return true;
    if (item.departmentScopeAllowed && hasDepartmentScope) return true;
    return false;
  });

  const handleNavClick = (path: string) => {
    router.push(path);
    onClose(); // 모바일에서 클릭 시 사이드바 닫기
  };

  return (
    <>
      {/* 모바일 사이드바 오버레이 */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 h-16">
            <h2 className="text-lg font-semibold text-gray-900">메뉴</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="md:hidden"
              aria-label="메뉴 닫기"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* 네비게이션 아이템 */}
          <nav className="flex-1 p-4 space-y-2">
            {(visibleNavItems || []).map((item, index) => {
              const isActive = currentPath === item.path;
              return (
                <button
                  key={`${item.path}-${item.label}-${index}`}
                  onClick={() => handleNavClick(item.path)}
                  className={cn(
                    'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                    'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(isActive ? 'text-blue-600' : 'text-gray-500')}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && <div>{item.badge}</div>}
                </button>
              );
            })}
          </nav>

          {/* 사용자 정보 (하단) */}
          {user?.email && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-medium">
                    {user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{user.email}</p>
                  <p className="text-xs text-gray-500">
                    {isAdminUser ? '관리자' : hasDepartmentScope ? '부서 관리자' : '교사'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
