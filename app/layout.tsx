import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/lib/providers/QueryProvider';

export const metadata: Metadata = {
  title: '차세대 주일학교 교적부',
  description: '행정은 간소하게, 사역은 깊이 있게',
  // favicon은 app/icon.ico 또는 public/favicon.ico에 위치하면 자동으로 인식됩니다
  // icons 설정을 제거하여 404 에러 방지
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
