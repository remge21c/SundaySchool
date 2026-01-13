import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { StudentProfile } from '@/components/student/StudentProfile';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as studentsApi from '@/lib/supabase/students';

// Supabase 클라이언트 모킹
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// getStudentProfile 모킹
vi.mock('@/lib/supabase/students', async () => {
  const actual = await vi.importActual('@/lib/supabase/students');
  return {
    ...actual,
    getStudentProfile: vi.fn(),
  };
});

describe('StudentProfile', () => {
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

  it('should render student profile with basic information', async () => {
    const mockStudent = {
      id: 'student-123',
      name: '김철수',
      birthday: '2010-05-15',
      gender: 'M',
      school_name: '서울초등학교',
      grade: 5,
      parent_contact: '010-1234-5678',
      address: '서울시 강남구',
      allergies: null,
      is_active: true,
      class_id: 'class-456',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    vi.mocked(studentsApi.getStudentProfile).mockResolvedValue(mockStudent);

    renderWithQuery(<StudentProfile studentId="student-123" />);

    await waitFor(() => {
      expect(screen.getByText('김철수')).toBeInTheDocument();
      expect(screen.getByText(/5학년/i)).toBeInTheDocument();
    });
  });

  it('should display student birthday when available', async () => {
    const mockStudent = {
      id: 'student-123',
      name: '김철수',
      birthday: '2010-05-15',
      gender: 'M',
      school_name: '서울초등학교',
      grade: 5,
      parent_contact: '010-1234-5678',
      address: '서울시 강남구',
      allergies: null,
      is_active: true,
      class_id: 'class-456',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    vi.mocked(studentsApi.getStudentProfile).mockResolvedValue(mockStudent);

    renderWithQuery(<StudentProfile studentId="student-123" />);

    await waitFor(() => {
      expect(screen.getByText(/생년월일/i)).toBeInTheDocument();
    });
  });

  it('should display allergies information when available', async () => {
    const mockAllergies = {
      food: ['견과류', '우유'],
      medicine: ['페니실린'],
      other: '심한 알레르기성 비염',
    };

    const mockStudent = {
      id: 'student-123',
      name: '김철수',
      birthday: '2010-05-15',
      gender: 'M',
      school_name: '서울초등학교',
      grade: 5,
      parent_contact: '010-1234-5678',
      address: '서울시 강남구',
      allergies: mockAllergies,
      is_active: true,
      class_id: 'class-456',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    vi.mocked(studentsApi.getStudentProfile).mockResolvedValue(mockStudent);

    renderWithQuery(<StudentProfile studentId="student-123" />);

    await waitFor(() => {
      // 알레르기 정보 섹션이 있는지 확인 (제목과 설명 모두 확인)
      expect(screen.getByText('알레르기 정보')).toBeInTheDocument();
      expect(screen.getByText('주의가 필요한 알레르기 정보입니다')).toBeInTheDocument();
      expect(screen.getByText(/견과류/i)).toBeInTheDocument();
      expect(screen.getByText(/우유/i)).toBeInTheDocument();
    });
  });

  it('should display parent contact information', async () => {
    const mockStudent = {
      id: 'student-123',
      name: '김철수',
      birthday: '2010-05-15',
      gender: 'M',
      school_name: '서울초등학교',
      grade: 5,
      parent_contact: '010-1234-5678',
      address: '서울시 강남구',
      allergies: null,
      is_active: true,
      class_id: 'class-456',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    vi.mocked(studentsApi.getStudentProfile).mockResolvedValue(mockStudent);

    renderWithQuery(<StudentProfile studentId="student-123" />);

    await waitFor(() => {
      expect(screen.getByText(/보호자 연락처/i)).toBeInTheDocument();
      expect(screen.getByText('010-1234-5678')).toBeInTheDocument();
    });
  });

  it('should show loading state when data is loading', () => {
    vi.mocked(studentsApi.getStudentProfile).mockImplementation(
      () => new Promise(() => {}) // 무한 대기로 로딩 상태 유지
    );

    renderWithQuery(<StudentProfile studentId="student-123" />);

    expect(screen.getByText(/로딩 중/i)).toBeInTheDocument();
  });

  it('should show error message when student not found', async () => {
    vi.mocked(studentsApi.getStudentProfile).mockResolvedValue(null);

    renderWithQuery(<StudentProfile studentId="non-existent-id" />);

    await waitFor(() => {
      const errorMessages = screen.getAllByText(/학생을 찾을 수 없습니다/i);
      expect(errorMessages.length).toBeGreaterThan(0);
    });
  });

  it('should display school name when available', async () => {
    const mockStudent = {
      id: 'student-123',
      name: '김철수',
      birthday: '2010-05-15',
      gender: 'M',
      school_name: '서울초등학교',
      grade: 5,
      parent_contact: '010-1234-5678',
      address: '서울시 강남구',
      allergies: null,
      is_active: true,
      class_id: 'class-456',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    vi.mocked(studentsApi.getStudentProfile).mockResolvedValue(mockStudent);

    renderWithQuery(<StudentProfile studentId="student-123" />);

    await waitFor(() => {
      expect(screen.getByText(/학교명/i)).toBeInTheDocument();
      expect(screen.getByText('서울초등학교')).toBeInTheDocument();
    });
  });
});
