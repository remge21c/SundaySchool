/**
 * 최근 심방 기록 컴포넌트
 * 비밀 보장 제외한 최근 심방 기록을 표시
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { getRecentVisitationLogs } from '@/lib/supabase/visitation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Home, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { VisitationType } from '@/types/visitation';

interface RecentVisitationsProps {
  className?: string;
}

/**
 * 심방 유형에 따른 아이콘 및 텍스트 반환
 */
function getVisitationTypeInfo(type: VisitationType) {
  switch (type) {
    case 'call':
      return {
        icon: Phone,
        label: '전화',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
      };
    case 'visit':
      return {
        icon: Home,
        label: '심방',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
      };
    case 'kakao':
      return {
        icon: MessageSquare,
        label: '카카오톡',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
      };
  }
}

export function RecentVisitations({ className }: RecentVisitationsProps) {
  const { data: visitations, isLoading, error } = useQuery({
    queryKey: ['recent-visitations'],
    queryFn: () => getRecentVisitationLogs(10),
    staleTime: 2 * 60 * 1000, // 2분간 fresh 상태 유지
  });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>최근 심방 기록</CardTitle>
        <CardDescription>
          전체 부서의 최근 심방 기록 (비밀 보장 제외)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-gray-500">로딩 중...</div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">
            {error instanceof Error ? error.message : '심방 기록을 불러올 수 없습니다.'}
          </div>
        ) : !visitations || visitations.length === 0 ? (
          <div className="text-center py-4 text-gray-500">심방 기록이 없습니다.</div>
        ) : (
          <div className="space-y-4">
            {(visitations || []).map((visitation) => {
              const typeInfo = getVisitationTypeInfo(visitation.type);
              const Icon = typeInfo.icon;
              const visitDate = format(new Date(visitation.visit_date), 'yyyy년 M월 d일', {
                locale: ko,
              });

              return (
                <div
                  key={visitation.id}
                  className="border rounded-lg p-4 space-y-2 hover:bg-gray-50 transition-colors"
                >
                  {/* 헤더: 날짜, 유형, 학생 이름, 반 정보 */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`p-1.5 rounded ${typeInfo.bgColor}`}>
                          <Icon className={`h-4 w-4 ${typeInfo.color}`} />
                        </div>
                        <span className="font-semibold text-gray-900">{visitDate}</span>
                        <span className="text-gray-400 text-xs">•</span>
                        <span className="text-sm text-gray-600">{typeInfo.label}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-900">{visitation.student_name}</span>
                        {visitation.department && visitation.class_name && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-500 text-xs">
                              {visitation.department} - {visitation.class_name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 심방 내용 */}
                  <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-2">
                    {visitation.content}
                  </p>

                  {/* 기도 제목 */}
                  {visitation.prayer_request && (
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">기도 제목:</span>
                        <span className="text-gray-700">{visitation.prayer_request}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
