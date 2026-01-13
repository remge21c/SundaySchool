import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClassTree } from '@/components/class/ClassTree';
import type { Class } from '@/types/class';

// Mock classes API
const mockGetAllClasses = vi.fn();
const mockGetDepartments = vi.fn();

vi.mock('@/lib/supabase/classes', () => ({
  getAllClasses: () => mockGetAllClasses(),
  getDepartments: () => mockGetDepartments(),
}));

// Mock TanStack Query
const mockUseQuery = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: (args: any) => mockUseQuery(args),
}));

const mockClasses: Class[] = [
  {
    id: 'class-1',
    name: '사랑반',
    department: '유년부',
    year: 2025,
    main_teacher_id: 'teacher-1',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'class-2',
    name: '믿음반',
    department: '유년부',
    year: 2025,
    main_teacher_id: 'teacher-2',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'class-3',
    name: '소망반',
    department: '초등부',
    year: 2025,
    main_teacher_id: 'teacher-3',
    created_at: '2025-01-01T00:00:00Z',
  },
];

describe('ClassTree', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({
      data: mockClasses,
      isLoading: false,
    });
  });

  it('should render departments and classes in tree structure', async () => {
    render(<ClassTree onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByText('유년부')).toBeInTheDocument();
      expect(screen.getByText('초등부')).toBeInTheDocument();
    });
  });

  it('should expand department on click', async () => {
    const user = userEvent.setup();
    render(<ClassTree onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByText('유년부')).toBeInTheDocument();
    });

    const departmentButton = screen.getByText('유년부').closest('button');
    if (departmentButton) {
      await user.click(departmentButton);
    }

    await waitFor(() => {
      expect(screen.getByText('사랑반')).toBeInTheDocument();
      expect(screen.getByText('믿음반')).toBeInTheDocument();
    });
  });

  it('should call onSelect when class is clicked', async () => {
    const user = userEvent.setup();
    render(<ClassTree onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByText('유년부')).toBeInTheDocument();
    });

    // 부서 확장
    const departmentButton = screen.getByText('유년부').closest('button');
    if (departmentButton) {
      await user.click(departmentButton);
    }

    await waitFor(() => {
      expect(screen.getByText('사랑반')).toBeInTheDocument();
    });

    // 반 선택
    const classButton = screen.getByText('사랑반').closest('button');
    if (classButton) {
      await user.click(classButton);
    }

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith('class-1');
    });
  });

  it('should show loading state', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(<ClassTree onSelect={mockOnSelect} />);

    expect(screen.getByText(/로딩 중/i)).toBeInTheDocument();
  });

  it('should show empty state when no classes', async () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<ClassTree onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByText(/등록된 반이 없습니다/i)).toBeInTheDocument();
    });
  });

  it('should highlight selected class', async () => {
    const user = userEvent.setup();
    render(<ClassTree onSelect={mockOnSelect} selectedClassId="class-1" />);

    await waitFor(() => {
      expect(screen.getByText('유년부')).toBeInTheDocument();
    });

    // 부서 확장
    const departmentButton = screen.getByText('유년부').closest('button');
    if (departmentButton) {
      await user.click(departmentButton);
    }

    await waitFor(() => {
      const classButton = screen.getByText('사랑반').closest('button');
      expect(classButton).toHaveClass('bg-primary/10'); // 선택된 반 하이라이트
    });
  });
});
