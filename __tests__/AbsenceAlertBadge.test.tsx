import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AbsenceAlertBadge } from '@/components/absence/AbsenceAlertBadge';
import * as absenceAlertHook from '@/hooks/useAbsenceAlerts';

// Mock the hook
vi.mock('@/hooks/useAbsenceAlerts', () => ({
  useAbsenceAlerts: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('AbsenceAlertBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('should render badge with count when there are absent students', async () => {
    const mockAbsentStudents = [
      {
        student_id: 'student-1',
        student_name: '김철수',
        class_id: 'class-123',
        daysSinceLastAttendance: 25,
        lastAttendanceDate: '2024-01-01',
      },
      {
        student_id: 'student-2',
        student_name: '이영희',
        class_id: 'class-123',
        daysSinceLastAttendance: 30,
        lastAttendanceDate: null,
      },
    ];

    vi.mocked(absenceAlertHook.useAbsenceAlerts).mockReturnValue({
      data: mockAbsentStudents,
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
      isRefetching: false,
      status: 'success',
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isInitialLoading: false,
      isLoadingError: false,
      isPaused: false,
      isPlaceholderData: false,
      isRefetchError: false,
      isStale: false,
      refetch: vi.fn(),
      fetchStatus: 'idle',
    } as any);

    render(
      <AbsenceAlertBadge teacherId="teacher-123" />,
      { wrapper: Wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('should not render badge when there are no absent students', async () => {
    vi.mocked(absenceAlertHook.useAbsenceAlerts).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
      isRefetching: false,
      status: 'success',
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isInitialLoading: false,
      isLoadingError: false,
      isPaused: false,
      isPlaceholderData: false,
      isRefetchError: false,
      isStale: false,
      refetch: vi.fn(),
      fetchStatus: 'idle',
    } as any);

    render(
      <AbsenceAlertBadge teacherId="teacher-123" />,
      { wrapper: Wrapper }
    );

    await waitFor(() => {
      expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
    });
  });

  it('should show loading state', () => {
    vi.mocked(absenceAlertHook.useAbsenceAlerts).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      isFetching: true,
      isRefetching: false,
      status: 'loading',
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: false,
      isFetchedAfterMount: false,
      isInitialLoading: true,
      isLoadingError: false,
      isPaused: false,
      isPlaceholderData: false,
      isRefetchError: false,
      isStale: false,
      refetch: vi.fn(),
      fetchStatus: 'fetching',
    } as any);

    render(
      <AbsenceAlertBadge teacherId="teacher-123" />,
      { wrapper: Wrapper }
    );

    // 로딩 중에는 배지가 표시되지 않아야 함
    expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
  });

  it('should handle error state gracefully', () => {
    const mockError = new Error('Failed to fetch');
    vi.mocked(absenceAlertHook.useAbsenceAlerts).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: mockError,
      isFetching: false,
      isRefetching: false,
      status: 'error',
      dataUpdatedAt: 0,
      errorUpdatedAt: Date.now(),
      failureCount: 1,
      failureReason: mockError,
      errorUpdateCount: 1,
      isFetched: false,
      isFetchedAfterMount: false,
      isInitialLoading: false,
      isLoadingError: true,
      isPaused: false,
      isPlaceholderData: false,
      isRefetchError: false,
      isStale: false,
      refetch: vi.fn(),
      fetchStatus: 'idle',
    } as any);

    render(
      <AbsenceAlertBadge teacherId="teacher-123" />,
      { wrapper: Wrapper }
    );

    // 에러 발생 시 배지가 표시되지 않아야 함
    expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
  });

  it('should use class_id when provided', () => {
    vi.mocked(absenceAlertHook.useAbsenceAlerts).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
      isRefetching: false,
      status: 'success',
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isInitialLoading: false,
      isLoadingError: false,
      isPaused: false,
      isPlaceholderData: false,
      isRefetchError: false,
      isStale: false,
      refetch: vi.fn(),
      fetchStatus: 'idle',
    } as any);

    render(
      <AbsenceAlertBadge classId="class-123" />,
      { wrapper: Wrapper }
    );

    expect(absenceAlertHook.useAbsenceAlerts).toHaveBeenCalledWith({
      class_id: 'class-123',
      weeks: undefined,
    });
  });

  it('should use custom weeks parameter', () => {
    vi.mocked(absenceAlertHook.useAbsenceAlerts).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
      isRefetching: false,
      status: 'success',
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isInitialLoading: false,
      isLoadingError: false,
      isPaused: false,
      isPlaceholderData: false,
      isRefetchError: false,
      isStale: false,
      refetch: vi.fn(),
      fetchStatus: 'idle',
    } as any);

    render(
      <AbsenceAlertBadge teacherId="teacher-123" weeks={4} />,
      { wrapper: Wrapper }
    );

    expect(absenceAlertHook.useAbsenceAlerts).toHaveBeenCalledWith({
      teacher_id: 'teacher-123',
      weeks: 4,
    });
  });
});
