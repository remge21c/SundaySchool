'use client';

import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/components/auth/LoginForm';
import { Container } from '@/components/layout/Container';

/**
 * 로그인 페이지
 */
export default function LoginPage() {
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
          <LoginForm />
        </div>
      </Container>
    </div>
  );
}
