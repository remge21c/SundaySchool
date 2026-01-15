/**
 * 상단 네비게이션 바 컴포넌트
 * 모바일에서 햄버거 메뉴와 로그아웃 버튼을 포함
 */

'use client';

import { Menu, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { AbsenceAlertBadge } from '@/components/absence/AbsenceAlertBadge';
import { useQuery } from '@tanstack/react-query';
import { getAppName } from '@/lib/supabase/settings';
import { supabase } from '@/lib/supabase/client';

interface NavbarProps {
  onMenuClick: () => void;
  onLogout: () => void;
  user: SupabaseUser | null;
}

interface ClassAssignment {
  id: string;
  name: string;
  department: string;
}

export function Navbar({ onMenuClick, onLogout, user }: NavbarProps) {
  // 교적부 이름 동적 로드
  const { data: appName = '주일학교 교적부' } = useQuery({
    queryKey: ['app-name'],
    queryFn: getAppName,
    staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
    refetchOnWindowFocus: false,
  });

  // 교사의 소속 부서/반 정보 조회 (부서 순서대로 정렬)
  const { data: teacherClasses = [] } = useQuery({
    queryKey: ['teacher-classes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // 먼저 부서 순서 조회
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: departments } = await (supabase.from('departments') as any)
        .select('name, sort_order')
        .order('sort_order', { ascending: true });

      const deptOrder: Record<string, number> = {};
      (departments || []).forEach((d: any, index: number) => {
        deptOrder[d.name] = d.sort_order ?? index;
      });

      const assignments: ClassAssignment[] = [];
      const addedClassIds = new Set<string>();

      // 1. 담임 반 조회 (classes.main_teacher_id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: mainClasses } = await (supabase.from('classes') as any)
        .select('id, name, department')
        .eq('main_teacher_id', user.id);

      (mainClasses || []).forEach((cls: any) => {
        if (!addedClassIds.has(cls.id)) {
          assignments.push({ id: cls.id, name: cls.name, department: cls.department });
          addedClassIds.add(cls.id);
        }
      });

      // 2. 보조 교사 반 조회 (class_teachers)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: assistClasses } = await (supabase.from('class_teachers') as any)
        .select('class_id, classes(id, name, department)')
        .eq('teacher_id', user.id);

      (assistClasses || []).forEach((item: any) => {
        const cls = item.classes;
        if (cls && !addedClassIds.has(cls.id)) {
          assignments.push({ id: cls.id, name: cls.name, department: cls.department });
          addedClassIds.add(cls.id);
        }
      });

      // 부서 순서대로 정렬
      assignments.sort((a, b) => {
        const orderA = deptOrder[a.department] ?? 999;
        const orderB = deptOrder[b.department] ?? 999;
        return orderA - orderB;
      });

      return assignments;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // "유년부 1반 | 고등부 2반" 형식으로 반환
  const teacherClassesDisplay = teacherClasses
    .map(cls => `${cls.department} ${cls.name}`)
    .join(' | ');

  return (
    <nav className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
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

            {/* 로고/제목 및 소속 부서 */}
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-gray-600">
                {appName}
              </h1>
              {teacherClassesDisplay && (
                <>
                  <span className="text-gray-300 hidden sm:inline">|</span>
                  <span className="text-xl font-bold text-blue-600 hidden sm:inline">
                    {teacherClassesDisplay}
                  </span>
                </>
              )}
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

        {/* 모바일에서 소속 부서 표시 */}
        {teacherClassesDisplay && (
          <div className="sm:hidden pb-2 -mt-1">
            <span className="text-lg font-bold text-blue-600">
              {teacherClassesDisplay}
            </span>
          </div>
        )}
      </div>
    </nav>
  );
}
