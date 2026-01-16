'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/components/auth/LoginForm';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';

/**
 * 메인 페이지 (로그인 페이지)
 */
export default function Home() {
  const { loading: authLoading } = useAuth();
  const [appName, setAppName] = useState('차세대 주일학교 교적부');
  const [description, setDescription] = useState('행정은 간소하게, 사역은 깊이 있게');

  useEffect(() => {
    // 설정 불러오기
    import('@/lib/supabase/settings').then(({ getAppSettings }) => {
      getAppSettings().then((settings) => {
        if (settings) {
          setAppName(settings.app_name);
          if (settings.description) {
            setDescription(settings.description);
          }
        }
      });
    });
  }, []);

  // 로딩 중일 때
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background py-12 px-4">
      <Container>
        <div className="w-full max-w-md mx-auto space-y-8">
          {/* 상단: 제목 및 설명 */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">
              {appName}
            </h1>
            <p className="text-muted-foreground text-lg">
              {description}
            </p>
          </div>

          {/* 중앙: 로그인 폼 */}
          <LoginForm />

          {/* 하단: 회원가입 버튼 */}
          <div className="flex justify-center">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full max-w-md"
            >
              <Link href="/signup">
                <UserPlus className="mr-2 h-5 w-5" />
                교사 회원가입
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
