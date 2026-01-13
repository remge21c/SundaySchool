import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';

// Supabase 클라이언트 모킹
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    // @ts-ignore
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);
  });

  it('should return user when authenticated', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'teacher@example.com',
      user_metadata: { full_name: '김교사' },
    };

    // @ts-ignore
    supabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: mockUser,
          access_token: 'token',
          refresh_token: 'refresh',
        },
      },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should return null when not authenticated', async () => {
    // @ts-ignore
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should sign in with email and password', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'teacher@example.com',
    };

    // @ts-ignore
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: mockUser,
        session: {
          user: mockUser,
          access_token: 'token',
          refresh_token: 'refresh',
        },
      },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn('teacher@example.com', 'password123');
    });

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'teacher@example.com',
      password: 'password123',
    });
  });

  it('should handle sign in error', async () => {
    const mockError = { message: 'Invalid credentials' };

    // @ts-ignore
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: mockError,
    });

    const { result } = renderHook(() => useAuth());

    let error: any;
    await act(async () => {
      error = await result.current.signIn('wrong@example.com', 'wrong');
    });

    expect(error).toEqual(mockError);
  });

  it('should sign out', async () => {
    // @ts-ignore
    supabase.auth.signOut.mockResolvedValue({
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signOut();
    });

    expect(supabase.auth.signOut).toHaveBeenCalled();
  });
});
