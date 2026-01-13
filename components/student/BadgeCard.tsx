/**
 * 배지 카드 컴포넌트
 * 학생의 획득한 배지 목록을 표시
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { getStudentBadges, getAllBadges } from '@/lib/supabase/badges';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface BadgeCardProps {
  studentId: string;
}

export function BadgeCard({ studentId }: BadgeCardProps) {
  // 학생이 획득한 배지 조회
  const { data: studentBadges = [], isLoading: isLoadingStudentBadges } = useQuery({
    queryKey: ['student-badges', studentId],
    queryFn: () => getStudentBadges(studentId),
    staleTime: 5 * 60 * 1000, // 5분
  });

  // 모든 배지 조회 (미획득 배지도 표시하기 위해)
  const { data: allBadges = [], isLoading: isLoadingAllBadges } = useQuery({
    queryKey: ['badges', 'all'],
    queryFn: () => getAllBadges(),
    staleTime: 10 * 60 * 1000, // 10분
  });

  const isLoading = isLoadingStudentBadges || isLoadingAllBadges;

  // 획득한 배지 ID Set
  const earnedBadgeIds = new Set(studentBadges.map((sb) => sb.badge_id));

  // 획득한 배지와 미획득 배지 분리
  const earnedBadges = studentBadges
    .map((sb) => ({
      ...sb.badge,
      earned_at: sb.earned_at,
    }))
    .filter((b) => b.id); // badge 정보가 있는 것만

  const unearnedBadges = allBadges.filter((badge) => !earnedBadgeIds.has(badge.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-600" />
          배지
        </CardTitle>
        <CardDescription>학생이 획득한 배지 목록입니다</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-gray-500">로딩 중...</p>
        ) : (
          <>
            {/* 획득한 배지 */}
            {earnedBadges.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">획득한 배지 ({earnedBadges.length})</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {earnedBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className="flex flex-col items-center p-3 bg-yellow-50 border-2 border-yellow-200 rounded-lg"
                    >
                      {badge.icon_url ? (
                        <img src={badge.icon_url} alt={badge.name} className="w-12 h-12 mb-2" />
                      ) : (
                        <Award className="w-12 h-12 text-yellow-600 mb-2" />
                      )}
                      <p className="text-sm font-semibold text-center mb-1">{badge.name}</p>
                      {badge.earned_at && (
                        <p className="text-xs text-gray-500">
                          {format(new Date(badge.earned_at), 'yyyy.M.d', { locale: ko })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 미획득 배지 */}
            {unearnedBadges.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">미획득 배지 ({unearnedBadges.length})</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {unearnedBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className={cn(
                        'flex flex-col items-center p-3 bg-gray-50 border-2 border-gray-200 rounded-lg',
                        'opacity-50'
                      )}
                    >
                      {badge.icon_url ? (
                        <img src={badge.icon_url} alt={badge.name} className="w-12 h-12 mb-2 grayscale" />
                      ) : (
                        <Award className="w-12 h-12 text-gray-400 mb-2" />
                      )}
                      <p className="text-sm font-semibold text-center text-gray-500">{badge.name}</p>
                      {badge.description && (
                        <p className="text-xs text-gray-400 mt-1 text-center">{badge.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 배지가 없는 경우 */}
            {earnedBadges.length === 0 && unearnedBadges.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">배지가 없습니다.</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
