import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LoginPage from '@/app/(auth)/login/page';

// Next.js router 모킹
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
  })),
}));

describe('LoginPage', () => {
  const mockReplace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore
    useRouter.mockReturnValue({
      push: vi.fn(),
      replace: mockReplace,
    });
  });

  it('should render redirect message', () => {
    render(<LoginPage />);

    expect(screen.getByText('리다이렉트 중...')).toBeInTheDocument();
  });

  it('should redirect to home page', async () => {
    render(<LoginPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });
});
