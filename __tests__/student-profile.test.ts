import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getStudentProfile } from '@/lib/supabase/students';
import { supabase } from '@/lib/supabase/client';

// Supabase 클라이언트 모킹
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('Student Profile API', () => {
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockEq = vi.fn();
  const mockSingle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore
    supabase.from.mockReturnValue({
      select: mockSelect,
    });
  });

  describe('getStudentProfile', () => {
    it('should fetch student profile with basic information', async () => {
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

      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });
      mockSingle.mockResolvedValue({
        data: mockStudent,
        error: null,
      });

      const result = await getStudentProfile('student-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('student-123');
      expect(result?.name).toBe('김철수');
      expect(result?.grade).toBe(5);
      expect(supabase.from).toHaveBeenCalledWith('students');
      expect(mockSelect).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'student-123');
    });

    it('should fetch student profile with allergies information', async () => {
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

      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });
      mockSingle.mockResolvedValue({
        data: mockStudent,
        error: null,
      });

      const result = await getStudentProfile('student-123');

      expect(result).toBeDefined();
      expect(result?.allergies).toEqual(mockAllergies);
      const allergies = result?.allergies as { food?: string[]; medicine?: string[]; other?: string };
      expect(allergies?.food).toContain('견과류');
      expect(allergies?.medicine).toContain('페니실린');
    });

    it('should return null when student not found', async () => {
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const result = await getStudentProfile('non-existent-id');

      expect(result).toBeNull();
    });

    it('should throw error for other database errors', async () => {
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST500', message: 'Database error' },
      });

      await expect(getStudentProfile('student-123')).rejects.toThrow();
    });

    it('should include class information when available', async () => {
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

      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });
      mockSingle.mockResolvedValue({
        data: mockStudent,
        error: null,
      });

      const result = await getStudentProfile('student-123');

      expect(result).toBeDefined();
      expect(result?.class_id).toBe('class-456');
    });

    it('should handle RLS policy restrictions', async () => {
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: '42501', message: 'Insufficient privileges' },
      });

      await expect(getStudentProfile('student-123')).rejects.toThrow();
    });
  });
});
