'use client';

import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/components/auth/LoginForm';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';

export function HomeAuthSection() {
    const { loading: authLoading } = useAuth();

    // 로딩 중일 때 표시할 UI (폼 영역만)
    if (authLoading) {
        return (
            <div className="py-12 flex justify-center">
                <div className="text-center">
                    <p className="text-muted-foreground">로딩 중...</p>
                </div>
            </div>
        );
    }

    return (
        <>
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
        </>
    );
}
