/**
 * 달란트 포인트 카드 컴포넌트
 * 학생의 달란트 포인트 잔액 및 거래 내역을 표시
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTalentBalance, getTalentTransactions, getActiveTalentRules, awardTalentByCategory } from '@/lib/supabase/talent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, TrendingUp, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentWeekRange } from '@/lib/utils/date';
import { getUserRole } from '@/lib/utils/auth';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TalentCardProps {
  studentId: string;
}

export function TalentCard({ studentId }: TalentCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isTeacher, setIsTeacher] = useState(false);
  const [awardModalOpen, setAwardModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // 교사 여부 확인
  useEffect(() => {
    if (user) {
      getUserRole().then((role) => {
        setIsTeacher(role === 'teacher' || role === 'admin');
      });
    }
  }, [user]);

  // 달란트 잔액 조회
  const { data: balance = 0, isLoading: isLoadingBalance } = useQuery({
    queryKey: ['talent-balance', studentId],
    queryFn: () => getTalentBalance(studentId),
    staleTime: 30 * 1000, // 30초
  });

  // 달란트 거래 내역 조회
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['talent-transactions', studentId],
    queryFn: () => getTalentTransactions(studentId, 5),
    staleTime: 30 * 1000,
  });

  // 활성 달란트 규칙 조회 (교사 승인 필요한 항목만)
  const { data: rules = [], isLoading: isLoadingRules } = useQuery({
    queryKey: ['talent-rules', 'active'],
    queryFn: () => getActiveTalentRules(),
    enabled: isTeacher,
    staleTime: 5 * 60 * 1000, // 5분
  });

  // 교사 승인 필요한 규칙만 필터링
  const approvalRules = rules.filter((rule) => rule.requires_approval && rule.category !== '출석');

  // 달란트 지급 mutation
  const awardMutation = useMutation({
    mutationFn: (category: string) => awardTalentByCategory(studentId, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent-balance', studentId] });
      queryClient.invalidateQueries({ queryKey: ['talent-transactions', studentId] });
      setAwardModalOpen(false);
      setSelectedCategory(null);
      // 성공 메시지는 모달이 닫히면서 자동으로 반영됨
    },
    onError: (error: Error) => {
      alert(error.message || '달란트 포인트 지급에 실패했습니다.');
    },
  });

  const handleAwardClick = (category: string) => {
    setSelectedCategory(category);
    setAwardModalOpen(true);
  };

  const handleConfirmAward = () => {
    if (selectedCategory) {
      awardMutation.mutate(selectedCategory);
    }
  };

  const selectedRule = selectedCategory ? rules.find((r) => r.category === selectedCategory) : null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-600" />
            달란트 포인트
          </CardTitle>
          <CardDescription>학생의 달란트 포인트 현황입니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 현재 잔액 */}
          <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">현재 잔액</p>
              {isLoadingBalance ? (
                <p className="text-2xl font-bold text-amber-600">로딩 중...</p>
              ) : (
                <p className="text-3xl font-bold text-amber-600">{balance.toLocaleString()}</p>
              )}
            </div>
            <TrendingUp className="h-8 w-8 text-amber-600" />
          </div>

          {/* 포인트 지급 버튼 (교사만 보임) */}
          {isTeacher && approvalRules.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">포인트 지급</p>
              <div className="grid grid-cols-2 gap-2">
                {approvalRules.map((rule) => (
                  <Button
                    key={rule.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAwardClick(rule.category)}
                    disabled={awardMutation.isPending}
                    className="justify-start"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {rule.category} (+{rule.amount})
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* 최근 거래 내역 */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">최근 거래 내역</p>
            {isLoadingTransactions ? (
              <p className="text-sm text-gray-500">로딩 중...</p>
            ) : transactions.length > 0 ? (
              <div className="space-y-2">
                {transactions.map((transaction) => {
                  // 출석 항목인 경우 이번주 일요일 날짜로 표시
                  const displayDate =
                    transaction.category === '출석'
                      ? new Date(getCurrentWeekRange().startDate)
                      : new Date(transaction.created_at);

                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-2 rounded text-sm bg-gray-50"
                    >
                      <div>
                        <p className="font-medium">{transaction.category}</p>
                        <p className="text-xs text-gray-500">
                          {format(displayDate, 'yyyy년 M월 d일', { locale: ko })}
                        </p>
                      </div>
                      <p className={`font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.amount > 0 ? '+' : ''}
                        {transaction.amount.toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">거래 내역이 없습니다.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 포인트 지급 확인 모달 */}
      <Dialog open={awardModalOpen} onOpenChange={setAwardModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>달란트 포인트 지급</DialogTitle>
            <DialogDescription>
              {selectedRule && (
                <>
                  <p className="mt-2">
                    <span className="font-semibold">{selectedRule.category}</span> 항목으로{' '}
                    <span className="font-semibold text-amber-600">+{selectedRule.amount} 달란트</span>를 지급하시겠습니까?
                  </p>
                  {selectedRule.description && (
                    <p className="mt-2 text-sm text-gray-500">{selectedRule.description}</p>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAwardModalOpen(false)} disabled={awardMutation.isPending}>
              취소
            </Button>
            <Button onClick={handleConfirmAward} disabled={awardMutation.isPending || !selectedCategory}>
              {awardMutation.isPending ? '지급 중...' : '지급하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
