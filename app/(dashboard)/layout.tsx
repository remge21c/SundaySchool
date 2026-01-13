/**
 * 대시보드 레이아웃
 * 모든 대시보드 페이지에 네비게이션 바와 사이드바를 적용
 */

import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
