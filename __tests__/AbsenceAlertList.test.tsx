import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AbsenceAlertList } from '@/components/absence/AbsenceAlertList';
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

describe('AbsenceAlertList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('should render list of absent students', async () => {
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
      <AbsenceAlertList teacherId="teacher-123" />,
      { wrapper: Wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText('김철수')).toBeInTheDocument();
      expect(screen.getByText('이영희')).toBeInTheDocument();
    });
  });

  it('should display days since last attendance', async () => {
    const mockAbsentStudents = [
      {
        student_id: 'student-1',
        student_name: '김철수',
        class_id: 'class-123',
        daysSinceLastAttendance: 25,
        lastAttendanceDate: '2024-01-01',
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
      <AbsenceAlertList teacherId="teacher-123" />,
      { wrapper: Wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText(/25일/)).toBeInTheDocument();
    });
  });

  it('should show empty state when no absent students', async () => {
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
      <AbsenceAlertList teacherId="teacher-123" />,
      { wrapper: Wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText(/장기 결석 학생이 없습니다/i)).toBeInTheDocument();
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
      <AbsenceAlertList teacherId="teacher-123" />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText(/로딩 중/i)).toBeInTheDocument();
  });

  it('should show error state', () => {
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
      <AbsenceAlertList teacherId="teacher-123" />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText(/오류가 발생했습니다/i)).toBeInTheDocument();
  });

  it('should handle click on student item', async () => {
    const mockAbsentStudents = [
      {
        student_id: 'student-1',
        student_name: '김철수',
        class_id: 'class-123',
        daysSinceLastAttendance: 25,
        lastAttendanceDate: '2024-01-01',
      },
    ];

    const mockOnStudentClick = vi.fn();

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
      <AbsenceAlertList teacherId="teacher-123" onStudentClick={mockOnStudentClick} />,
      { wrapper: Wrapper }
    );

    await waitFor(() => {
      const studentItem = screen.getByText('김철수').closest('div');
      expect(studentItem).toBeInTheDocument();
    });

    const studentItem = screen.getByText('김철수').closest('button') || screen.getByText('김철수').closest('div[role="button"]');
    if (studentItem) {
      studentItem.click();
      await waitFor(() => {
        expect(mockOnStudentClick).toHaveBeenCalledWith('student-1');
      });
    }
  });
});
