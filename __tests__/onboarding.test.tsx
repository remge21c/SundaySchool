import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnboardingTutorial } from '@/components/onboarding/OnboardingTutorial';

// localStorage 모킹
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('OnboardingTutorial', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  it('should render tutorial for first-time users', () => {
    // localStorage에 완료 기록이 없음
    localStorageMock.removeItem('onboarding_completed');

    render(<OnboardingTutorial />);

    expect(screen.getByText(/반 선택하기/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /다음/i })).toBeInTheDocument();
  });

  it('should not render tutorial if already completed', () => {
    // localStorage에 완료 기록이 있음
    localStorageMock.setItem('onboarding_completed', 'true');

    render(<OnboardingTutorial />);

    expect(screen.queryByText(/반 선택하기/i)).not.toBeInTheDocument();
  });

  it('should show step 1: 반 선택하기', () => {
    localStorageMock.removeItem('onboarding_completed');

    render(<OnboardingTutorial />);

    expect(screen.getByText(/반 선택하기/i)).toBeInTheDocument();
    expect(screen.getByText(/사이드바에서 계층 구조/i)).toBeInTheDocument();
  });

  it('should navigate to step 2 when clicking next', async () => {
    const user = userEvent.setup();
    localStorageMock.removeItem('onboarding_completed');

    render(<OnboardingTutorial />);

    const nextButton = screen.getByRole('button', { name: /다음/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/출석 체크하기/i)).toBeInTheDocument();
    });
  });

  it('should navigate to step 3 when clicking next from step 2', async () => {
    const user = userEvent.setup();
    localStorageMock.removeItem('onboarding_completed');

    render(<OnboardingTutorial />);

    // Step 1 -> Step 2
    const nextButton1 = screen.getByRole('button', { name: /다음/i });
    await user.click(nextButton1);

    await waitFor(() => {
      expect(screen.getByText(/출석 체크하기/i)).toBeInTheDocument();
    });

    // Step 2 -> Step 3
    const nextButton2 = screen.getByRole('button', { name: /다음/i });
    await user.click(nextButton2);

    await waitFor(() => {
      expect(screen.getByText(/심방 기록하기/i)).toBeInTheDocument();
    });
  });

  it('should save completion to localStorage when finished', async () => {
    const user = userEvent.setup();
    localStorageMock.removeItem('onboarding_completed');

    render(<OnboardingTutorial />);

    // Step 1 -> Step 2
    const nextButton1 = screen.getByRole('button', { name: /다음/i });
    await user.click(nextButton1);

    await waitFor(() => {
      expect(screen.getByText(/출석 체크하기/i)).toBeInTheDocument();
    });

    // Step 2 -> Step 3
    const nextButton2 = screen.getByRole('button', { name: /다음/i });
    await user.click(nextButton2);

    await waitFor(() => {
      expect(screen.getByText(/심방 기록하기/i)).toBeInTheDocument();
    });

    // Step 3 -> 완료
    const finishButton = screen.getByRole('button', { name: /완료|시작하기/i });
    await user.click(finishButton);

    await waitFor(() => {
      expect(localStorageMock.getItem('onboarding_completed')).toBe('true');
    });
  });

  it('should allow skipping tutorial', async () => {
    const user = userEvent.setup();
    localStorageMock.removeItem('onboarding_completed');

    render(<OnboardingTutorial />);

    const skipButton = screen.getByRole('button', { name: /건너뛰기/i });
    await user.click(skipButton);

    await waitFor(() => {
      expect(localStorageMock.getItem('onboarding_completed')).toBe('true');
      expect(screen.queryByText(/반 선택하기/i)).not.toBeInTheDocument();
    });
  });

  it('should show previous button from step 2', async () => {
    const user = userEvent.setup();
    localStorageMock.removeItem('onboarding_completed');

    render(<OnboardingTutorial />);

    // Step 1 -> Step 2
    const nextButton = screen.getByRole('button', { name: /다음/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /이전/i })).toBeInTheDocument();
    });
  });

  it('should navigate back to previous step', async () => {
    const user = userEvent.setup();
    localStorageMock.removeItem('onboarding_completed');

    render(<OnboardingTutorial />);

    // Step 1 -> Step 2
    const nextButton = screen.getByRole('button', { name: /다음/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/출석 체크하기/i)).toBeInTheDocument();
    });

    // Step 2 -> Step 1
    const prevButton = screen.getByRole('button', { name: /이전/i });
    await user.click(prevButton);

    await waitFor(() => {
      expect(screen.getByText(/반 선택하기/i)).toBeInTheDocument();
    });
  });
});
