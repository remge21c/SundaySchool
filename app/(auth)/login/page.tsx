'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 로그인 페이지 - 메인 페이지로 리다이렉트
 */
export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // 메인 페이지로 리다이렉트
    router.replace('/');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">리다이렉트 중...</p>
      </div>
    </div>
  );
}
