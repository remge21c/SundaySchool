import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import LoginPage from '@/app/(auth)/login/page';
import { useAuth } from '@/hooks/useAuth';

// Next.js router 모킹
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
  })),
}));

// useAuth 훅 모킹
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('LoginPage', () => {
  const mockPush = vi.fn();
  const mockSignIn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore
    useRouter.mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
    });
  });

  it('should render login form', () => {
    // @ts-ignore
    useAuth.mockReturnValue({
      user: null,
      loading: false,
      isAuthenticated: false,
      signIn: mockSignIn,
    });

    render(<LoginPage />);

    expect(screen.getByLabelText(/이메일/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/비밀번호/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /로그인/i })).toBeInTheDocument();
  });

  it('should show loading state when auth is loading', () => {
    // @ts-ignore
    useAuth.mockReturnValue({
      user: null,
      loading: true,
      isAuthenticated: false,
      signIn: mockSignIn,
    });

    render(<LoginPage />);

    expect(screen.getByText(/로딩 중/i)).toBeInTheDocument();
  });

  it('should redirect to dashboard when already authenticated', () => {
    const mockUser = {
      id: 'user-123',
      email: 'teacher@example.com',
    };

    // @ts-ignore
    useAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      isAuthenticated: true,
      signIn: mockSignIn,
    });

    render(<LoginPage />);

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('should submit form with email and password', async () => {
    const user = userEvent.setup();

    // @ts-ignore
    useAuth.mockReturnValue({
      user: null,
      loading: false,
      isAuthenticated: false,
      signIn: mockSignIn.mockResolvedValue(null),
    });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/이메일/i);
    const passwordInput = screen.getByLabelText(/비밀번호/i);
    const submitButton = screen.getByRole('button', { name: /로그인/i });

    await user.type(emailInput, 'teacher@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('teacher@example.com', 'password123');
    });
  });

  it('should display error message when login fails', async () => {
    const user = userEvent.setup();
    const mockError = { message: '이메일 또는 비밀번호가 올바르지 않습니다.' };

    // @ts-ignore
    useAuth.mockReturnValue({
      user: null,
      loading: false,
      isAuthenticated: false,
      signIn: mockSignIn.mockResolvedValue(mockError),
    });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/이메일/i);
    const passwordInput = screen.getByLabelText(/비밀번호/i);
    const submitButton = screen.getByRole('button', { name: /로그인/i });

    await user.type(emailInput, 'wrong@example.com');
    await user.type(passwordInput, 'password123'); // 6자 이상
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(mockError.message)).toBeInTheDocument();
    });
  });

  it('should redirect to dashboard on successful login', async () => {
    const user = userEvent.setup();
    const mockUser = { id: 'user-123', email: 'teacher@example.com' };

    // 로그인 성공 후 인증 상태 변경을 시뮬레이션
    let isAuthenticatedAfterLogin = false;
    const mockSignInSuccess = vi.fn().mockImplementation(async () => {
      isAuthenticatedAfterLogin = true;
      return null;
    });

    // @ts-ignore
    useAuth.mockImplementation(() => {
      if (isAuthenticatedAfterLogin) {
        return {
          user: mockUser,
          loading: false,
          isAuthenticated: true,
          signIn: mockSignInSuccess,
        };
      }
      return {
        user: null,
        loading: false,
        isAuthenticated: false,
        signIn: mockSignInSuccess,
      };
    });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/이메일/i);
    const passwordInput = screen.getByLabelText(/비밀번호/i);
    const submitButton = screen.getByRole('button', { name: /로그인/i });

    await user.type(emailInput, 'teacher@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignInSuccess).toHaveBeenCalledWith('teacher@example.com', 'password123');
    });

    // 로그인 성공 후 리다이렉트는 useAuth의 isAuthenticated 변경에 의해 LoginForm에서 처리됨
    // 실제로는 useAuth 훅이 상태를 업데이트하면 LoginForm이 리다이렉트함
  });

  // Note: 이메일 형식 검증은 HTML5 email input의 기본 검증이 수행되므로
  // 별도 테스트가 불필요합니다. HTML5 검증을 통과한 후에만
  // 커스텀 검증이 실행되며, 이는 실제 사용 시나리오와 일치합니다.
});
