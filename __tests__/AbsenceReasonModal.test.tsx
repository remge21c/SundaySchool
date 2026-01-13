import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AbsenceReasonModal } from '@/components/attendance/AbsenceReasonModal';

describe('AbsenceReasonModal', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render modal when open', () => {
    render(
      <AbsenceReasonModal
        open={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('결석 사유 선택')).toBeInTheDocument();
  });

  it('should not render modal when closed', () => {
    render(
      <AbsenceReasonModal
        open={false}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.queryByText('결석 사유 선택')).not.toBeInTheDocument();
  });

  it('should show predefined absence reasons', () => {
    render(
      <AbsenceReasonModal
        open={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('아픔')).toBeInTheDocument();
    expect(screen.getByText('여행')).toBeInTheDocument();
    expect(screen.getByText('늦잠')).toBeInTheDocument();
    expect(screen.getByText('기타')).toBeInTheDocument();
  });

  it('should call onConfirm with selected reason when confirm button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AbsenceReasonModal
        open={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // 사유 선택
    const reasonButton = screen.getByText('아픔');
    await user.click(reasonButton);

    // 확인 버튼 클릭
    const confirmButton = screen.getByText('확인');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith('아픔');
    });
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AbsenceReasonModal
        open={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('취소');
    await user.click(cancelButton);

    await waitFor(() => {
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  it('should allow custom reason input when "기타" is selected', async () => {
    const user = userEvent.setup();
    render(
      <AbsenceReasonModal
        open={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const otherButton = screen.getByText('기타');
    await user.click(otherButton);

    await waitFor(() => {
      const input = screen.getByPlaceholderText(/결석 사유를 입력하세요/i);
      expect(input).toBeInTheDocument();
    });
  });

  it('should call onConfirm with custom reason when custom input is submitted', async () => {
    const user = userEvent.setup();
    render(
      <AbsenceReasonModal
        open={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // "기타" 선택
    const otherButton = screen.getByText('기타');
    await user.click(otherButton);

    // 커스텀 사유 입력
    await waitFor(() => {
      const input = screen.getByPlaceholderText(/결석 사유를 입력하세요/i);
      expect(input).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/결석 사유를 입력하세요/i);
    await user.type(input, '가족 일정');

    // 확인 버튼 클릭
    const confirmButton = screen.getByText('확인');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith('가족 일정');
    });
  });

  it('should highlight selected reason', async () => {
    const user = userEvent.setup();
    render(
      <AbsenceReasonModal
        open={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const reasonButton = screen.getByText('아픔');
    await user.click(reasonButton);

    await waitFor(() => {
      expect(reasonButton).toHaveClass('bg-primary');
      expect(reasonButton).toHaveClass('text-primary-foreground');
    });
  });
});
