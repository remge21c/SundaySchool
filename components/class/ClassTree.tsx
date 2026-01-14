/**
 * 반 선택 트리 뷰 컴포넌트
 * 부서별로 그룹화된 반 목록을 트리 형태로 표시
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAllClasses, useClassesByTeacher } from '@/hooks/useClasses';
import { useAuth } from '@/hooks/useAuth';
import { isAdmin } from '@/lib/utils/auth';
import type { Class, ClassGroup } from '@/types/class';
import { ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClassTreeProps {
  onSelect: (classId: string) => void;
  selectedClassId?: string;
  year?: number;
}

/**
 * 반 목록을 부서별로 그룹화
 */
function groupClassesByDepartment(classes: Class[]): ClassGroup[] {
  const groups = new Map<string, Class[]>();

  classes.forEach((cls) => {
    if (!groups.has(cls.department)) {
      groups.set(cls.department, []);
    }
    groups.get(cls.department)!.push(cls);
  });

  return Array.from(groups.entries())
    .map(([department, classes]) => ({
      department,
      classes: classes.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.department.localeCompare(b.department));
}

export function ClassTree({ onSelect, selectedClassId, year }: ClassTreeProps) {
  const { user } = useAuth();
  const [isAdminUser, setIsAdminUser] = useState<boolean | null>(null);

  // 관리자 여부 확인
  useEffect(() => {
    if (user) {
      isAdmin().then(setIsAdminUser);
    }
  }, [user]);

  // 모든 반 조회 (관리자용)
  const { data: allClasses, isLoading: allClassesLoading, error: allClassesError } = useAllClasses(year);

  // 교사의 담당 반 조회 (교사용)
  const { data: teacherClasses, isLoading: teacherClassesLoading, error: teacherClassesError } = useClassesByTeacher(user?.id, year);

  // 관리자인지 여부에 따라 적절한 데이터 사용
  const classes = isAdminUser === true ? allClasses : teacherClasses;
  const isLoading = isAdminUser === null || (isAdminUser ? allClassesLoading : teacherClassesLoading);
  const error = isAdminUser ? allClassesError : teacherClassesError;

  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(
    new Set()
  );

  // 부서별로 그룹화
  const groupedClasses = useMemo(() => {
    if (!classes) return [];
    return groupClassesByDepartment(classes);
  }, [classes]);

  // 교사의 담당 반이 있는 부서들을 자동으로 펼치기
  useEffect(() => {
    if (groupedClasses.length > 0 && expandedDepartments.size === 0) {
      // 모든 부서를 기본으로 펼침
      const allDepartments = new Set(groupedClasses.map(g => g.department));
      setExpandedDepartments(allDepartments);
    }
  }, [groupedClasses, expandedDepartments.size]);

  // 부서 확장/축소 토글
  const toggleDepartment = (department: string) => {
    setExpandedDepartments((prev) => {
      const next = new Set(prev);
      if (next.has(department)) {
        next.delete(department);
      } else {
        next.add(department);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-gray-600">로딩 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-red-600">반 목록을 불러오는데 실패했습니다.</p>
        <p className="text-xs text-gray-500 mt-1">{error.message}</p>
      </div>
    );
  }

  if (!classes || classes.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-gray-500">
          {isAdminUser === false
            ? '배정된 반이 없습니다. 관리자에게 문의하세요.'
            : '등록된 반이 없습니다.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {(groupedClasses || []).map((group) => {
        const isExpanded = expandedDepartments.has(group.department);

        return (
          <div key={group.department} className="space-y-1">
            {/* 부서 헤더 */}
            <button
              onClick={() => toggleDepartment(group.department)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold',
                'hover:bg-gray-100 rounded-md transition-colors',
                'text-left'
              )}
              aria-expanded={isExpanded}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
              <span>{group.department}</span>
              <span className="ml-auto text-xs text-gray-500">
                ({group.classes.length})
              </span>
            </button>

            {/* 반 목록 */}
            {isExpanded && (
              <div className="ml-6 space-y-1">
                {(group.classes || []).map((cls) => {
                  const isSelected = selectedClassId === cls.id;

                  return (
                    <button
                      key={cls.id}
                      onClick={() => onSelect(cls.id)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-sm',
                        'hover:bg-gray-50 rounded-md transition-colors',
                        'text-left',
                        isSelected && 'bg-primary/10 text-primary font-medium'
                      )}
                    >
                      <span className="flex-1">{cls.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
