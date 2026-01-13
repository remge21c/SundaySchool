import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VisitationForm } from '@/components/visitation/VisitationForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as visitationApi from '@/lib/supabase/visitation';

// createVisitationLog 모킹
vi.mock('@/lib/supabase/visitation', async () => {
  const actual = await vi.importActual('@/lib/supabase/visitation');
  return {
    ...actual,
    createVisitationLog: vi.fn(),
  };
});

// Supabase 클라이언트 모킹
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('VisitationForm', () => {
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

  it('should render visitation form with all fields', () => {
    const mockOnSuccess = vi.fn();
    renderWithQuery(
      <VisitationForm studentId="student-123" teacherId="teacher-456" onSuccess={mockOnSuccess} />
    );

    expect(screen.getByLabelText(/날짜/i)).toBeInTheDocument();
    // 심방 유형은 role="group"으로 확인
    expect(screen.getByRole('group', { name: /심방 유형 선택/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/심방 내용/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/기도 제목/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/비밀 보장/i)).toBeInTheDocument();
  });

  it('should display visitation type options', () => {
    const mockOnSuccess = vi.fn();
    renderWithQuery(
      <VisitationForm studentId="student-123" teacherId="teacher-456" onSuccess={mockOnSuccess} />
    );

    expect(screen.getByRole('button', { name: /전화/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /심방/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /카카오톡/i })).toBeInTheDocument();
  });

  it('should allow selecting visitation type', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = vi.fn();
    renderWithQuery(
      <VisitationForm studentId="student-123" teacherId="teacher-456" onSuccess={mockOnSuccess} />
    );

    const visitButton = screen.getByRole('button', { name: /심방/i });
    await user.click(visitButton);

    expect(visitButton).toHaveClass(/bg-green/);
  });

  it('should validate required fields before submission', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = vi.fn();
    renderWithQuery(
      <VisitationForm studentId="student-123" teacherId="teacher-456" onSuccess={mockOnSuccess} />
    );

    const submitButton = screen.getByRole('button', { name: /저장/i });
    await user.click(submitButton);

    // 필수 필드 검증 메시지 확인
    await waitFor(() => {
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = vi.fn();
    const mockVisitation = {
      id: 'visitation-789',
      student_id: 'student-123',
      teacher_id: 'teacher-456',
      visit_date: '2025-01-15',
      type: 'call' as const,
      content: '전화 심방 내용',
      prayer_request: '기도 제목',
      is_confidential: false,
      created_at: '2025-01-15T10:00:00Z',
    };

    vi.mocked(visitationApi.createVisitationLog).mockResolvedValue(mockVisitation);

    renderWithQuery(
      <VisitationForm studentId="student-123" teacherId="teacher-456" onSuccess={mockOnSuccess} />
    );

    // 날짜 입력 - fireEvent를 사용하여 직접 값을 설정
    const dateInput = screen.getByLabelText(/날짜/i) as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2025-01-15' } });
    expect(dateInput.value).toBe('2025-01-15');

    // 심방 유형 선택
    const callButton = screen.getByRole('button', { name: /전화/i });
    await user.click(callButton);

    // 심방 내용 입력
    const contentInput = screen.getByLabelText(/심방 내용/i);
    await user.type(contentInput, '전화 심방 내용');

    // 기도 제목 입력
    const prayerInput = screen.getByLabelText(/기도 제목/i);
    await user.type(prayerInput, '기도 제목');

    // 제출
    const submitButton = screen.getByRole('button', { name: /저장/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(visitationApi.createVisitationLog).toHaveBeenCalledWith({
        student_id: 'student-123',
        teacher_id: 'teacher-456',
        visit_date: '2025-01-15',
        type: 'call',
        content: '전화 심방 내용',
        prayer_request: '기도 제목',
        is_confidential: false,
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should handle confidential option', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = vi.fn();
    const mockVisitation = {
      id: 'visitation-789',
      student_id: 'student-123',
      teacher_id: 'teacher-456',
      visit_date: '2025-01-15',
      type: 'visit' as const,
      content: '비밀 심방 내용',
      prayer_request: null,
      is_confidential: true,
      created_at: '2025-01-15T10:00:00Z',
    };

    vi.mocked(visitationApi.createVisitationLog).mockResolvedValue(mockVisitation);

    renderWithQuery(
      <VisitationForm studentId="student-123" teacherId="teacher-456" onSuccess={mockOnSuccess} />
    );

    // 날짜 입력 - fireEvent를 사용하여 직접 값을 설정
    const dateInput = screen.getByLabelText(/날짜/i) as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2025-01-15' } });
    expect(dateInput.value).toBe('2025-01-15');

    // 심방 유형 선택
    const visitButton = screen.getByRole('button', { name: /심방/i });
    await user.click(visitButton);

    // 심방 내용 입력
    const contentInput = screen.getByLabelText(/심방 내용/i);
    await user.type(contentInput, '비밀 심방 내용');

    // 비밀 보장 체크
    const confidentialCheckbox = screen.getByLabelText(/비밀 보장/i);
    await user.click(confidentialCheckbox);

    // 제출
    const submitButton = screen.getByRole('button', { name: /저장/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(visitationApi.createVisitationLog).toHaveBeenCalledWith(
        expect.objectContaining({
          is_confidential: true,
        })
      );
    });
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = vi.fn();

    // 무한 대기로 로딩 상태 유지
    vi.mocked(visitationApi.createVisitationLog).mockImplementation(
      () => new Promise(() => {})
    );

    renderWithQuery(
      <VisitationForm studentId="student-123" teacherId="teacher-456" onSuccess={mockOnSuccess} />
    );

    // 필수 필드 입력
    const dateInput = screen.getByLabelText(/날짜/i) as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2025-01-15' } });

    const callButton = screen.getByRole('button', { name: /전화/i });
    await user.click(callButton);

    const contentInput = screen.getByLabelText(/심방 내용/i);
    await user.type(contentInput, '전화 심방 내용');

    const submitButton = screen.getByRole('button', { name: /저장/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/저장 중/i)).toBeInTheDocument();
    });
    
    expect(submitButton).toBeDisabled();
  });

  it('should handle submission error', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = vi.fn();
    const mockError = new Error('심방 기록 생성에 실패했습니다.');

    vi.mocked(visitationApi.createVisitationLog).mockRejectedValue(mockError);

    renderWithQuery(
      <VisitationForm studentId="student-123" teacherId="teacher-456" onSuccess={mockOnSuccess} />
    );

    // 필수 필드 입력
    const dateInput = screen.getByLabelText(/날짜/i) as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2025-01-15' } });
    expect(dateInput.value).toBe('2025-01-15');

    const callButton = screen.getByRole('button', { name: /전화/i });
    await user.click(callButton);

    const contentInput = screen.getByLabelText(/심방 내용/i);
    await user.type(contentInput, '전화 심방 내용');

    const submitButton = screen.getByRole('button', { name: /저장/i });
    await user.click(submitButton);

    await waitFor(() => {
      // 에러 메시지가 표시되는지 확인 (에러 메시지가 실제로 표시될 때까지 대기)
      expect(visitationApi.createVisitationLog).toHaveBeenCalled();
    }, { timeout: 3000 });

    // 에러 발생 후 에러 메시지 확인
    await waitFor(() => {
      const errorMessage = screen.queryByText(/오류|실패|다시 시도|심방 기록 저장/i);
      expect(errorMessage).toBeInTheDocument();
    }, { timeout: 2000 });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });
});
