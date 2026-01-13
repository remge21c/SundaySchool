'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * 회원가입 폼 컴포넌트
 */
export function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signUp, isAuthenticated, loading } = useAuth();
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
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    // 비밀번호 확인 검증
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    // 이름 검증
    if (fullName.trim().length === 0) {
      setError('이름을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const error = await signUp(email, password, fullName.trim());

      if (error) {
        setError(error.message || '회원가입 중 오류가 발생했습니다.');
      } else {
        // 회원가입 성공 시 세션 확인
        // 이메일 인증이 필요한 경우 세션이 없을 수 있음
        if (isAuthenticated) {
          // 자동 로그인된 경우 대시보드로 리다이렉트
          router.push('/dashboard');
        } else {
          // 이메일 인증이 필요한 경우 안내 메시지 표시
          setError(null);
          alert('회원가입이 완료되었습니다!\n\n이메일 인증이 필요한 경우, 이메일을 확인해주세요.\n이메일 인증 후 로그인해주세요.');
          router.push('/login');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">교사 회원가입</CardTitle>
        <CardDescription>
          이메일과 비밀번호를 입력하여 회원가입하세요.
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
              placeholder="비밀번호를 입력하세요 (6자 이상)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
              autoComplete="new-password"
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              비밀번호 확인
            </label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="비밀번호를 다시 입력하세요"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isSubmitting}
              autoComplete="new-password"
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium">
              이름
            </label>
            <Input
              id="fullName"
              type="text"
              placeholder="이름을 입력하세요"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={isSubmitting}
              autoComplete="name"
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
            {isSubmitting ? '회원가입 중...' : '회원가입'}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-primary hover:underline">
              로그인
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
