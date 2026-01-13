/**
 * 반 선택 사이드바 컴포넌트
 * 모바일에서 접을 수 있는 사이드바 형태의 반 선택 UI
 */

'use client';

import { useState } from 'react';
import { ClassTree } from './ClassTree';
import { Button } from '@/components/ui/button';
import { X, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClassSidebarProps {
  onSelect: (classId: string) => void;
  selectedClassId?: string;
  year?: number;
  className?: string;
}

export function ClassSidebar({
  onSelect,
  selectedClassId,
  year,
  className,
}: ClassSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 모바일: 토글 버튼 */}
      <div className="md:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="mb-4"
        >
          <Menu className="h-4 w-4 mr-2" />
          반 선택
        </Button>
      </div>

      {/* 사이드바 */}
      <div
        className={cn(
          // 모바일: 오버레이 + 슬라이드
          'md:relative',
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg',
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0 md:shadow-none',
          className
        )}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">반 선택</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="md:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 트리 뷰 */}
        <div className="p-4 overflow-y-auto h-[calc(100vh-4rem)]">
          <ClassTree
            onSelect={(classId) => {
              onSelect(classId);
              setIsOpen(false); // 모바일에서 선택 시 닫기
            }}
            selectedClassId={selectedClassId}
            year={year}
          />
        </div>
      </div>

      {/* 모바일: 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
