'use client';

import { useAuth } from '@/hooks/useAuth';
import { SignupForm } from '@/components/auth/SignupForm';
import { Container } from '@/components/layout/Container';

/**
 * 회원가입 페이지
 */
export default function SignupPage() {
  const { loading } = useAuth();

  // 로딩 중일 때
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Container>
        <div className="flex justify-center">
          <SignupForm />
        </div>
      </Container>
    </div>
  );
}
