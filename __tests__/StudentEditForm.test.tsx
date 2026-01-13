import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { StudentEditForm } from '@/components/student/StudentEditForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as studentsApi from '@/lib/supabase/students';
import type { Student } from '@/types/student';

// Supabase 클라이언트 모킹
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// updateStudent 모킹
vi.mock('@/lib/supabase/students', async () => {
  const actual = await vi.importActual('@/lib/supabase/students');
  return {
    ...actual,
    updateStudent: vi.fn(),
  };
});

describe('StudentEditForm', () => {
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

  const mockStudent: Student = {
    id: 'student-123',
    name: '김철수',
    birthday: '2010-05-15',
    gender: 'M',
    school_name: '서울초등학교',
    grade: 5,
    parent_contact: '010-1234-5678',
    address: '서울시 강남구',
    allergies: null,
    photo_url: null,
    is_active: true,
    class_id: 'class-456',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const renderWithQuery = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
    );
  };

  it('should render edit form with student data', () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    renderWithQuery(
      <StudentEditForm
        student={mockStudent}
        open={true}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    expect(screen.getByText('학생 정보 수정')).toBeInTheDocument();
    expect(screen.getByDisplayValue('김철수')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    expect(screen.getByDisplayValue('010-1234-5678')).toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    renderWithQuery(
      <StudentEditForm
        student={mockStudent}
        open={true}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    const cancelButton = screen.getByText('취소');
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should update student when form is submitted', async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const updatedStudent = { ...mockStudent, name: '김영희' };

    vi.mocked(studentsApi.updateStudent).mockResolvedValue(updatedStudent);

    renderWithQuery(
      <StudentEditForm
        student={mockStudent}
        open={true}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    // 이름 변경
    const nameInput = screen.getByDisplayValue('김철수');
    fireEvent.change(nameInput, { target: { value: '김영희' } });

    // 저장 버튼 클릭
    const saveButton = screen.getByText('저장');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(studentsApi.updateStudent).toHaveBeenCalledWith('student-123', expect.objectContaining({
        name: '김영희',
      }));
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('should show error message when update fails', async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    vi.mocked(studentsApi.updateStudent).mockRejectedValue(
      new Error('업데이트 실패')
    );

    renderWithQuery(
      <StudentEditForm
        student={mockStudent}
        open={true}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    const saveButton = screen.getByText('저장');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/업데이트 실패/i)).toBeInTheDocument();
    });
  });

  it('should validate required fields', async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    renderWithQuery(
      <StudentEditForm
        student={mockStudent}
        open={true}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    // 이름 필드 비우기
    const nameInput = screen.getByDisplayValue('김철수');
    fireEvent.change(nameInput, { target: { value: '' } });

    // 보호자 연락처 필드 비우기 (HTML5 required 검증 우회를 위해)
    const parentContactInput = screen.getByDisplayValue('010-1234-5678');
    fireEvent.change(parentContactInput, { target: { value: '' } });

    // 저장 버튼 클릭
    const saveButton = screen.getByText('저장');
    fireEvent.click(saveButton);

    // HTML5 required 속성으로 인해 브라우저 기본 검증이 먼저 실행됨
    // JavaScript 검증은 HTML5 검증을 통과한 후에만 실행됨
    // 따라서 updateStudent가 호출되지 않아야 함
    await waitFor(() => {
      expect(studentsApi.updateStudent).not.toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('should handle birthday input', async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const updatedStudent = { ...mockStudent, birthday: '2011-06-20' };

    vi.mocked(studentsApi.updateStudent).mockResolvedValue(updatedStudent);

    renderWithQuery(
      <StudentEditForm
        student={mockStudent}
        open={true}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    // 생년월일 변경
    const birthdayInput = screen.getByDisplayValue('2010-05-15');
    fireEvent.change(birthdayInput, { target: { value: '2011-06-20' } });

    // 저장 버튼 클릭
    const saveButton = screen.getByText('저장');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(studentsApi.updateStudent).toHaveBeenCalledWith('student-123', expect.objectContaining({
        birthday: '2011-06-20',
      }));
    });
  });

  it('should close dialog when update succeeds', async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    vi.mocked(studentsApi.updateStudent).mockResolvedValue(mockStudent);

    renderWithQuery(
      <StudentEditForm
        student={mockStudent}
        open={true}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    const saveButton = screen.getByText('저장');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });
});
