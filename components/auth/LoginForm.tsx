'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * 로그인 폼 컴포넌트
 */
export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // 이미 인증된 경우 대시보드로 리다이렉트
  useEffect(() => {
    if (isAuthenticated && !loading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  if (isAuthenticated) {
    return null;
  }

  /**
   * 이메일 형식 검증
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * 폼 제출 핸들러
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // 이메일 형식 검증
    if (!validateEmail(email)) {
      setError('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    // 비밀번호 검증
    if (password.length < 4) {
      setError('비밀번호는 4자 이상이어야 합니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const error = await signIn(email, password);

      if (error) {
        // Supabase 에러 메시지를 더 친화적으로 변환
        let errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
        
        if (error.message) {
          if (error.message.includes('Invalid login credentials')) {
            errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
          } else if (error.message.includes('Email not confirmed')) {
            errorMessage = '이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.';
          } else if (error.message.includes('User not found')) {
            errorMessage = '등록되지 않은 이메일입니다. 회원가입을 먼저 진행해주세요.';
          } else {
            errorMessage = error.message;
          }
        }
        
        setError(errorMessage);
      } else {
        // 로그인 성공 시 세션이 저장될 시간을 주고 대시보드로 리다이렉트
        // 모바일에서 세션 저장 지연을 고려하여 약간의 지연 추가
        setTimeout(() => {
          router.replace('/dashboard');
        }, 100);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">로그인</CardTitle>
        <CardDescription>
          이메일과 비밀번호를 입력하여 로그인하세요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              이메일
            </label>
            <Input
              id="email"
              type="email"
              placeholder="teacher@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              비밀번호
            </label>
            <Input
              id="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? '로그인 중...' : '로그인'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
