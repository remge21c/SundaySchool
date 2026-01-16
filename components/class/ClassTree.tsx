/**
 * 반 선택 트리 뷰 컴포넌트
 * 부서별로 그룹화된 반 목록을 트리 형태로 표시
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAllClasses, useClassesByTeacher } from '@/hooks/useClasses';
import { useAuth } from '@/hooks/useAuth';
import { isAdmin } from '@/lib/utils/auth';
import { getAllDepartments, Department } from '@/lib/supabase/departments';
import type { Class, ClassGroup } from '@/types/class';
import { ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClassTreeProps {
  onSelect: (classId: string) => void;
  selectedClassId?: string;
  onSelectDepartment?: (departmentName: string) => void;
  selectedDepartment?: string;
  year?: number;
}

/**
 * 반 목록을 부서별로 그룹화
 */
function groupClassesByDepartment(classes: Class[], departments: Department[]): ClassGroup[] {
  const groups = new Map<string, Class[]>();

  classes.forEach((cls) => {
    if (!groups.has(cls.department)) {
      groups.set(cls.department, []);
    }
    groups.get(cls.department)!.push(cls);
  });

  // 부서 정렬 순서 맵 생성 (이름 -> 인덱스)
  const deptOrderMap = new Map<string, number>();
  departments.forEach((dept, index) => {
    deptOrderMap.set(dept.name, index);
  });

  return Array.from(groups.entries())
    .map(([department, classes]) => ({
      department,
      classes: classes.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => {
      const indexA = deptOrderMap.get(a.department) ?? 999;
      const indexB = deptOrderMap.get(b.department) ?? 999;

      // 둘 다 순서 목록에 있으면 순서대로 정렬
      if (indexA !== 999 && indexB !== 999) {
        return indexA - indexB;
      }

      // A만 목록에 있으면 A를 앞으로
      if (indexA !== 999) {
        return -1;
      }

      // B만 목록에 있으면 B를 앞으로
      if (indexB !== 999) {
        return 1;
      }

      // 둘 다 목록에 없으면 이름순 정렬
      return a.department.localeCompare(b.department);
    });
}

export function ClassTree({
  onSelect,
  selectedClassId,
  onSelectDepartment,
  selectedDepartment,
  year
}: ClassTreeProps) {
  const { user } = useAuth();
  const [isAdminUser, setIsAdminUser] = useState<boolean | null>(null);

  // 관리자 여부 확인
  useEffect(() => {
    if (user) {
      isAdmin().then(setIsAdminUser);
    }
  }, [user]);

  // 부서 목록 조회
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: getAllDepartments,
    staleTime: 10 * 60 * 1000, // 10분간 캐시 유지
  });

  // 모든 반 조회 (관리자용) - 항상 조회하되 관리자일 때만 사용
  const { data: allClasses, isLoading: allClassesLoading, error: allClassesError } = useAllClasses(year);

  // 교사의 담당 반 조회 (교사용) - 항상 조회
  const { data: teacherClasses, isLoading: teacherClassesLoading, error: teacherClassesError } = useClassesByTeacher(user?.id, year);

  // 관리자 확인 완료 전에는 교사 데이터를 먼저 표시 (더 빠름)
  // 관리자인지 확인되면 그때 전체 데이터로 전환
  const classes = isAdminUser === true ? allClasses : teacherClasses;

  // 로딩 상태: 교사 데이터가 준비되면 일단 표시 (관리자 확인은 백그라운드에서 계속)
  const isLoading = teacherClassesLoading || (isAdminUser === true && allClassesLoading);
  const error = isAdminUser === true ? allClassesError : teacherClassesError;

  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(
    new Set()
  );

  // 부서별로 그룹화
  const groupedClasses = useMemo(() => {
    if (!classes) return [];
    return groupClassesByDepartment(classes, departments);
  }, [classes, departments]);

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
        const isDeptSelected = selectedDepartment === group.department;

        return (
          <div key={group.department} className="space-y-1">
            {/* 부서 헤더 */}
            <div className="flex items-center w-full">
              <button
                onClick={() => toggleDepartment(group.department)}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-500"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => {
                  if (onSelectDepartment) {
                    onSelectDepartment(group.department);
                  } else {
                    toggleDepartment(group.department);
                  }
                }}
                className={cn(
                  'flex-1 flex items-center gap-2 px-2 py-2 text-sm font-semibold',
                  'hover:bg-gray-100 rounded-md transition-colors',
                  'text-left',
                  isDeptSelected && 'bg-primary/10 text-primary'
                )}
              >
                <span>{group.department}</span>
                <span className="ml-auto text-xs text-gray-500">
                  ({group.classes.length})
                </span>
              </button>
            </div>

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
                      <span className="flex-1 flex items-center gap-2">
                        <span>{cls.name}</span>
                        {cls.name === '미배정' && (cls.student_count || 0) > 0 && (
                          <span className="flex h-2 w-2 rounded-full bg-red-500" title="미배정 학생 있음" />
                        )}
                        {cls.student_count !== undefined && (
                          <span className="ml-auto text-xs text-gray-400">
                            ({cls.student_count}명)
                          </span>
                        )}
                      </span>
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
