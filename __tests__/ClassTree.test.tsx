import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClassTree } from '@/components/class/ClassTree';
import type { Class } from '@/types/class';

// Supabase 클라이언트 모킹 (환경변수 없이 동작하도록)
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

// useAuth 모킹
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-123', email: 'teacher@example.com' },
    loading: false,
    isAuthenticated: true,
  })),
}));

// isAdmin 모킹 - 관리자로 설정하여 모든 반을 표시하도록
vi.mock('@/lib/utils/auth', () => ({
  isAdmin: vi.fn().mockResolvedValue(true),
}));

const mockClasses: Class[] = [
  {
    id: 'class-1',
    name: 'Class A',
    department: 'Youth',
    year: 2025,
    main_teacher_id: 'teacher-1',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'class-2',
    name: 'Class B',
    department: 'Youth',
    year: 2025,
    main_teacher_id: 'teacher-2',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'class-3',
    name: 'Class C',
    department: 'Elementary',
    year: 2025,
    main_teacher_id: 'teacher-3',
    created_at: '2025-01-01T00:00:00Z',
  },
];

// useClasses 훅 모킹 - 관리자용 훅 모킹
vi.mock('@/hooks/useClasses', () => ({
  useAllClasses: vi.fn(() => ({
    data: mockClasses,
    isLoading: false,
    error: null,
  })),
  useClassesByTeacher: vi.fn(() => ({
    data: mockClasses,
    isLoading: false,
    error: null,
  })),
}));

describe('ClassTree', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render departments in tree structure', async () => {
    render(<ClassTree onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByText('Youth')).toBeInTheDocument();
      expect(screen.getByText('Elementary')).toBeInTheDocument();
    });
  });

  it('should show class count in department', async () => {
    render(<ClassTree onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByText('(2)')).toBeInTheDocument(); // Youth has 2 classes
      expect(screen.getByText('(1)')).toBeInTheDocument(); // Elementary has 1 class
    });
  });

  it('should show loading state', async () => {
    const { useAllClasses } = await import('@/hooks/useClasses');
    vi.mocked(useAllClasses).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    } as any);

    render(<ClassTree onSelect={mockOnSelect} />);

    expect(screen.getByText(/로딩 중/i)).toBeInTheDocument();
  });

  it('should show empty state when no classes', async () => {
    const { useAllClasses } = await import('@/hooks/useClasses');
    vi.mocked(useAllClasses).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    render(<ClassTree onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByText(/등록된 반이 없습니다/i)).toBeInTheDocument();
    });
  });
});
