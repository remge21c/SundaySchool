'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';

/**
 * UI 컴포넌트 테스트 페이지
 * 개발 환경에서만 사용
 */
export default function ComponentsTestPage() {
  return (
    <Container>
      <PageHeader
        title="UI 컴포넌트 테스트"
        description="Shadcn/UI 컴포넌트와 레이아웃 컴포넌트를 테스트합니다."
      />

      <div className="space-y-8">
        {/* Button 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle>Button 컴포넌트</CardTitle>
            <CardDescription>다양한 버튼 스타일을 확인합니다.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button>기본 버튼</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
          </CardContent>
        </Card>

        {/* Input 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle>Input 컴포넌트</CardTitle>
            <CardDescription>입력 필드를 확인합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input type="text" placeholder="이름을 입력하세요" />
            <Input type="email" placeholder="이메일을 입력하세요" />
            <Input type="password" placeholder="비밀번호를 입력하세요" />
            <Input type="text" placeholder="비활성화된 입력" disabled />
          </CardContent>
        </Card>

        {/* Card 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle>Card 컴포넌트</CardTitle>
            <CardDescription>카드 레이아웃을 확인합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              이 카드는 Card 컴포넌트로 구성되어 있습니다.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline">액션</Button>
          </CardFooter>
        </Card>

        {/* 색상 팔레트 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle>디자인 시스템 색상</CardTitle>
            <CardDescription>컬러 팔레트를 확인합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <div className="h-16 rounded-md bg-primary"></div>
                <p className="text-sm font-medium">Primary</p>
                <p className="text-xs text-muted-foreground">#3B82F6</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-md bg-secondary"></div>
                <p className="text-sm font-medium">Secondary</p>
                <p className="text-xs text-muted-foreground">#F59E0B</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-md bg-destructive"></div>
                <p className="text-sm font-medium">Destructive</p>
                <p className="text-xs text-muted-foreground">#EF4444</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-md bg-muted"></div>
                <p className="text-sm font-medium">Muted</p>
                <p className="text-xs text-muted-foreground">#F3F4F6</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
