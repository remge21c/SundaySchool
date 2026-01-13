/**
 * 심방 타임라인 컴포넌트
 * 학생별 심방 기록을 시간순으로 표시하는 컴포넌트
 */

'use client';

import { useVisitations } from '@/hooks/useVisitations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Home, MessageSquare, Lock, Heart } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { VisitationType } from '@/types/visitation';

interface VisitationTimelineProps {
  studentId: string;
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

export function VisitationTimeline({ studentId }: VisitationTimelineProps) {
  const { data: visitations, isLoading, error } = useVisitations({ student_id: studentId });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>심방 기록</CardTitle>
          <CardDescription>심방 이력을 시간순으로 확인하세요</CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">로딩 중...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>심방 기록</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <p className="text-red-500">
            {error instanceof Error ? error.message : '심방 기록을 불러오는 중 오류가 발생했습니다.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!visitations || visitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>심방 기록</CardTitle>
          <CardDescription>심방 이력을 시간순으로 확인하세요</CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">심방 기록이 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>심방 기록</CardTitle>
        <CardDescription>심방 이력을 시간순으로 확인하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {visitations.map((visitation, index) => {
            const typeInfo = getVisitationTypeInfo(visitation.type);
            const Icon = typeInfo.icon;
            const visitDate = format(new Date(visitation.visit_date), 'yyyy년 M월 d일', {
              locale: ko,
            });

            return (
              <div
                key={visitation.id}
                className="relative pl-8 pb-6 border-l-2 border-gray-200 last:border-l-0 last:pb-0"
              >
                {/* 타임라인 연결선 */}
                {index < visitations.length - 1 && (
                  <div className="absolute left-[-5px] top-8 w-2 h-2 bg-gray-300 rounded-full" />
                )}

                {/* 날짜 및 유형 */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${typeInfo.bgColor}`}>
                      <Icon className={`h-4 w-4 ${typeInfo.color}`} />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{visitDate}</div>
                      <div className="text-sm text-gray-600">{typeInfo.label}</div>
                    </div>
                  </div>

                  {visitation.is_confidential && (
                    <div className="flex items-center gap-1 text-amber-600 text-sm">
                      <Lock className="h-4 w-4" />
                      <span>비밀</span>
                    </div>
                  )}
                </div>

                {/* 심방 내용 */}
                <div className="ml-12 mt-2">
                  <p className="text-gray-700 whitespace-pre-wrap">{visitation.content}</p>

                  {/* 기도 제목 */}
                  {visitation.prayer_request && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-2">
                        <Heart className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-blue-900 mb-1">기도 제목</div>
                          <p className="text-sm text-blue-800 whitespace-pre-wrap">
                            {visitation.prayer_request}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
