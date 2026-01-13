import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AttendanceStats } from '@/components/attendance/AttendanceStats';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as attendanceApi from '@/lib/supabase/attendance';

// Supabase 모킹
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            then: vi.fn((callback) => {
              callback({
                data: [],
                error: null,
              });
            }),
          })),
        })),
      })),
    })),
  },
}));

// getAttendanceStats 모킹
vi.mock('@/lib/supabase/attendance', async () => {
  const actual = await vi.importActual('@/lib/supabase/attendance');
  return {
    ...actual,
    getAttendanceStats: vi.fn(),
  };
});

describe('AttendanceStats', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderWithQuery = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
    );
  };

  it('should render attendance statistics', async () => {
    vi.mocked(attendanceApi.getAttendanceStats).mockResolvedValue({
      total: 10,
      present: 7,
      absent: 2,
      late: 1,
      attendanceRate: 80.0,
    });

    renderWithQuery(
      <AttendanceStats classId="test-class-id" date="2025-01-12" />
    );

    await waitFor(() => {
      expect(screen.getByText(/출석 통계/i)).toBeInTheDocument();
    });
  });

  it('should display total students count', async () => {
    vi.mocked(attendanceApi.getAttendanceStats).mockResolvedValue({
      total: 10,
      present: 7,
      absent: 2,
      late: 1,
      attendanceRate: 80.0,
    });

    renderWithQuery(
      <AttendanceStats classId="test-class-id" date="2025-01-12" />
    );

    await waitFor(() => {
      expect(screen.getByText(/전체 학생/i)).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  it('should display present count', async () => {
    vi.mocked(attendanceApi.getAttendanceStats).mockResolvedValue({
      total: 10,
      present: 7,
      absent: 2,
      late: 1,
      attendanceRate: 80.0,
    });

    renderWithQuery(
      <AttendanceStats classId="test-class-id" date="2025-01-12" />
    );

    await waitFor(() => {
      const presentTexts = screen.getAllByText(/출석/i);
      expect(presentTexts.length).toBeGreaterThan(0);
      expect(screen.getByText('7')).toBeInTheDocument();
    });
  });

  it('should display absent count', async () => {
    vi.mocked(attendanceApi.getAttendanceStats).mockResolvedValue({
      total: 10,
      present: 7,
      absent: 2,
      late: 1,
      attendanceRate: 80.0,
    });

    renderWithQuery(
      <AttendanceStats classId="test-class-id" date="2025-01-12" />
    );

    await waitFor(() => {
      expect(screen.getByText(/결석/i)).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('should display late count', async () => {
    vi.mocked(attendanceApi.getAttendanceStats).mockResolvedValue({
      total: 10,
      present: 7,
      absent: 2,
      late: 1,
      attendanceRate: 80.0,
    });

    renderWithQuery(
      <AttendanceStats classId="test-class-id" date="2025-01-12" />
    );

    await waitFor(() => {
      expect(screen.getByText(/지각/i)).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('should display attendance rate', async () => {
    vi.mocked(attendanceApi.getAttendanceStats).mockResolvedValue({
      total: 10,
      present: 7,
      absent: 2,
      late: 1,
      attendanceRate: 80.0,
    });

    renderWithQuery(
      <AttendanceStats classId="test-class-id" date="2025-01-12" />
    );

    await waitFor(() => {
      const rateTexts = screen.getAllByText(/출석률/i);
      expect(rateTexts.length).toBeGreaterThan(0);
      const rateValues = screen.getAllByText('80%');
      expect(rateValues.length).toBeGreaterThan(0);
    });
  });

  it('should show loading state when data is loading', () => {
    vi.mocked(attendanceApi.getAttendanceStats).mockImplementation(
      () => new Promise(() => {}) // 무한 대기로 로딩 상태 유지
    );

    renderWithQuery(
      <AttendanceStats classId="test-class-id" date="2025-01-12" />
    );

    expect(screen.getByText(/통계를 불러오는 중/i)).toBeInTheDocument();
  });
});
