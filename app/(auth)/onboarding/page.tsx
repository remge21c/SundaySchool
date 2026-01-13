'use client';

import { OnboardingTutorial } from '@/components/onboarding/OnboardingTutorial';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * 온보딩 튜토리얼 페이지
 * 튜토리얼 완료 후 대시보드로 리다이렉트
 */
export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    // 이미 완료된 경우 대시보드로 리다이렉트
    const completed = localStorage.getItem('onboarding_completed') === 'true';
    if (completed) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen">
      <OnboardingTutorial />
    </div>
  );
}
