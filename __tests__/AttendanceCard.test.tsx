import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AttendanceCard } from '@/components/attendance/AttendanceCard';
import type { Student } from '@/types/student';
import type { AttendanceLog } from '@/types/attendance';

const mockStudent: Student = {
  id: 'student-1',
  name: '김철수',
  grade: 3,
  class_id: 'class-456',
  is_active: true,
  parent_contact: '010-1234-5678',
  birthday: null,
  gender: null,
  school_name: null,
  address: null,
  allergies: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

// Mock attendance API
const mockUpsertAttendanceLog = vi.fn();
const mockGetAttendanceLogByStudentAndDate = vi.fn();

vi.mock('@/lib/supabase/attendance', () => ({
  upsertAttendanceLog: () => mockUpsertAttendanceLog(),
  getAttendanceLogByStudentAndDate: () => mockGetAttendanceLogByStudentAndDate(),
}));

// Mock TanStack Query
const mockMutate = vi.fn();
const mockInvalidateQueries = vi.fn();
const mockSetQueryData = vi.fn();
const mockCancelQueries = vi.fn();
const mockGetQueryData = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: mockInvalidateQueries,
    setQueryData: mockSetQueryData,
    cancelQueries: mockCancelQueries,
    getQueryData: mockGetQueryData,
  })),
}));

describe('AttendanceCard', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockCancelQueries.mockResolvedValue(undefined);
    mockGetQueryData.mockReturnValue(null);
    
    const { useQuery, useMutation } = await import('@tanstack/react-query');
    vi.mocked(useQuery).mockReturnValue({
      data: null,
      isLoading: false,
    } as any);
    vi.mocked(useMutation).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any);
  });

  it('should render student name and grade', async () => {
    const today = new Date().toISOString().split('T')[0];

    render(
      <AttendanceCard student={mockStudent} date={today} classId={mockStudent.class_id} />
    );

    expect(screen.getByText('김철수')).toBeInTheDocument();
    expect(screen.getByText('3학년')).toBeInTheDocument();
  });

  it('should show present status when attendance is present', async () => {
    const today = new Date().toISOString().split('T')[0];
    const mockAttendance: AttendanceLog = {
      id: 'log-1',
      student_id: 'student-1',
      class_id: 'class-456',
      date: today,
      status: 'present',
      reason: null,
      created_at: '2025-01-12T10:00:00Z',
    };

    const reactQuery = await import('@tanstack/react-query');
    vi.mocked(reactQuery.useQuery).mockReturnValue({
      data: mockAttendance,
      isLoading: false,
    } as any);

    render(
      <AttendanceCard student={mockStudent} date={today} classId={mockStudent.class_id} />
    );

    await waitFor(() => {
      const card = screen.getByRole('button');
      expect(card).toHaveClass('border-green-500'); // 출석 완료 시 초록색 테두리
    });
  });

  it('should show absent status when attendance is absent', async () => {
    const today = new Date().toISOString().split('T')[0];
    const mockAttendance: AttendanceLog = {
      id: 'log-1',
      student_id: 'student-1',
      class_id: 'class-456',
      date: today,
      status: 'absent',
      reason: '아픔',
      created_at: '2025-01-12T10:00:00Z',
    };

    const reactQuery = await import('@tanstack/react-query');
    vi.mocked(reactQuery.useQuery).mockReturnValue({
      data: mockAttendance,
      isLoading: false,
    } as any);

    render(
      <AttendanceCard student={mockStudent} date={today} classId={mockStudent.class_id} />
    );

    await waitFor(() => {
      const card = screen.getByRole('button');
      expect(card).toHaveClass('border-red-500'); // 결석 시 빨간색 테두리
    });
  });

  it('should toggle attendance status on click', async () => {
    const user = userEvent.setup();
    const today = new Date().toISOString().split('T')[0];

    const reactQuery = await import('@tanstack/react-query');
    vi.mocked(reactQuery.useQuery).mockReturnValue({
      data: null,
      isLoading: false,
    } as any);

    render(
      <AttendanceCard student={mockStudent} date={today} classId={mockStudent.class_id} />
    );

    const card = screen.getByRole('button');
    await user.click(card);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({ status: 'present', reason: undefined });
    });
  });

  it('should toggle from present to late on click when already present', async () => {
    const user = userEvent.setup();
    const today = new Date().toISOString().split('T')[0];
    const mockAttendance: AttendanceLog = {
      id: 'log-1',
      student_id: 'student-1',
      class_id: 'class-456',
      date: today,
      status: 'present',
      reason: null,
      created_at: '2025-01-12T10:00:00Z',
    };

    const reactQuery = await import('@tanstack/react-query');
    vi.mocked(reactQuery.useQuery).mockReturnValue({
      data: mockAttendance,
      isLoading: false,
    } as any);

    render(
      <AttendanceCard student={mockStudent} date={today} classId={mockStudent.class_id} />
    );

    const card = screen.getByRole('button');
    await user.click(card);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({ status: 'late', reason: undefined });
    });
  });

  it('should toggle from late to absent on click when already late', async () => {
    const user = userEvent.setup();
    const today = new Date().toISOString().split('T')[0];
    const mockAttendance: AttendanceLog = {
      id: 'log-1',
      student_id: 'student-1',
      class_id: 'class-456',
      date: today,
      status: 'late',
      reason: null,
      created_at: '2025-01-12T10:00:00Z',
    };

    const reactQuery = await import('@tanstack/react-query');
    vi.mocked(reactQuery.useQuery).mockReturnValue({
      data: mockAttendance,
      isLoading: false,
    } as any);

    render(
      <AttendanceCard student={mockStudent} date={today} classId={mockStudent.class_id} />
    );

    const card = screen.getByRole('button');
    await user.click(card);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({ status: 'absent', reason: undefined });
    });
  });

  it('should toggle from absent to present on click when already absent', async () => {
    const user = userEvent.setup();
    const today = new Date().toISOString().split('T')[0];
    const mockAttendance: AttendanceLog = {
      id: 'log-1',
      student_id: 'student-1',
      class_id: 'class-456',
      date: today,
      status: 'absent',
      reason: '아픔',
      created_at: '2025-01-12T10:00:00Z',
    };

    const reactQuery = await import('@tanstack/react-query');
    vi.mocked(reactQuery.useQuery).mockReturnValue({
      data: mockAttendance,
      isLoading: false,
    } as any);

    render(
      <AttendanceCard student={mockStudent} date={today} classId={mockStudent.class_id} />
    );

    const card = screen.getByRole('button');
    await user.click(card);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({ status: 'present', reason: undefined });
    });
  });

  it('should show loading state during mutation', async () => {
    const today = new Date().toISOString().split('T')[0];

    const reactQuery = await import('@tanstack/react-query');
    vi.mocked(reactQuery.useQuery).mockReturnValue({
      data: null,
      isLoading: false,
    } as any);
    vi.mocked(reactQuery.useMutation).mockReturnValue({
      mutate: mockMutate,
      isPending: true, // 로딩 중
    } as any);

    render(
      <AttendanceCard student={mockStudent} date={today} classId={mockStudent.class_id} />
    );

    const card = screen.getByRole('button');
    expect(card).toHaveClass('opacity-50'); // 로딩 중에는 투명도 적용
  });

  it('should be optimized for mobile (large touch target)', async () => {
    const today = new Date().toISOString().split('T')[0];

    render(
      <AttendanceCard student={mockStudent} date={today} classId={mockStudent.class_id} />
    );

    const card = screen.getByRole('button');
    // 모바일 터치 최적화를 위한 최소 높이 확인 (48px 이상)
    expect(card).toHaveClass('min-h-[48px]');
  });
});
