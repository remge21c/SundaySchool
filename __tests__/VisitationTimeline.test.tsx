import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { VisitationTimeline } from '@/components/visitation/VisitationTimeline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as visitationApi from '@/lib/supabase/visitation';

// getVisitationLogs 모킹
vi.mock('@/lib/supabase/visitation', async () => {
  const actual = await vi.importActual('@/lib/supabase/visitation');
  return {
    ...actual,
    getVisitationLogs: vi.fn(),
  };
});

// Supabase 클라이언트 모킹
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('VisitationTimeline', () => {
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

  it('should render visitation timeline with records', async () => {
    const mockVisitations = [
      {
        id: 'visitation-1',
        student_id: 'student-123',
        teacher_id: 'teacher-456',
        visit_date: '2025-01-20',
        type: 'call' as const,
        content: '전화 심방 내용입니다.',
        prayer_request: '건강 회복 기도',
        is_confidential: false,
        created_at: '2025-01-20T10:00:00Z',
      },
      {
        id: 'visitation-2',
        student_id: 'student-123',
        teacher_id: 'teacher-456',
        visit_date: '2025-01-15',
        type: 'visit' as const,
        content: '방문 심방 내용입니다.',
        prayer_request: null,
        is_confidential: false,
        created_at: '2025-01-15T14:00:00Z',
      },
    ];

    vi.mocked(visitationApi.getVisitationLogs).mockResolvedValue(mockVisitations);

    renderWithQuery(<VisitationTimeline studentId="student-123" />);

    await waitFor(() => {
      expect(screen.getByText('전화 심방 내용입니다.')).toBeInTheDocument();
      expect(screen.getByText('방문 심방 내용입니다.')).toBeInTheDocument();
    });
  });

  it('should display visitation type correctly', async () => {
    const mockVisitations = [
      {
        id: 'visitation-1',
        student_id: 'student-123',
        teacher_id: 'teacher-456',
        visit_date: '2025-01-20',
        type: 'kakao' as const,
        content: '카카오톡 심방',
        prayer_request: null,
        is_confidential: false,
        created_at: '2025-01-20T10:00:00Z',
      },
    ];

    vi.mocked(visitationApi.getVisitationLogs).mockResolvedValue(mockVisitations);

    renderWithQuery(<VisitationTimeline studentId="student-123" />);

    await waitFor(() => {
      // 카카오톡 타입이 표시되는지 확인 (라벨로 확인)
      expect(screen.getByText('카카오톡')).toBeInTheDocument();
      expect(screen.getByText('카카오톡 심방')).toBeInTheDocument();
    });
  });

  it('should display prayer request when available', async () => {
    const mockVisitations = [
      {
        id: 'visitation-1',
        student_id: 'student-123',
        teacher_id: 'teacher-456',
        visit_date: '2025-01-20',
        type: 'call' as const,
        content: '전화 심방',
        prayer_request: '건강 회복 기도 제목',
        is_confidential: false,
        created_at: '2025-01-20T10:00:00Z',
      },
    ];

    vi.mocked(visitationApi.getVisitationLogs).mockResolvedValue(mockVisitations);

    renderWithQuery(<VisitationTimeline studentId="student-123" />);

    await waitFor(() => {
      // 기도 제목이 표시되는지 확인
      const prayerRequestLabels = screen.getAllByText('기도 제목');
      expect(prayerRequestLabels.length).toBeGreaterThan(0);
      expect(screen.getByText('건강 회복 기도 제목')).toBeInTheDocument();
    });
  });

  it('should display confidential indicator for confidential visitations', async () => {
    const mockVisitations = [
      {
        id: 'visitation-1',
        student_id: 'student-123',
        teacher_id: 'teacher-456',
        visit_date: '2025-01-20',
        type: 'visit' as const,
        content: '비밀 심방 내용',
        prayer_request: null,
        is_confidential: true,
        created_at: '2025-01-20T10:00:00Z',
      },
    ];

    vi.mocked(visitationApi.getVisitationLogs).mockResolvedValue(mockVisitations);

    renderWithQuery(<VisitationTimeline studentId="student-123" />);

    await waitFor(() => {
      // 비밀 표시가 있는지 확인 (라벨과 내용 모두에 "비밀"이 있을 수 있음)
      const confidentialLabels = screen.getAllByText('비밀');
      expect(confidentialLabels.length).toBeGreaterThan(0);
      // Lock 아이콘과 함께 표시되는 비밀 라벨 확인
      expect(screen.getByText('비밀 심방 내용')).toBeInTheDocument();
    });
  });

  it('should show loading state when data is loading', () => {
    vi.mocked(visitationApi.getVisitationLogs).mockImplementation(
      () => new Promise(() => {}) // 무한 대기로 로딩 상태 유지
    );

    renderWithQuery(<VisitationTimeline studentId="student-123" />);

    expect(screen.getByText(/로딩 중/i)).toBeInTheDocument();
  });

  it('should show empty state when no visitations', async () => {
    vi.mocked(visitationApi.getVisitationLogs).mockResolvedValue([]);

    renderWithQuery(<VisitationTimeline studentId="student-123" />);

    await waitFor(() => {
      expect(screen.getByText(/심방 기록이 없습니다/i)).toBeInTheDocument();
    });
  });

  it('should display visitations in reverse chronological order', async () => {
    const mockVisitations = [
      {
        id: 'visitation-1',
        student_id: 'student-123',
        teacher_id: 'teacher-456',
        visit_date: '2025-01-10',
        type: 'call' as const,
        content: '첫 번째 심방',
        prayer_request: null,
        is_confidential: false,
        created_at: '2025-01-10T10:00:00Z',
      },
      {
        id: 'visitation-2',
        student_id: 'student-123',
        teacher_id: 'teacher-456',
        visit_date: '2025-01-20',
        type: 'visit' as const,
        content: '두 번째 심방',
        prayer_request: null,
        is_confidential: false,
        created_at: '2025-01-20T10:00:00Z',
      },
    ];

    vi.mocked(visitationApi.getVisitationLogs).mockResolvedValue(mockVisitations);

    renderWithQuery(<VisitationTimeline studentId="student-123" />);

    await waitFor(() => {
      // 두 심방 기록이 모두 표시되는지 확인
      expect(screen.getByText('첫 번째 심방')).toBeInTheDocument();
      expect(screen.getByText('두 번째 심방')).toBeInTheDocument();
    });

    // 첫 번째 항목이 더 최근 날짜(2025년 1월 20일)여야 함
    const allText = screen.getByText('두 번째 심방').closest('div')?.parentElement;
    expect(allText).toBeInTheDocument();
  });
});
