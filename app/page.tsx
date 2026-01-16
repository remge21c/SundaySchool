import { getAppSettingsServer } from '@/lib/supabase/settings-server';
import { Container } from '@/components/layout/Container';
import { HomeAuthSection } from '@/components/home/HomeAuthSection';

/**
 * 메인 페이지 (로그인 페이지)
 * 서버 컴포넌트로서 설정을 미리 불러옴
 */
export default async function Home() {
  const settings = await getAppSettingsServer();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background py-12 px-4">
      <Container>
        <div className="w-full max-w-md mx-auto space-y-8">
          {/* 상단: 제목 및 설명 */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">
              {settings.app_name}
            </h1>
            <p className="text-muted-foreground text-lg">
              {settings.description}
            </p>
          </div>

          {/* 중앙: 로그인 폼 및 회원가입 버튼 */}
          <HomeAuthSection />
        </div>
      </Container>
    </div>
  );
}
